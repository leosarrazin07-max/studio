
'use server';

import * as webpush from 'web-push';
import { z } from 'zod';
import { add, formatDistance, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { PROTECTION_START_HOURS, DOSE_INTERVAL_HOURS, LAPSES_AFTER_HOURS } from '@/lib/constants';

// These are automatically populated by App Hosting.
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY as string;
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string;

const CRON_JOB_INTERVAL_MINUTES = 5;

let isInitialized = false;

function initializeServices() {
    if (isInitialized) return;

    // Initialize Firebase Admin SDK
    if (admin.apps.length === 0) {
        // App Hosting provides configuration automatically.
        admin.initializeApp();
    }

    // Initialize web-push
    if (VAPID_PRIVATE_KEY && VAPID_PUBLIC_KEY) {
        webpush.setVapidDetails(
            'mailto:contact@prepy.app',
            VAPID_PUBLIC_KEY,
            VAPID_PRIVATE_KEY
        );
    } else {
        console.error("VAPID keys are missing. Push notifications will fail.");
    }
    
    isInitialized = true;
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

export async function handleCron() {
    initializeServices();
    
    if (!VAPID_PRIVATE_KEY) {
        throw new Error("VAPID_PRIVATE_KEY is not set. Cannot proceed.");
    }

    const now = new Date();
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
            const subscription = subscriptionDoc.data();

            const firstDose = state.doses.find(d => d.type === 'start');
            const lastDose = state.doses.filter(d => d.type !== "stop").sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())[0];

            if (!lastDose || !firstDose) continue;

            const cronWindow = {
                start: now,
                end: add(now, { minutes: CRON_JOB_INTERVAL_MINUTES })
            };

            // --- Protection Start Notification ---
            const protectionStartTime = add(new Date(firstDose.time), { hours: PROTECTION_START_HOURS });
            if (!state.protectionNotified && isWithinInterval(protectionStartTime, cronWindow)) {
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
            const lastDoseTime = new Date(lastDose.time);
            const reminderTime = add(lastDoseTime, { hours: DOSE_INTERVAL_HOURS }); // Exactly 24h after last dose
            if (isWithinInterval(reminderTime, cronWindow)) {
                const protectionLapsesTime = add(lastDoseTime, { hours: LAPSES_AFTER_HOURS });
                const timeRemaining = formatDistance(protectionLapsesTime, now, { locale: fr, addSuffix: false });
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
