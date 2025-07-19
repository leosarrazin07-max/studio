
import { NextResponse } from 'next/server';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { initializeServerApp } from '@/lib/firebase-server';

const app = initializeServerApp();
const db = getFirestore(app);

export async function POST(request: Request) {
    try {
        const { endpoint, state } = await request.json();
        if (!endpoint || !state) {
            return NextResponse.json({ success: false, error: 'Missing endpoint or state' }, { status: 400 });
        }
        
        const endpointHash = btoa(endpoint).replace(/=/g, '');
        
        await setDoc(doc(db, "states", endpointHash), state);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save state:", error);
        return NextResponse.json({ success: false, error: 'Failed to save state' }, { status: 500 });
    }
}
