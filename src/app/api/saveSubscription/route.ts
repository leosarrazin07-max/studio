
import { NextResponse } from 'next/server';
import { z } from 'zod';
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


const SubscriptionSchema = z.object({
    endpoint: z.string(),
    expirationTime: z.any().nullable(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
    timezone: z.string().optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const subscription = SubscriptionSchema.parse(body);

        const endpointHash = btoa(subscription.endpoint).replace(/=/g, '');

        await setDoc(doc(firestore, "subscriptions", endpointHash), subscription, { merge: true });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save subscription:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: 'Invalid subscription format', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: 'Failed to save subscription' }, { status: 500 });
    }
}
