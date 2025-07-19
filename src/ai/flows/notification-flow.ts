'use server';
/**
 * @fileOverview Manages push notification subscriptions and scheduling.
 *
 * - saveSubscription - Saves a user's push notification subscription.
 * - scheduleDoseReminders - Schedules reminders for the next dose.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { add, isAfter } from 'date-fns';
import * as webpush from 'web-push';
import { DOSE_INTERVAL_HOURS, GRACE_PERIOD_HOURS, PROTECTION_START_HOURS } from '@/lib/constants';

// In a real app, these would be stored in a database (e.g., Firestore).
// We use in-memory storage for this prototype.
const subscriptions: webpush.PushSubscription[] = [];
const scheduledNotifications: NodeJS.Timeout[] = [];

// Configure web-push
// In a real app, these VAPID keys should be stored securely (e.g., in environment variables)
// and generated only once.
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

export const saveSubscription = ai.defineFlow(
  {
    name: 'saveSubscription',
    inputSchema: SubscriptionSchema,
    outputSchema: z.boolean(),
  },
  async (subscription) => {
    // Avoid storing duplicate subscriptions
    if (!subscriptions.some(s => s.endpoint === subscription.endpoint)) {
        subscriptions.push(subscription);
    }
    console.log('Subscription saved. Total subscriptions:', subscriptions.length);
    return true;
  }
);


const sendNotification = (subscription: webpush.PushSubscription, payload: string) => {
    webpush.sendNotification(subscription, payload).catch(error => {
        console.error('Error sending notification, removing subscription:', error);
        // If a subscription is invalid, remove it.
        const index = subscriptions.findIndex(s => s.endpoint === subscription.endpoint);
        if (index > -1) {
            subscriptions.splice(index, 1);
        }
    });
};

export const scheduleDoseReminders = ai.defineFlow(
    {
        name: 'scheduleDoseReminders',
        inputSchema: ScheduleSchema,
        outputSchema: z.boolean(),
    },
    async ({ lastDoseTime, firstDoseTime, isFirstDose }) => {
        // Clear any previously scheduled notifications for this user/session
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
                    subscriptions.forEach(sub => sendNotification(sub, payload));
                }, delay);
                scheduledNotifications.push(timeoutId);
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
                    const timeLeft = `Il vous reste ${hours}h et ${mins}min.`;
                    
                    const payload = JSON.stringify({
                        title: "C'est l'heure de prendre la PrEP",
                        body: timeLeft,
                        icon: '/pill.png',
                        tag: 'prep-reminder'
                    });
                     subscriptions.forEach(sub => sendNotification(sub, payload));
                }, delay);
                scheduledNotifications.push(timeoutId);
            }
        }

        console.log(`Scheduled ${scheduledNotifications.length} notifications.`);
        return true;
    }
);
