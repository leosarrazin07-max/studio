
import { firestore } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const subscription = await req.json();
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ success: false, error: 'Invalid subscription object' }, { status: 400 });
    }
    
    // Use the endpoint as a unique identifier for the subscription document
    const endpointHash = Buffer.from(subscription.endpoint).toString('base64').replace(/=/g, '').replace(/\//g, '_');
    const subscriptionRef = firestore.collection('subscriptions').doc(endpointHash);

    await subscriptionRef.set(subscription);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
    try {
        const { endpoint } = await req.json();
        if (!endpoint) {
            return NextResponse.json({ success: false, error: 'Endpoint is required' }, { status: 400 });
        }
        
        const endpointHash = Buffer.from(endpoint).toString('base64').replace(/=/g, '').replace(/\//g, '_');
        const subscriptionRef = firestore.collection('subscriptions').doc(endpointHash);
        
        await subscriptionRef.delete();
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting subscription:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
