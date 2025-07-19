
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as webpush from "web-push";
import { z } from "zod";
import { add } from "date-fns";
import { formatInTimeZone, zonedTimeToUtc, utcToZonedTime, formatDistance } from "date-fns-tz";
import { fr } from "date-fns/locale";

// Initialize Firebase Admin SDK
admin.initializeApp();
const db = admin.firestore();

// Initialize web-push
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:contact@prepy.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.error(
    "VAPID keys are missing from Firebase functions config. Push notifications will fail."
  );
}

const CRON_JOB_INTERVAL_MINUTES = 5;

const DoseSchema = z.object({
  time: z.string().datetime(),
  pills: z.number(),
  type: z.string(),
  id: z.string(),
});

const StateSchema = z.object({
  doses: z.array(DoseSchema),
  sessionActive: z.boolean(),
  pushEnabled: z.boolean(),
  protectionNotified: z.boolean().optional(),
});

const SubscriptionSchema = z.object({
    endpoint: z.string(),
    expirationTime: z.any().nullable(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
    timezone: z.string().optional().default('Europe/Paris'), // Default to Paris if not provided
});

const constants = {
  PROTECTION_START_HOURS: 2,
  DOSE_INTERVAL_HOURS: 24,
  LAPSES_AFTER_HOURS: 28,
};

// Helper function to check if a target time falls within the next N minutes from now (in the user's timezone)
function isWithinNextMinutes(targetTime: Date, userNow: Date, minutes: number): boolean {
    const windowEnd = add(userNow, { minutes });
    return targetTime >= userNow && targetTime < windowEnd;
}


async function sendNotification(subscription: any, payload: string) {
    try {
        await webpush.sendNotification(subscription, payload);
        return { success: true };
    } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
            return { success: false, error, shouldDelete: true };
        }
        return { success: false, error, shouldDelete: false };
    }
}

async function deleteSubscriptionAndState(docId: string) {
    console.warn(`Subscription for doc ${docId} is no longer valid. Deleting.`);
    const subRef = db.collection('subscriptions').doc(docId);
    const stateRef = db.collection('states').doc(docId);
    await db.batch().delete(subRef).delete(stateRef).commit();
}

async function processCron() {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        throw new Error("VAPID keys are not set. Cannot proceed.");
    }

    const serverNow = new Date();
    const statesSnapshot = await db.collection('states').get();

    if (statesSnapshot.empty) {
        return { notificationsSent: 0, errorsEncountered: 0 };
    }

    let notificationsSent = 0;
    let errorsEncountered = 0;

    for (const doc of statesSnapshot.docs) {
        const docId = doc.id;
        const stateData = doc.data();

        try {
            const parseResult = StateSchema.safeParse(stateData);
            if (!parseResult.success) {
                console.warn(`Invalid state for doc ${docId}:`, parseResult.error.flatten());
                continue;
            }
            const state = parseResult.data;

            if (!state.sessionActive || !state.pushEnabled || state.doses.length === 0) {
                continue;
            }

            const subscriptionDoc = await db.collection('subscriptions').doc(docId).get();
            if (!subscriptionDoc.exists) {
                continue;
            }

            const subParseResult = SubscriptionSchema.safeParse(subscriptionDoc.data());
             if (!subParseResult.success) {
                console.warn(`Invalid subscription for doc ${docId}:`, subParseResult.error.flatten());
                continue;
            }
            const subscription = subParseResult.data;
            const userTimezone = subscription.timezone;
            const userNow = utcToZonedTime(serverNow, userTimezone);

            const firstDose = state.doses.find(d => d.type === 'start');
            const lastDose = state.doses.filter(d => d.type !== "stop").sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())[0];

            if (!lastDose || !firstDose) continue;
            
            const firstDoseTimeInUserTz = zonedTimeToUtc(firstDose.time, userTimezone);
            const lastDoseTimeInUserTz = zonedTimeToUtc(lastDose.time, userTimezone);
            
            // --- Protection Start Notification ---
            const protectionStartTime = add(firstDoseTimeInUserTz, { hours: constants.PROTECTION_START_HOURS });
            if (!state.protectionNotified && isWithinNextMinutes(protectionStartTime, userNow, CRON_JOB_INTERVAL_MINUTES)) {
                 const payload = JSON.stringify({ title: "PrEPy: Protection Active !", body: "Votre protection est maintenant active. Continuez à prendre vos doses régulièrement." });
                 const { success, error, shouldDelete } = await sendNotification(subscription, payload);
                 if (success) {
                    notificationsSent++;
                    await db.collection('states').doc(docId).update({ protectionNotified: true });
                 } else if (shouldDelete) {
                    await deleteSubscriptionAndState(docId);
                 } else {
                    console.error(`Failed to send protection notification to ${docId}:`, error);
                 }
                 continue; // Process only one notification type per run
            }
            
            // --- Dose Reminder Notification ---
            const reminderTime = add(lastDoseTimeInUserTz, { hours: constants.DOSE_INTERVAL_HOURS });
            if (isWithinNextMinutes(reminderTime, userNow, CRON_JOB_INTERVAL_MINUTES)) {
                const protectionLapsesTime = add(lastDoseTimeInUserTz, { hours: constants.LAPSES_AFTER_HOURS });
                const timeRemaining = formatDistance(protectionLapsesTime, userNow, { locale: fr, addSuffix: false });
                const title = "Rappel PrEP : il est temps !";
                const body = `Prenez votre dose pour rester protégé. Il vous reste environ ${timeRemaining}.`;
                const payload = JSON.stringify({ title, body });
                const { success, error, shouldDelete } = await sendNotification(subscription, payload);

                if (success) {
                    notificationsSent++;
                } else if (shouldDelete) {
                    await deleteSubscriptionAndState(docId);
                } else {
                    console.error(`Failed to send reminder to ${docId}:`, error);
                }
            }
        } catch (error) {
            console.error(`Failed to process state for doc ${docId}:`, error);
            errorsEncountered++;
        }
    }

    return { notificationsSent, errorsEncountered };
}

export const cronJob = functions.region("europe-west9").runWith({
    secrets: ["CRON_SECRET", "VAPID_PRIVATE_KEY"],
    env: {
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
    }
}).https.onRequest(async (req, res) => {
    // Secure the function with a secret header check.
    const cronSecret = req.headers['x-cron-secret'];
    if (cronSecret !== process.env.CRON_SECRET) {
      console.error('Unauthorized attempt to run cron job. Missing or invalid secret.');
      res.status(401).send('Unauthorized');
      return;
    }
    
    try {
        const result = await processCron();
        console.log('Cron job finished successfully.', result);
        res.status(200).json(result);
    } catch (error: any) {
        console.error("Cron job function failed catastrophically:", error);
        res.status(500).json({ success: false, error: 'Cron job failed', details: error.message });
    }
});
