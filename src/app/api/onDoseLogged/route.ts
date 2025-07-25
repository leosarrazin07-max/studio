
import { NextResponse } from 'next/server';
import { firestore, admin } from '@/lib/firebase-admin';
import { add, sub } from 'date-fns';
import { DOSE_REMINDER_WINDOW_START_HOURS, DOSE_REMINDER_INTERVAL_MINUTES } from '@/lib/constants';

// This is a webhook that should be configured to be called by a Firestore trigger.
// For App Hosting, this would typically be done via an Eventarc trigger calling this endpoint.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, data } = body;

    if (!sessionId || !data) {
      return NextResponse.json({ error: 'Session ID and data are required.' }, { status: 400 });
    }

    const { fcmToken, prises, sessionActive } = data;

    if (!sessionActive || !fcmToken || !prises || prises.length === 0) {
      console.log(`[${sessionId}] Session not active, no token, or no doses. No notification scheduled.`);
      // We can also delete any existing scheduled tasks for this session here if needed.
      return NextResponse.json({ success: true, message: 'No notification scheduled.' });
    }

    // The `prises` from the client have been converted to Firestore Timestamps string on the server
    // We need to convert them back to Date objects
     const doses = prises.map((p: any) => ({
      ...p,
      time: new Date(p.time),
    })).sort((a: any, b: any) => a.time.getTime() - b.time.getTime());

    const lastDose = doses[doses.length - 1];

    if (!lastDose) {
        return NextResponse.json({ success: true, message: 'No last dose found, no notification scheduled.' });
    }

    // Calculate the next notification time
    const nextDoseTime = add(lastDose.time, { hours: DOSE_REMINDER_WINDOW_START_HOURS });
    const reminderTime = sub(nextDoseTime, { minutes: DOSE_REMINDER_INTERVAL_MINUTES });

    const message = {
      notification: {
        title: 'Rappel de prise PrEPy !',
        body: `Il est bientôt temps de prendre votre prochain comprimé.`,
      },
      token: fcmToken,
    };
    
    // As there's no native scheduler in App Hosting, sending a message with a delay
    // is complex. A common pattern is to use a service like Cloud Tasks or a CRON job
    // that calls another endpoint at the right time.
    // For now, we will log the intent to send a notification.
    
    console.log(`[${sessionId}] Intent to send notification for dose at ${lastDose.time}.`);
    console.log(`[${sessionId}] Reminder would be scheduled around: ${reminderTime.toISOString()}`);
    console.log(`[${sessionId}] Message to be sent:`, message);

    // In a full implementation, you would use Cloud Tasks here:
    // 1. Create a Cloud Task to call a "/api/sendReminder" endpoint.
    // 2. Set the task's `scheduleTime` to `reminderTime`.
    // 3. The task's payload would be the `message` object.
    
    // For demonstration, we'll try to send a message immediately.
    // NOTE: This is NOT a scheduled notification.
    try {
        await admin.messaging().send(message);
        console.log(`[${sessionId}] Test notification sent successfully.`);
    } catch(e) {
        console.error(`[${sessionId}] Failed to send test notification`, e)
    }


    return NextResponse.json({ success: true, message: 'Notification logic processed.' });
  } catch (error) {
    console.error('Error in onDoseLogged function:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
