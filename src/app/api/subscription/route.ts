
import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const docRef = firestore.collection('fcmTokens').doc(token);
    await docRef.set({
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving token:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { token } = await request.json();
     if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const docRef = firestore.collection('fcmTokens').doc(token);
    await docRef.delete();
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting token:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

    