
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { initializeServerApp } from '@/lib/firebase-server';
import { getFirestore } from 'firebase-admin/firestore';

const { db } = initializeServerApp();

const SubscriptionSchema = z.object({
    endpoint: z.string(),
    expirationTime: z.any().nullable(),
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
        const firestore = getFirestore(db);

        await firestore.collection("subscriptions").doc(endpointHash).set(subscription);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save subscription:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: 'Invalid subscription format', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: 'Failed to save subscription' }, { status: 500 });
    }
}
