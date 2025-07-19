
import { NextResponse } from 'next/server';
import { initializeServerApp } from '@/lib/firebase-server';
import { getFirestore } from 'firebase-admin/firestore';

const { db } = initializeServerApp();

export async function POST(request: Request) {
    try {
        const { endpoint } = await request.json();
        if (!endpoint) {
            return NextResponse.json({ success: false, error: 'Missing endpoint' }, { status: 400 });
        }
        
        const endpointHash = btoa(endpoint).replace(/=/g, '');
        const firestore = getFirestore(db);

        await firestore.collection("states").doc(endpointHash).delete();
        await firestore.collection("subscriptions").doc(endpointHash).delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete state:", error);
        return NextResponse.json({ success: false, error: 'Failed to delete state' }, { status: 500 });
    }
}
