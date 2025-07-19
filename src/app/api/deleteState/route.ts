
import { NextResponse } from 'next/server';
import { initializeServerApp } from '@/lib/firebase-server';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';

const { db } = initializeServerApp();

export async function POST(request: Request) {
    try {
        const { endpoint } = await request.json();
        if (!endpoint) {
            return NextResponse.json({ success: false, error: 'Missing endpoint' }, { status: 400 });
        }
        
        const endpointHash = btoa(endpoint).replace(/=/g, '');
        const firestore = getFirestore(db);

        const stateRef = doc(firestore, "states", endpointHash);
        const subRef = doc(firestore, "subscriptions", endpointHash);

        await deleteDoc(stateRef);
        await deleteDoc(subRef);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete state:", error);
        return NextResponse.json({ success: false, error: 'Failed to delete state' }, { status: 500 });
    }
}
