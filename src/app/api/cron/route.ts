
import { NextResponse } from 'next/server';
import * as webpush from 'web-push';
import { z } from 'zod';
import { add, formatDistance, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { PROTECTION_START_HOURS, DOSE_INTERVAL_HOURS, LAPSES_AFTER_HOURS } from '@/lib/constants';

const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY as string;
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string;

const CRON_JOB_INTERVAL_MINUTES = 5;

// Helper function to initialize the app, ensuring it's only done once.
const initializeAdminApp = () => {
    if (admin.apps.length === 0) {
        // When running on App Hosting, the SDK automatically discovers the service account credentials.
        admin.initializeApp();
    }
    return admin;
};

// Initialize Firebase Admin SDK and web-push
try {
    initializeAdminApp();
    if (VAPID_PRIVATE_KEY && VAPID_PUBLIC_KEY) {
        webpush.setVapidDetails(
          'mailto:contact@prepy.app',
          VAPID_PUBLIC_KEY,
          VAPID_PRIVATE_KEY
        );
    }
} catch (error) {
    console.error("Failed to initialize Firebase Admin or web-push", error);
}

const db = getFirestore();

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

async function sendNotification(subscription: any, payload: string) {
    try {
        await webpush.sendNotification(subscription, payload);
        return { success: true };
    } catch (error: any) {
        if (error instanceof webpush.WebPushError && (error.statusCode === 410 || error.statusCode === 404)) {
            // Subscription is no longer valid
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


export async function GET(request: Request) {
  // OIDC authentication is automatically verified by Cloud Run/App Hosting.
  // We just need to check for the presence of the header.
  const oidcHeader = request.headers.get('x-goog-iap-jwt-assertion');
  if (!oidcHeader && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
  }

  if (!VAPID_PRIVATE_KEY) {
    console.error("VAPID_PRIVATE_KEY is not set.");
    return NextResponse.json({ success: false, error: "Server configuration incomplete." }, { status: 500 });
  }

  try {
    const now = new Date();

    const statesSnapshot = await db.collection('states').get();
    if (statesSnapshot.empty) {
      return NextResponse.json({ success: true, message: "No active states to process." });
    }
    
    let notificationsSent = 0;
    let errorsEncountered = 0;

    for (const doc of statesSnapshot.docs) {
      const docId = doc.id;
      const stateData = doc.data();

      try {
        const parseResult = StateSchema.safeParse(stateData);
        if (!parseResult.success) {
            console.warn(`Invalid state for doc ${docId}:`, parseResult.error);
            continue;
        }
        const parsedState = parseResult.data;
        
        if (!parsedState.sessionActive || !parsedState.pushEnabled || parsedState.doses.length === 0) {
          continue;
        }

        const subscriptionDoc = await db.collection('subscriptions').doc(docId).get();
        if (!subscriptionDoc.exists) {
            continue;
        }
        const subscription = subscriptionDoc.data();

        const firstDose = parsedState.doses.find(d => d.type === 'start');
        const lastDose = parsedState.doses.filter(d => d.type !== "stop").sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())[0];

        if (!lastDose || !firstDose) continue;

        // --- Logic for Protection Start Notification (at 2 hours) ---
        if (!parsedState.protectionNotified) {
            const protectionStartTime = add(new Date(firstDose.time), { hours: PROTECTION_START_HOURS });
            const notificationWindowStart = protectionStartTime;
            const notificationWindowEnd = add(notificationWindowStart, { minutes: CRON_JOB_INTERVAL_MINUTES });
            
            if (isAfter(now, notificationWindowStart) && isBefore(now, notificationWindowEnd)) {
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
                continue; 
            }
        }
        
        // --- Logic for Recurring Dose Reminder (22-26h window) ---
        const lastDoseTime = new Date(lastDose.time);
        const reminderWindowStart = add(lastDoseTime, { hours: DOSE_INTERVAL_HOURS - 2 });
        const reminderWindowEnd = add(lastDoseTime, { hours: LAPSES_AFTER_HOURS });

        if (isAfter(now, reminderWindowStart) && isBefore(now, reminderWindowEnd)) {
            const timeRemaining = formatDistance(reminderWindowEnd, now, { locale: fr, addSuffix: false });
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
    
    return NextResponse.json({ success: true, message: `Cron job finished. Sent ${notificationsSent} notifications. Encountered ${errorsEncountered} errors.` });
  } catch (error: any) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ success: false, error: 'Cron job failed', details: error.message }, { status: 500 });
  }
}
