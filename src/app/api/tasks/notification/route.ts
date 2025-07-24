
import { NextResponse } from 'next/server';
import { firestore, admin } from '@/lib/firebase-admin';
import { add } from 'date-fns';
import { DOSE_REMINDER_WINDOW_START_HOURS } from '@/lib/constants';

// This is now a generic endpoint to update the state associated with a token.
// The scheduling logic is now handled by the Cloud Function which is more reliable.
export async function POST(request: Request) {
  try {
    const { token, state } = await request.json();
    if (!token || !state) {
      return NextResponse.json({ error: 'Token and state are required' }, { status: 400 });
    }

    const docRef = firestore.collection('fcmTokens').doc(token);
    await docRef.set({
      ...state,
      updatedAt: new Date(),
    }, { merge: true });
    
    const lastDoseTime = state.prises
      .filter((p: any) => p.type !== 'stop')
      .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())[0]?.time;

    if (state.sessionActive && lastDoseTime) {
      const reminderTime = add(new Date(lastDoseTime), { hours: DOSE_REMINDER_WINDOW_START_HOURS });
      
      // Send a single notification at the calculated reminder time.
      // This uses the Firebase Admin SDK to send a message.
      const payload: admin.messaging.MessagingPayload = {
        notification: {
          title: "Rappel PrEPy !",
          body: "C'est le moment de prendre votre comprimé pour rester protégé.",
          icon: "/icons/icon-192x192.png",
        }
      };
      
      // We can't "schedule" a message in the future with a simple send.
      // The logic to check *when* to send has been moved to a recurring Cloud Function.
      // This endpoint is now just for updating the state.
      // The Cloud Function will read this state to determine if a notification is needed.
      
      // For immediate testing, you could uncomment the following lines.
      // Be aware this sends the notification INSTANTLY, not in the future.
      /*
      await admin.messaging().sendToDevice(token, payload).catch((error) => {
          console.error("Failure sending notification to", token, error);
          if (
            error.code === "messaging/invalid-registration-token" ||
            error.code === "messaging/registration-token-not-registered"
          ) {
            return docRef.delete();
          }
        }
      );
      */
    }

    return NextResponse.json({ success: true });
  } catch (error)
 {
    console.error('Error updating state for token:', error);
    if (error instanceof Error) {
        return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
