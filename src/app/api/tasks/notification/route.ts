
import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';

// This function is not used because there is no cron job service configured.
// A client-driven notification approach would be required.
// Keeping the POST handler for now to avoid breaking the client, 
// but it doesn't do anything useful without a corresponding server-side process.
export async function GET() {
    return NextResponse.json({ success: false, error: 'This endpoint is not active. No cron job is configured.' }, { status: 404 });
}

// This endpoint is called from the client to sync state, but without a
// server-side process to read this data, it is not currently used for notifications.
// It simply stores the data in Firestore.
export async function POST(req: Request) {
    try {
        const { subscription, state } = await req.json();
        
        if (!subscription || !subscription.endpoint || !state) {
            return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
        }

        const endpointHash = Buffer.from(subscription.endpoint).toString('base64').replace(/=/g, '').replace(/\//g, '_');
        const docRef = firestore.collection('subscriptions').doc(endpointHash).collection('localData').doc('prepState');
        
        await docRef.set(state);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error syncing local data:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}

    