
'use server';
/**
 * @fileOverview Manages push notification subscriptions and sends reminders via a cron job.
 *
 * - saveSubscription - Saves a user's push notification subscription to Firestore.
 * - scheduleDoseReminders - Saves the user's current dose session state to Firestore.
 * - endSessionForUser - Clears a user's session data from Firestore.
 * - checkAndSendReminders - (FOR CRON JOB) Checks all active sessions and sends notifications if due.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { add, isAfter, differenceInMinutes, isBefore } from 'date-fns';
import * as webpush from 'web-push';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { DOSE_INTERVAL_HOURS, GRACE_PERIOD_HOURS, PROTECTION_START_HOURS } from '@/lib/constants';

// --- Types ---
interface SessionData {
    lastDoseTime: string; // ISO string
    firstDoseTime: string; // ISO string
    subscriptionEndpoint: string; // To link session to subscription
    protectionNotified: boolean; // To ensure protection notification is sent only once
}

// --- Firebase Admin SDK Setup ---
try {
    if (!getApps().length) {
        if (process.env.FIREBASE_CONFIG && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
            initializeApp();
        } else {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
            initializeApp({
                credential: cert(serviceAccount)
            });
        }
    }
} catch (error) {
    console.error("Firebase Admin initialization error:", error);
}

const db = getFirestore();
const subscriptionsCollection = db.collection('subscriptions');
const sessionsCollection = db.collection('sessions');

// --- Web Push Configuration ---
const vapidKeys = {
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BGEPqO_1POfO9s3j01tpkLdYd-v1jYYtMGTcwaxgQ2I_exGj155R8Xk-sXeyV6ORHIq8n4XhGzAsaKxV9wJzO6w',
    privateKey: process.env.VAPID_PRIVATE_KEY || 'WBgYgqfS2_RA5k0hKj0oYfTBsQjH6qIHUgYyU-w-wM0'
};

if (vapidKeys.publicKey && vapidKeys.privateKey) {
    webpush.setVapidDetails(
        'mailto:example@yourdomain.org',
        vapidKeys.publicKey,
        vapidKeys.privateKey
    );
}

// --- Helper Functions ---
const sendNotification = async (endpoint: string, payload: string) => {
    try {
        const subDoc = await subscriptionsCollection.doc(encodeURIComponent(endpoint)).get();
        if (!subDoc.exists) {
            console.error(`Subscription not found for endpoint: ${endpoint}`);
            return;
        }
        const subscription = subDoc.data() as webpush.PushSubscription;
        await webpush.sendNotification(subscription, payload);
        console.log(`Notification sent to ${endpoint}`);
    } catch (error: any) {
        console.error('Error sending notification, removing subscription:', error.body || error.message);
        if (error.statusCode === 410) { // 410 Gone
            await subscriptionsCollection.doc(encodeURIComponent(endpoint)).delete();
            await sessionsCollection.doc(encodeURIComponent(endpoint)).delete();
        }
    }
};

// --- Zod Schemas ---
const SubscriptionSchema = z.object({
    endpoint: z.string(),
    keys: z.object({
        p256dh: z.string(),
        auth: z.string(),
    }),
});

const ScheduleSchema = z.object({
    lastDoseTime: z.string().datetime(),
    firstDoseTime: z.string().datetime(),
    isFirstDose: z.boolean(),
    subscriptionEndpoint: z.string(),
});

const EndSessionSchema = z.object({
    subscriptionEndpoint: z.string(),
});


// --- Genkit Flows ---

export const saveSubscription = ai.defineFlow(
  {
    name: 'saveSubscription',
    inputSchema: SubscriptionSchema,
    outputSchema: z.boolean(),
  },
  async (subscription) => {
    try {
        const subRef = subscriptionsCollection.doc(encodeURIComponent(subscription.endpoint));
        await subRef.set(subscription);
        console.log('Subscription saved to Firestore.');
        return true;
    } catch (error) {
        console.error("Error saving subscription to Firestore:", error);
        return false;
    }
  }
);

export const scheduleDoseReminders = ai.defineFlow(
    {
        name: 'scheduleDoseReminders',
        inputSchema: ScheduleSchema,
        outputSchema: z.boolean(),
    },
    async (sessionData) => {
        try {
            const sessionRef = sessionsCollection.doc(encodeURIComponent(sessionData.subscriptionEndpoint));
            
            if (sessionData.isFirstDose) {
                // This is a new session
                await sessionRef.set({
                    lastDoseTime: sessionData.lastDoseTime,
                    firstDoseTime: sessionData.firstDoseTime,
                    subscriptionEndpoint: sessionData.subscriptionEndpoint,
                    protectionNotified: false, // Set to false on new session
                });
            } else {
                // This is an update to an existing session (new dose)
                await sessionRef.update({
                    lastDoseTime: sessionData.lastDoseTime,
                });
            }
            
            console.log("Session saved to Firestore for endpoint:", sessionData.subscriptionEndpoint);
            return true;
        } catch (error) {
            console.error("Error saving session to Firestore:", error);
            return false;
        }
    }
);

export const endSessionForUser = ai.defineFlow(
    {
        name: 'endSessionForUser',
        inputSchema: EndSessionSchema,
        outputSchema: z.boolean(),
    },
    async ({ subscriptionEndpoint }) => {
        try {
            const sessionRef = sessionsCollection.doc(encodeURIComponent(subscriptionEndpoint));
            await sessionRef.delete();
            console.log(`Session ended for ${subscriptionEndpoint}`);
            return true;
        } catch (error) {
            console.error("Error ending session:", error);
            return false;
        }
    }
);

// THIS IS THE FLOW FOR THE CRON JOB
export const checkAndSendReminders = ai.defineFlow(
    {
        name: 'checkAndSendReminders',
        inputSchema: z.null(), // No input needed
        outputSchema: z.string(),
    },
    async () => {
        const now = new Date();
        console.log(`Cron job running at ${now.toISOString()}`);
        const sessionsSnapshot = await sessionsCollection.get();

        if (sessionsSnapshot.empty) {
            return "No active sessions.";
        }
        
        let sentCount = 0;
        for (const doc of sessionsSnapshot.docs) {
            const session = doc.data() as SessionData;
            const docRef = doc.ref;

            // 1. Check for "Protection Active" notification
            if (!session.protectionNotified) {
                const firstDoseTime = new Date(session.firstDoseTime);
                const protectionStartTime = add(firstDoseTime, { hours: PROTECTION_START_HOURS });
                if (isAfter(now, protectionStartTime)) {
                    const payload = JSON.stringify({
                        title: 'PrEPy: Protection active!',
                        body: 'Vous êtes protégé par la PrEP.',
                        icon: '/shield-check.png',
                    });
                    await sendNotification(session.subscriptionEndpoint, payload);
                    await docRef.update({ protectionNotified: true });
                    sentCount++;
                    // Continue to next user, as dose reminder is not due yet
                    continue; 
                }
            }
            
            // 2. Check for dose reminders
            const lastDoseTime = new Date(session.lastDoseTime);
            const reminderWindowStart = add(lastDoseTime, { hours: DOSE_INTERVAL_HOURS });
            const reminderWindowEnd = add(reminderWindowStart, { hours: GRACE_PERIOD_HOURS });

            // Check if we are within the reminder window
            if (isAfter(now, reminderWindowStart) && isBefore(now, reminderWindowEnd)) {
                const minutesRemaining = differenceInMinutes(reminderWindowEnd, now);
                const hours = Math.floor(minutesRemaining / 60);
                const mins = minutesRemaining % 60;
                const timeLeft = `Il vous reste ${hours}h${mins > 0 ? `${mins}min` : ''}.`;
                
                const payload = JSON.stringify({
                    title: "C'est l'heure de prendre la PrEP",
                    body: timeLeft,
                    icon: '/pill.png',
                    tag: 'prep-reminder'
                });

                await sendNotification(session.subscriptionEndpoint, payload);
                sentCount++;
            }
        }
        
        return `Cron job finished. Sent ${sentCount} reminders.`;
    }
);
