
import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';
import * as webpush from 'web-push';
import { add, isAfter, isBefore } from 'date-fns';
import { DOSE_REMINDER_WINDOW_START_HOURS, LAPSES_AFTER_HOURS } from '@/lib/constants';

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_MAILTO) {
  console.warn('VAPID keys are not configured. Push notifications will not work.');
} else {
    webpush.setVapidDetails(
        `mailto:${process.env.VAPID_MAILTO}`,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

// This is a CRON job endpoint, triggered by an external scheduler (e.g., Google Cloud Scheduler)
export async function GET() {
    if (!process.env.VAPID_PUBLIC_KEY) {
        return NextResponse.json({ success: false, error: 'VAPID keys not configured on server' }, { status: 500 });
    }

    try {
        const subscriptionsSnapshot = await firestore.collection('subscriptions').get();
        if (subscriptionsSnapshot.empty) {
            return NextResponse.json({ success: true, message: 'No subscriptions to process.' });
        }

        const now = new Date();
        const processingPromises: Promise<any>[] = [];

        subscriptionsSnapshot.forEach(doc => {
            const subscriptionData = doc.data();
            // The state is stored with the subscription object which is now called 'push'
            const { push: subscription, state } = subscriptionData; 

            if (!state || !state.sessionActive || !subscription) {
                return; // Skip inactive sessions or malformed data
            }
            
            const allPrises = state.prises
                .filter((d: any) => d.type !== 'stop')
                .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());

            const lastDose = allPrises[0] ?? null;
            if (!lastDose) {
                return; // Skip if no doses
            }

            const lastDoseTime = new Date(lastDose.time);
            const reminderTime = add(lastDoseTime, { hours: DOSE_REMINDER_WINDOW_START_HOURS });
            const lapsingTime = add(lastDoseTime, { hours: LAPSES_AFTER_HOURS });

            // Check if it's time to send a reminder
            if (isAfter(now, reminderTime) && isBefore(now, lapsingTime)) {
                const payload = JSON.stringify({
                    title: 'Rappel PrEPy !',
                    body: `C'est le moment de prendre votre comprimé. La fenêtre de prise se termine bientôt.`,
                    icon: '/icons/icon-192x192.png',
                });
                
                processingPromises.push(
                    webpush.sendNotification(subscription, payload).catch(error => {
                        console.error(`Error sending notification to ${subscription.endpoint}:`, error);
                        // If subscription is expired or invalid, delete it
                        if (error.statusCode === 410 || error.statusCode === 404) {
                            return doc.ref.delete();
                        }
                    })
                );
            }
        });

        await Promise.all(processingPromises);

        return NextResponse.json({ success: true, message: `Processed ${processingPromises.length} notifications.` });

    } catch (error) {
        console.error('Error processing notifications:', error);
        if (error instanceof Error) {
             return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: false, error: 'Unknown error' }, { status: 500 });
    }
}


// This endpoint is used by the client to sync its state for the cron job to use.
export async function POST(req: Request) {
     try {
        const { subscription, state } = await req.json();

        if (!subscription || !subscription.endpoint || !state) {
            return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
        }
        
        const endpointHash = Buffer.from(subscription.endpoint).toString('base64').replace(/=/g, '').replace(/\//g, '_');
        const subscriptionRef = firestore.collection('subscriptions').doc(endpointHash);

        // We store the subscription object (named 'push') and the state together.
        await subscriptionRef.set({
            push: subscription,
            state: state,
        }, { merge: true });

        return NextResponse.json({ success: true, message: 'State synced.' });

    } catch (error) {
        console.error('Error syncing state:', error);
        if (error instanceof Error) {
             return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: false, error: 'Unknown error' }, { status: 500 });
    }
}
