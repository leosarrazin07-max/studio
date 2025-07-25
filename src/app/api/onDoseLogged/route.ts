
import { NextResponse } from 'next/server';
import { firestore, admin } from '@/lib/firebase-admin';
import { add } from 'date-fns';
import { DOSE_REMINDER_WINDOW_START_HOURS } from '@/lib/constants';

// This is a webhook that should be configured to be called by a Firestore trigger.
// For App Hosting, this would typically be done via an Eventarc trigger calling this endpoint.
export async function POST(request: Request) {
  try {
    // Note: The body format from Eventarc for a Firestore trigger is different
    // from a direct client call. We're assuming a client-like POST for now.
    const body = await request.json();
    const { token, state } = body;

    if (!token || !state) {
      return NextResponse.json({ error: 'Token and state are required.' }, { status: 400 });
    }

    const { prises, sessionActive, fcmToken } = state;

    if (!sessionActive || !fcmToken || !prises || prises.length === 0) {
      console.log(`[${fcmToken}] Session not active, no token, or no doses. No notification scheduled.`);
      // Here you could add logic to delete scheduled tasks if any.
      return NextResponse.json({ success: true, message: 'No notification scheduled.' });
    }
    
    // The `prises` from the client have been converted to ISO strings.
    // We need to convert them back to Date objects for date-fns.
    const doses = prises.map((p: any) => ({
      ...p,
      time: new Date(p.time),
    })).sort((a: any, b: any) => a.time.getTime() - b.time.getTime());

    const lastDose = doses[doses.length - 1];

    if (!lastDose) {
        return NextResponse.json({ success: true, message: 'No last dose found, no notification scheduled.' });
    }

    // THIS IS A SIMPLIFIED LOGIC FOR DEMONSTRATION.
    // In a real-world scenario, you would use a task queue service like Cloud Tasks
    // to schedule the notification to be sent at the correct time.
    // App Hosting does not have a built-in scheduler, so this endpoint would
    // ideally create a task in Cloud Tasks.
    
    const nextDoseTime = add(lastDose.time, { hours: DOSE_REMINDER_WINDOW_START_HOURS });

    const message = {
      notification: {
        title: 'Rappel de prise PrEPy !',
        body: `Il est temps de prendre votre comprimé. Prochaine prise prévue autour de ${nextDoseTime.toLocaleTimeString('fr-FR')}.`,
      },
      token: fcmToken,
    };
    
    console.log(`[${fcmToken}] Intent to send notification for dose taken at ${lastDose.time}.`);
    console.log(`[${fcmToken}] A reminder would be sent for ${nextDoseTime.toISOString()}`);
    
    // For this example, we'll send a message immediately to confirm the function is triggered.
    // This is NOT a scheduled notification.
    try {
        const response = await admin.messaging().send(message);
        console.log(`[${fcmToken}] Test notification sent successfully:`, response);
    } catch(error) {
        console.error(`[${fcmToken}] Failed to send test notification:`, error);
        // If the token is invalid, we might want to remove it from the database.
        if (error.code === 'messaging/registration-token-not-registered') {
            await firestore.collection('prepSessions').doc(fcmToken).delete();
            console.log(`[${fcmToken}] Removed invalid token from Firestore.`);
        }
    }

    return NextResponse.json({ success: true, message: 'Notification logic processed.' });
  } catch (error) {
    console.error('Error in onDoseLogged function:', error);
    // It's important to cast the error to access its properties safely.
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
