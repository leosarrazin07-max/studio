'use server';
/**
 * @fileOverview Manages push notification subscriptions and scheduling.
 *
 * - saveSubscription - Saves a user's push notification subscription to Firestore.
 * - scheduleDoseReminders - Schedules reminders for the next dose.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { add, isAfter } from 'date-fns';
import * as webpush from 'web-push';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { DOSE_INTERVAL_HOURS, GRACE_PERIOD_HOURS, PROTECTION_START_HOURS } from '@/lib/constants';

// --- Firebase Admin SDK Setup ---
// In a real production environment, you would use environment variables
// to configure the SDK, especially for service account credentials.
// For App Hosting, this configuration is often handled automatically.
try {
    if (!getApps().length) {
        if (process.env.FIREBASE_CONFIG && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
             // Deployed on App Hosting
            initializeApp();
        } else {
             // Local development - requires a service account key file
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
            initializeApp({
                credential: cert(serviceAccount)
            });
        }
    }
} catch (error) {
    console.error("Firebase Admin initialization error:", error);
    // You might want to throw an error or handle this case gracefully
}

const db = getFirestore();
const subscriptionsCollection = db.collection('subscriptions');

// This remains in-memory as it's tied to the server's lifecycle.
// A more robust solution would use a cron job service.
const scheduledNotifications: NodeJS.Timeout[] = [];

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
        // Use the endpoint as the document ID to prevent duplicates
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

const sendNotificationsToAll = async (payload: string) => {
    try {
        const snapshot = await subscriptionsCollection.get();
        if (snapshot.empty) {
            console.log('No subscriptions found.');
            return;
        }

        snapshot.forEach(doc => {
            const subscription = doc.data() as webpush.PushSubscription;
            webpush.sendNotification(subscription, payload).catch(error => {
                console.error('Error sending notification, removing subscription:', error);
                // If a subscription is invalid (e.g., 410 Gone), remove it from Firestore.
                if (error.statusCode === 410) {
                    doc.ref.delete();
                }
            });
        });
    } catch (error) {
        console.error("Error fetching subscriptions from Firestore:", error);
    }
};

export const scheduleDoseReminders = ai.defineFlow(
    {
        name: 'scheduleDoseReminders',
        inputSchema: ScheduleSchema,
        outputSchema: z.boolean(),
    },
    async ({ lastDoseTime, firstDoseTime, isFirstDose }) => {
        // Clear any previously scheduled notifications
        scheduledNotifications.forEach(clearTimeout);
        scheduledNotifications.length = 0;

        const now = new Date();
        const lastDoseDate = new Date(lastDoseTime);

        // 1. Schedule protection start notification
        if (isFirstDose) {
            const protectionStartTime = add(new Date(firstDoseTime), { hours: PROTECTION_START_HOURS });
            if (isAfter(protectionStartTime, now)) {
                const delay = protectionStartTime.getTime() - now.getTime();
                const timeoutId = setTimeout(() => {
                    const payload = JSON.stringify({
                        title: 'PrEPy: Protection active!',
                        body: 'Vous êtes protégé par la PrEP.',
                        icon: '/shield-check.png',
                    });
                    sendNotificationsToAll(payload);
                }, delay);
                scheduledNotifications.push(timeoutId);
            }
        }

        // 2. Schedule next dose reminders
        const nextDoseTime = add(lastDoseDate, { hours: DOSE_INTERVAL_HOURS });
        const reminderWindowEnd = add(nextDoseTime, { hours: GRACE_PERIOD_HOURS });

        // Schedule reminders every 15 minutes within the grace period
        for (let i = 0; i < (GRACE_PERIOD_HOURS * 60); i += 15) {
            const reminderTime = add(nextDoseTime, { minutes: i });

            if (isAfter(reminderTime, now) && isAfter(reminderWindowEnd, reminderTime)) {
                const delay = reminderTime.getTime() - now.getTime();
                const timeoutId = setTimeout(() => {
                    const minutesRemaining = Math.round((reminderWindowEnd.getTime() - reminderTime.getTime()) / (1000 * 60));
                    const hours = Math.floor(minutesRemaining / 60);
                    const mins = minutesRemaining % 60;
                    const timeLeft = `Il vous reste ${hours}h${mins > 0 ? ` et ${mins}min` : ''}.`;
                    
                    const payload = JSON.stringify({
                        title: "C'est l'heure de prendre la PrEP",
                        body: timeLeft,
                        icon: '/pill.png',
                        tag: 'prep-reminder' // Tag to replace previous reminders
                    });
                     sendNotificationsToAll(payload);
                }, delay);
                scheduledNotifications.push(timeoutId);
            }
        }

        console.log(`Scheduled ${scheduledNotifications.length} notifications.`);
        return true;
    }
);
