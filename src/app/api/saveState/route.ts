
import { NextResponse } from 'next/server';
import { initializeServerApp } from '@/lib/firebase-server';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const { db } = initializeServerApp();

export async function POST(request: Request) {
    try {
        const { endpoint, state } = await request.json();
        if (!endpoint || !state) {
            return NextResponse.json({ success: false, error: 'Missing endpoint or state' }, { status: 400 });
        }
        
        const endpointHash = btoa(endpoint).replace(/=/g, '');
        const firestore = getFirestore(db);
        
        await setDoc(doc(firestore, "states", endpointHash), state);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save state:", error);
        return NextResponse.json({ success: false, error: 'Failed to save state' }, { status: 500 });
    }
}
