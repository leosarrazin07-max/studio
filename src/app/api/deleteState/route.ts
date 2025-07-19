
import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
        initializeApp({
            credential: cert(serviceAccount),
        });
    } catch (error) {
        console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", error);
    }
}
const db = getFirestore();

export async function POST(request: Request) {
    try {
        const { endpoint } = await request.json();
        if (!endpoint) {
            return NextResponse.json({ success: false, error: 'Missing endpoint' }, { status: 400 });
        }
        await db.collection("states").doc(endpoint).delete();
        await db.collection("subscriptions").doc(endpoint).delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete state:", error);
        return NextResponse.json({ success: false, error: 'Failed to delete state' }, { status: 500 });
    }
}
