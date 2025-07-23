
import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';
import * as webpush from 'web-push';
import { add, isBefore } from 'date-fns';
import { DOSE_REMINDER_WINDOW_START_HOURS, DOSE_REMINDER_WINDOW_END_HOURS } from '@/lib/constants';

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_MAILTO) {
  console.warn('VAPID keys are not configured. Push notifications will not work.');
} else {
    webpush.setVapidDetails(
        `mailto:${process.env.VAPID_MAILTO}`,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

// This endpoint is now used to schedule notifications based on client state.
// It is NOT a cron job handler.
export async function POST(req: Request) {
    if (!process.env.VAPID_PUBLIC_KEY) {
         return NextResponse.json({ success: false, error: 'VAPID keys not configured on server' }, { status: 500 });
    }
    
    try {
        const { subscription, state } = await req.json();

        if (!subscription || !state || !state.sessionActive) {
            // No active session, no need to send notifications.
            return NextResponse.json({ success: true, message: 'No active session.' });
        }

        const allPrises = state.prises
            .filter((d: any) => d.type !== 'stop')
            .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());

        const lastDose = allPrises[0] ?? null;

        if (!lastDose) {
            return NextResponse.json({ success: true, message: 'No doses found.' });
        }

        const lastDoseTime = new Date(lastDose.time);
        const reminderTime = add(lastDoseTime, { hours: DOSE_REMINDER_WINDOW_START_HOURS });

        // Only schedule if the reminder time is in the future.
        if (isBefore(new Date(), reminderTime)) {
            const payload = JSON.stringify({
                title: 'Rappel PrEPy !',
                body: `C'est le moment de prendre votre comprimé. La fenêtre de prise se termine dans ${DOSE_REMINDER_WINDOW_END_HOURS - DOSE_REMINDER_WINDOW_START_HOURS}h.`,
                icon: '/icons/icon-192x192.png',
            });
            
            // The `sendNotification` function handles scheduling for us if the TTL is set.
            // However, web-push does not directly support delayed sending.
            // The correct approach is to use a task scheduler like Cloud Tasks.
            // Since that is not available, we will send it immediately and rely on the client logic.
            // This is a limitation of the current architecture.
            // For a "real" implementation, this should be a task scheduler.
            
            // We will save the reminder to firestore and have a separate function (or manually trigger) to process it.
            // This is a workaround.
            const endpointHash = Buffer.from(subscription.endpoint).toString('base64').replace(/=/g, '').replace(/\//g, '_');
            const reminderRef = firestore.collection('reminders').doc(endpointHash);
            
            await reminderRef.set({
                subscription,
                payload,
                sendAt: reminderTime,
            });
            
            // To simulate sending, we will try to send it now, but this is not ideal.
            // In a real scenario, a scheduled function would read from 'reminders'.
            await webpush.sendNotification(subscription, payload);
            
            return NextResponse.json({ success: true, message: 'Notification sent (simulated).' });
        }
        
        return NextResponse.json({ success: true, message: 'Reminder time is in the past.' });

    } catch (error) {
        console.error('Error sending notification:', error);
        if (error instanceof Error) {
             return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }
        return NextResponse.json({ success: false, error: 'Unknown error' }, { status: 500 });
    }
}

    