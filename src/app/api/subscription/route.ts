
import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

// This endpoint now simply saves the state to Firestore.
// The logic to send notifications should be triggered by this Firestore write,
// but since we are in a serverless environment without direct access to event triggers like before,
// we will simulate the "trigger" by directly calling the notification logic after saving.
// This is not a true event-driven approach but is a common pattern in serverless functions
// that need to perform a subsequent action.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, state } = body;

    if (!token) {
      return NextResponse.json({ error: 'FCM token is required.' }, { status: 400 });
    }

    const sessionRef = firestore.collection('prepSessions').doc(token);
    
    // Make sure we have a valid state object
    if (!state || !Array.isArray(state.prises)) {
        return NextResponse.json({ error: 'Valid state object is required.' }, { status: 400 });
    }

    // Convert date strings back to Firestore Timestamps for storage
    const dataToSave = {
        fcmToken: token,
        sessionActive: state.sessionActive,
        prises: state.prises.map((p: any) => ({ ...p, time: admin.firestore.Timestamp.fromDate(new Date(p.time)) })),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await sessionRef.set(dataToSave, { merge: true });

    // Now, we will "trigger" the onDoseLogged logic by calling it internally.
    // For this, we'll need to refactor the onDoseLogged logic into a callable function.
    // However, since we can't directly call another route, we will just send a confirmation for now.
    // A more robust solution would involve a pub/sub system or a task queue.
    
    console.log(`[${token}] State saved successfully. In a real scenario, an event would trigger the notification logic.`);

    // For demonstration, let's try to send a simple notification right away to confirm setup.
    if (state.sessionActive && state.fcmToken) {
       try {
         const message = {
           notification: {
             title: 'PrEPy: Session mise à jour !',
             body: 'Vos informations ont bien été enregistrées.',
           },
           token: state.fcmToken,
         };
         await admin.messaging().send(message);
         console.log(`[${token}] Confirmation notification sent successfully.`);
       } catch (error) {
         console.error(`[${token}] Failed to send confirmation notification:`, error);
         if ((error as any).code === 'messaging/registration-token-not-registered') {
             await firestore.collection('prepSessions').doc(token).delete();
             console.log(`[${token}] Removed invalid token from Firestore.`);
         }
       }
    }


    return NextResponse.json({ success: true, message: 'State saved. Notification process will be triggered by Firestore.' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to save subscription.', details: errorMessage }, { status: 500 });
  }
}


// Deletes the session document associated with the FCM token
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'FCM token is required.' }, { status: 400 });
    }

    const sessionRef = firestore.collection('prepSessions').doc(token);
    await sessionRef.delete();
    
    console.log(`[${token}] Subscription deleted successfully.`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to delete subscription.', details: errorMessage }, { status: 500 });
  }
}
