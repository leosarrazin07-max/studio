
import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';
import { cancelUserNotifications } from '@/lib/task-manager';

// Handles saving a new push subscription
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { subscriptionId, subscription, timezone } = body;

        if (!subscriptionId || !subscription) {
            return NextResponse.json({ message: "Missing subscriptionId or subscription object" }, { status: 400 });
        }

        const subRef = firestore.collection('subscriptions').doc(subscriptionId);
        await subRef.set({ ...subscription, timezone }, { merge: true });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error("Subscription POST Error:", error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}

// Handles deleting a push subscription
export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const { subscriptionId } = body;

        if (!subscriptionId) {
            return NextResponse.json({ message: "Missing subscriptionId" }, { status: 400 });
        }
        
        await cancelUserNotifications(subscriptionId);
        await firestore.collection('subscriptions').doc(subscriptionId).delete();
        await firestore.collection('states').doc(subscriptionId).delete();

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error("Subscription DELETE Error:", error);
        return NextResponse.json({ message: 'Internal Server Error', error: error.message }, { status: 500 });
    }
}
