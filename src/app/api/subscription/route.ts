
import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

// This endpoint now simply saves the state to Firestore.
// The logic to send notifications should be triggered by this Firestore write,
// ideally via an Eventarc trigger pointing to the /api/onDoseLogged endpoint.
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
        updatedAt: admin.firestore.FieldValue.serverTimestamp() // Use a consistent field name
    };
    
    await sessionRef.set(dataToSave, { merge: true });

    // The onDoseLogged function should be triggered by this 'set' operation via Eventarc.
    // We no longer call it directly from here.

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
