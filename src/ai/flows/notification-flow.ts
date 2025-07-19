'use server';
/**
 * @fileOverview Manages push notification subscriptions and scheduling.
 *
 * - saveSubscription - Saves a user's push notification subscription to Firestore.
 * - scheduleDoseReminders - Schedules reminders for the next dose.
 * - endSessionForUser - Clears a user's session data from Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { add, isAfter } from 'date-fns';
import * as webpush from 'web-push';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { DOSE_INTERVAL_HOURS, GRACE_PERIOD_HOURS, PROTECTION_START_HOURS } from '@/lib/constants';

// --- Types ---
interface SessionData {
    lastDoseTime: string; // ISO string
    firstDoseTime: string; // ISO string
    isFirstDose: boolean;
    subscriptionEndpoint: string; // To link session to subscription
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

// In-memory store for timeout IDs to allow cancellation.
const scheduledNotifications = new Map<string, NodeJS.Timeout[]>();

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
    } catch (error: any) {
        console.error('Error sending notification, removing subscription:', error);
        if (error.statusCode === 410) { // 410 Gone
            await subscriptionsCollection.doc(encodeURIComponent(endpoint)).delete();
            await sessionsCollection.doc(encodeURIComponent(endpoint)).delete();
        }
    }
};

const clearScheduledNotificationsForUser = (endpoint: string) => {
    const userTimeouts = scheduledNotifications.get(endpoint);
    if (userTimeouts) {
        userTimeouts.forEach(clearTimeout);
    }
    scheduledNotifications.set(endpoint, []);
};

const scheduleRemindersForSession = (sessionData: SessionData) => {
    const endpoint = sessionData.subscriptionEndpoint;
    clearScheduledNotificationsForUser(endpoint);

    const now = new Date();
    const lastDoseDate = new Date(sessionData.lastDoseTime);
    const currentUserTimeouts: NodeJS.Timeout[] = [];

    // 1. Schedule protection start notification
    if (sessionData.isFirstDose) {
        const protectionStartTime = add(new Date(sessionData.firstDoseTime), { hours: PROTECTION_START_HOURS });
        if (isAfter(protectionStartTime, now)) {
            const delay = protectionStartTime.getTime() - now.getTime();
            const timeoutId = setTimeout(() => {
                const payload = JSON.stringify({
                    title: 'PrEPy: Protection active!',
                    body: 'Vous êtes protégé par la PrEP.',
                    icon: '/shield-check.png',
                });
                sendNotification(endpoint, payload);
            }, delay);
            currentUserTimeouts.push(timeoutId);
        }
    }

    // 2. Schedule next dose reminders
    const nextDoseTime = add(lastDoseDate, { hours: DOSE_INTERVAL_HOURS });
    const reminderWindowEnd = add(nextDoseTime, { hours: GRACE_PERIOD_HOURS });

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
                    tag: 'prep-reminder'
                });
                sendNotification(endpoint, payload);
            }, delay);
            currentUserTimeouts.push(timeoutId);
        }
    }
    scheduledNotifications.set(endpoint, currentUserTimeouts);
    console.log(`Scheduled ${currentUserTimeouts.length} notifications for ${endpoint}.`);
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
            await sessionRef.set(sessionData);
            scheduleRemindersForSession(sessionData);
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
            clearScheduledNotificationsForUser(subscriptionEndpoint);
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

// --- Server Startup Logic ---
const rescheduleNotificationsOnStartup = async () => {
    console.log("Server starting, re-scheduling notifications from Firestore...");
    try {
        const snapshot = await sessionsCollection.get();
        if (snapshot.empty) {
            console.log('No active sessions found to reschedule.');
            return;
        }

        snapshot.forEach(doc => {
            const sessionData = doc.data() as SessionData;
            console.log(`Rescheduling for endpoint: ${sessionData.subscriptionEndpoint}`);
            scheduleRemindersForSession(sessionData);
        });
    } catch (error) {
        console.error("Error rescheduling notifications from Firestore:", error);
    }
};

rescheduleNotificationsOnStartup();
