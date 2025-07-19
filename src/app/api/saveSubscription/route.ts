
import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { z } from 'zod';

if (!getApps().length) {
    initializeApp();
}
const db = getFirestore();

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
        await db.collection("subscriptions").doc(subscription.endpoint).set(subscription);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save subscription:", error);
        return NextResponse.json({ success: false, error: 'Failed to save subscription' }, { status: 500 });
    }
}
