
import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';

// Saves or updates a session document with the FCM token and state
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, state } = body;

    if (!token) {
      return NextResponse.json({ error: 'FCM token is required.' }, { status: 400 });
    }

    const sessionRef = firestore.collection('prepSessions').doc(token);
    
    const dataToSave = {
        fcmToken: token,
        sessionActive: state.sessionActive,
        // Convert date strings back to Firestore Timestamps
        prises: state.prises.map((p: any) => ({ ...p, time: new Date(p.time) })),
        // This will be set by the cloud function
        lastNotifiedAt: null 
    };

    await sessionRef.set(dataToSave, { merge: true });

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json({ error: 'Failed to delete subscription.' }, { status: 500 });
  }
}
