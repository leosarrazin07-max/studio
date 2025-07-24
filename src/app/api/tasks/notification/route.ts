
import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating state for token:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

    