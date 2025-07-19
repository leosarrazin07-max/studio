
import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
    initializeApp();
}
const db = getFirestore();

export async function POST(request: Request) {
    try {
        const { endpoint, state } = await request.json();
        if (!endpoint || !state) {
            return NextResponse.json({ success: false, error: 'Missing endpoint or state' }, { status: 400 });
        }
        await db.collection("states").doc(endpoint).set(state);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to save state:", error);
        return NextResponse.json({ success: false, error: 'Failed to save state' }, { status: 500 });
    }
}
