
import { NextResponse } from 'next/server';
import { initializeServerApp } from '@/lib/firebase-server';
import { getFirestore } from 'firebase-admin/firestore';

const { db } = initializeServerApp();

export async function POST(request: Request) {
    try {
        const { endpoint, state } = await request.json();
        if (!endpoint || !state) {
            return NextResponse.json({ success: false, error: 'Missing endpoint or state' }, { status: 400 });
        }
        
        const endpointHash = btoa(endpoint).replace(/=/g, '');
        const firestore = getFirestore(db);
        
        await firestore.collection("states").doc(endpointHash).set(state);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save state:", error);
        return NextResponse.json({ success: false, error: 'Failed to save state' }, { status: 500 });
    }
}
