
import { NextResponse } from 'next/server';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { z } from 'zod';
import { initializeServerApp } from '@/lib/firebase-server';

const app = initializeServerApp();
const db = getFirestore(app);

const SubscriptionSchema = z.object({
    endpoint: z.string(),
    keys: z.object({
      p256dh: z.string(),
      auth: z.string(),
    }),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const subscription = SubscriptionSchema.parse(body);

        const endpointHash = btoa(subscription.endpoint).replace(/=/g, '');

        await setDoc(doc(db, "subscriptions", endpointHash), subscription);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save subscription:", error);
        return NextResponse.json({ success: false, error: 'Failed to save subscription' }, { status: 500 });
    }
}
