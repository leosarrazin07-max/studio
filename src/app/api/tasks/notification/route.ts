
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';
import * as webpush from 'web-push';
import { add } from 'date-fns';
import { DOSE_REMINDER_INTERVAL_MINUTES } from '@/lib/constants';
import { CloudTasksClient } from '@google-cloud/tasks';
import { google } from '@google-cloud/tasks/build/protos/protos';


if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_MAILTO) {
    console.warn("VAPID keys are not fully set. Push notifications will not work.");
} else {
    webpush.setVapidDetails(
        process.env.VAPID_MAILTO,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

const tasksClient = new CloudTasksClient();
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
const QUEUE_LOCATION = 'europe-west1';
const QUEUE_ID = 'prep-notifications';

const getQueuePath = () => tasksClient.queuePath(PROJECT_ID, QUEUE_LOCATION, QUEUE_ID);
const getHandlerUrl = () => `${process.env.NEXT_PUBLIC_APP_URL}/api/tasks/notification`;

const getTaskName = (subscriptionId: string, timestamp: number) => {
    return tasksClient.taskPath(PROJECT_ID, QUEUE_LOCATION, QUEUE_ID, `${subscriptionId}_chain_${timestamp}`);
}

async function sendNotification(subscription: webpush.PushSubscription, payload: string) {
    try {
        await webpush.sendNotification(subscription, payload);
    } catch (error: any) {
        console.error('Error sending push notification:', error);
        // If subscription is gone (410) or expired (404), we should remove it.
        if (error.statusCode === 410 || error.statusCode === 404) {
            throw new Error('Subscription is no longer valid.');
        }
    }
}

export async function POST(req: NextRequest) {
    if (!process.env.VAPID_PRIVATE_KEY) {
        return NextResponse.json({ message: "VAPID keys not configured on server." }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { subscriptionId, type, endTime } = body;

        if (!subscriptionId || !type) {
            return NextResponse.json({ message: "Missing subscriptionId or type" }, { status: 400 });
        }

        const subDoc = await firestore.collection('subscriptions').doc(subscriptionId).get();
        if (!subDoc.exists) {
            console.warn(`Subscription ${subscriptionId} not found. Stopping chain.`);
            return NextResponse.json({ message: "Subscription not found" }, { status: 200 });
        }
        const subscription = subDoc.data() as webpush.PushSubscription;

        let notificationPayload: { title: string, body: string };

        switch (type) {
            case 'protection_active':
                notificationPayload = { title: 'PrEPy', body: 'Votre protection PrEP est maintenant active !' };
                await sendNotification(subscription, JSON.stringify(notificationPayload));
                // One-time notification, no next task.
                break;
            
            case 'first_reminder':
            case 'recurring_reminder':
                // Check if user has already taken their dose since task was created
                const stateDoc = await firestore.collection('states').doc(subscriptionId).get();
                if (stateDoc.exists) {
                    const { doses } = stateDoc.data() as {doses: any[]};
                    const lastDoseTime = new Date(doses.sort((a,b) => b.time.seconds - a.time.seconds)[0].time.seconds * 1000);
                    // If a dose was taken in the last 22 hours, stop the chain.
                    if (add(lastDoseTime, { hours: 22 }) > new Date()) {
                         console.log(`User ${subscriptionId} has taken a recent dose. Stopping chain.`);
                         return NextResponse.json({ message: "Chain stopped, recent dose found." }, { status: 200 });
                    }
                }

                notificationPayload = { title: 'PrEPy Rappel', body: 'Il est temps de prendre votre dose de PrEP.' };
                await sendNotification(subscription, JSON.stringify(notificationPayload));
                
                // Schedule the next reminder in the chain
                const now = new Date();
                const nextReminderTime = add(now, { minutes: DOSE_REMINDER_INTERVAL_MINUTES });
                const endDateTime = new Date(endTime);

                if (nextReminderTime < endDateTime) {
                    const nextPayload = { ...body, type: 'recurring_reminder' };
                    const task: google.cloud.tasks.v2.ITask = {
                        name: getTaskName(subscriptionId, nextReminderTime.getTime()),
                        httpRequest: {
                            httpMethod: 'POST',
                            url: getHandlerUrl(),
                            headers: { 'Content-Type': 'application/json' },
                            body: Buffer.from(JSON.stringify(nextPayload)).toString('base64'),
                        },
                        scheduleTime: {
                            seconds: Math.floor(nextReminderTime.getTime() / 1000),
                        },
                    };
                    await tasksClient.createTask({ parent: getQueuePath(), task });
                }
                break;

            default:
                return NextResponse.json({ message: 'Unknown task type' }, { status: 400 });
        }
        
        return NextResponse.json({ message: "Notification processed" }, { status: 200 });

    } catch (error: any) {
        console.error("Failed to process task:", error);
         if (error.message === 'Subscription is no longer valid.') {
            // Clean up the invalid subscription
            try {
                const { subscriptionId } = await req.json();
                await firestore.collection('subscriptions').doc(subscriptionId).delete();
                await firestore.collection('states').doc(subscriptionId).delete();
            } catch (cleanupError) {
                console.error("Failed to cleanup invalid subscription:", cleanupError);
            }
        }
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
