
import { NextResponse } from 'next/server';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const firestore = getFirestore(app);

export async function POST(request: Request) {
    try {
        const { endpoint, state } = await request.json();
        if (!endpoint || !state) {
            return NextResponse.json({ success: false, error: 'Missing endpoint or state' }, { status: 400 });
        }
        
        const endpointHash = btoa(endpoint).replace(/=/g, '');
        
        await setDoc(doc(firestore, "states", endpointHash), state);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save state:", error);
        return NextResponse.json({ success: false, error: 'Failed to save state' }, { status: 500 });
    }
}
