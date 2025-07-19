
import { NextResponse } from 'next/server';
import { getFirestore, doc, deleteDoc } from 'firebase/firestore';
import { initializeServerApp } from '@/lib/firebase-server';

const app = initializeServerApp();
const db = getFirestore(app);

export async function POST(request: Request) {
    try {
        const { endpoint } = await request.json();
        if (!endpoint) {
            return NextResponse.json({ success: false, error: 'Missing endpoint' }, { status: 400 });
        }
        
        const endpointHash = btoa(endpoint).replace(/=/g, '');

        await deleteDoc(doc(db, "states", endpointHash));
        await deleteDoc(doc(db, "subscriptions", endpointHash));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete state:", error);
        return NextResponse.json({ success: false, error: 'Failed to delete state' }, { status: 500 });
    }
}
