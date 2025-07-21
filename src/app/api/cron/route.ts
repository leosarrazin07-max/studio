
import { NextResponse } from 'next/server';
import * as admin from "firebase-admin";
import * as webpush from "web-push";
import { z } from "zod";
import { add } from "date-fns";
import { formatDistance } from "date-fns";
import { fr } from "date-fns/locale";
import { utcToZonedTime } from "date-fns-tz";
import serviceAccount from '../../../../service-account.json';

// Initialize Firebase Admin SDK
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
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
    "VAPID keys are missing. Push notifications will fail."
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
  nextNotificationTime: z.string().datetime().optional().nullable(),
});

const SubscriptionSchema = z.object({
    endpoint: z.string(),
    expirationTime: z.any().nullable(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
    timezone: z.string().optional().default('Europe/Paris'),
});

const constants = {
  PROTECTION_START_HOURS: 2,
  DOSE_INTERVAL_HOURS: 24,
  LAPSES_AFTER_HOURS: 28,
};

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
    const windowEnd = add(serverNow, { minutes: CRON_JOB_INTERVAL_MINUTES });

    const statesSnapshot = await db.collection('states')
        .where('sessionActive', '==', true)
        .where('pushEnabled', '==', true)
        .where('nextNotificationTime', '>=', serverNow.toISOString())
        .where('nextNotificationTime', '<', windowEnd.toISOString())
        .get();


    if (statesSnapshot.empty) {
        console.log("No states to process for this window. Exiting.");
        return { notificationsSent: 0, errorsEncountered: 0 };
    }

    console.log(`Processing ${statesSnapshot.size} states for notifications.`);
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

            const subscriptionDoc = await db.collection('subscriptions').doc(docId).get();
            if (!subscriptionDoc.exists) {
                console.warn(`Subscription not found for state ${docId}. Skipping.`);
                continue;
            }

            const subParseResult = SubscriptionSchema.safeParse(subscriptionDoc.data());
             if (!subParseResult.success) {
                console.warn(`Invalid subscription for doc ${docId}:`, subParseResult.error.flatten());
                continue;
            }
            const subscription = subParseResult.data;
            const userTimezone = subscription.timezone || 'Europe/Paris';
            
            const firstDose = state.doses.find(d => d.type === 'start');
            const lastDose = state.doses.filter(d => d.type !== "stop").sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())[0];

            if (!lastDose || !firstDose || !state.nextNotificationTime) continue;
            
            const lastDoseTime = new Date(lastDose.time);
            const firstDoseTime = new Date(firstDose.time);

            const nextNotificationTime = new Date(state.nextNotificationTime);
            const protectionStartTime = add(firstDoseTime, { hours: constants.PROTECTION_START_HOURS });

            if (!state.protectionNotified && nextNotificationTime.getTime() === protectionStartTime.getTime()) {
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
            } else { 
                const userNow = utcToZonedTime(new Date(), userTimezone);
                const protectionLapsesTime = add(lastDoseTime, { hours: constants.LAPSES_AFTER_HOURS });
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

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 });
    }
  
    try {
      const result = await processCron();
      return NextResponse.json(result);
    } catch (error) {
      console.error("Cron job API route failed:", error);
      return NextResponse.json({ success: false, error: 'Cron job failed' }, { status: 500 });
    }
}
