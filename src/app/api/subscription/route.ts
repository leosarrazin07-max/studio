
import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { getFunctions, httpsCallable } from "firebase/functions";
import { app as clientApp } from '@/lib/firebase-client';

// Saves or updates a session document with the FCM token and state
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

    const dataToSave = {
        fcmToken: token,
        sessionActive: state.sessionActive,
        prises: state.prises.map((p: any) => ({ ...p, time: admin.firestore.Timestamp.fromDate(new Date(p.time)) })),
        lastNotifiedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await sessionRef.set(dataToSave, { merge: true });

    // Since onDocumentWritten is not supported in App Hosting, we manually trigger a function.
    // This is a workaround to schedule notifications.
    try {
        const functions = getFunctions(clientApp, 'europe-west9');
        const scheduleFunction = httpsCallable(functions, 'onDoseLogged');
        await scheduleFunction({ sessionId: token, data: dataToSave });
    } catch (e) {
        console.error("Error calling onDoseLogged function", e);
    }


    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving subscription:', error);
    return NextResponse.json({ error: 'Failed to save subscription.' }, { status: 500 });
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

    // Also need to cancel any scheduled tasks if possible, though that's more complex
    // and might require another cloud function call. For now, we just delete the data.

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json({ error: 'Failed to delete subscription.' }, { status: 500 });
  }
}
