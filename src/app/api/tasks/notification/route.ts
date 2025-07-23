
import { NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';
import webpush from 'web-push';
import { add, isBefore } from 'date-fns';
import { DOSE_REMINDER_WINDOW_START_HOURS, DOSE_REMINDER_WINDOW_END_HOURS } from '@/lib/constants';

const getVapidKeys = async () => {
    try {
        const configDoc = await firestore.collection('configuration').doc('vapid').get();
        if (!configDoc.exists) {
            console.error("Le document de configuration 'vapid' n'a pas été trouvé dans Firestore.");
            return null;
        }
        const keys = configDoc.data();
        if (!keys || !keys.publicKey || !keys.privateKey) {
            console.error("Le document 'vapid' dans Firestore ne contient pas publicKey et privateKey.");
            return null;
        }
        return { publicKey: keys.publicKey, privateKey: keys.privateKey };
    } catch(e) {
        console.error("Impossible de récupérer les clés VAPID depuis Firestore.", e);
        return null;
    }
};

// This function is triggered by a cron job (e.g., Google Cloud Scheduler)
export async function GET() {
  const vapidKeys = await getVapidKeys();
  if (!vapidKeys) {
      return NextResponse.json({ success: false, error: 'VAPID keys not configured on server in Firestore' }, { status: 500 });
  }

  webpush.setVapidDetails(
    'mailto:webmaster@example.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
    
  try {
    const subscriptionsSnapshot = await firestore.collection('subscriptions').get();
    if (subscriptionsSnapshot.empty) {
      return NextResponse.json({ success: true, message: 'No subscriptions to process.' });
    }

    const now = new Date();
    const notificationPayload = JSON.stringify({
      title: 'PrEPy : Rappel de prise',
      body: 'Il est temps de prendre votre comprimé pour rester protégé(e).',
      icon: '/icon-192x192.png',
      badge: '/badge.svg'
    });

    const promises = subscriptionsSnapshot.docs.map(async (doc) => {
      const subscription = doc.data() as webpush.PushSubscription;
      const localDataSnapshot = await doc.ref.collection('localData').doc('prepState').get();

      if (!localDataSnapshot.exists) {
        return; // No local data to process
      }

      const state = localDataSnapshot.data();
      if (!state || !state.sessionActive || !state.prises || state.prises.length === 0) {
        return; // Session inactive or no doses
      }

      // Doses are stored as ISO strings, convert them back to Dates
      const prises = state.prises.map((d: any) => ({ ...d, time: new Date(d.time) }));
      const lastPrise = prises.filter((d: any) => d.type !== 'stop').sort((a: any, b: any) => b.time.getTime() - a.time.getTime())[0];

      if (!lastPrise) {
        return;
      }
      
      const reminderWindowStart = add(lastPrise.time, { hours: DOSE_REMINDER_WINDOW_START_HOURS });
      const reminderWindowEnd = add(lastPrise.time, { hours: DOSE_REMINDER_WINDOW_END_HOURS });

      // Send notification if we are within the reminder window
      if (isBefore(reminderWindowStart, now) && isBefore(now, reminderWindowEnd)) {
        try {
          await webpush.sendNotification(subscription, notificationPayload);
        } catch (error: any) {
          console.error(`Error sending notification to ${subscription.endpoint}:`, error.statusCode, error.body);
          // If subscription is expired or invalid, remove it from Firestore
          if (error.statusCode === 404 || error.statusCode === 410) {
            console.log(`Deleting expired subscription: ${subscription.endpoint}`);
            await doc.ref.delete();
          }
        }
      }
    });

    await Promise.all(promises);

    return NextResponse.json({ success: true, message: `Processed ${subscriptionsSnapshot.size} subscriptions.` });
  } catch (error) {
    console.error('Error in notification task:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

// API to sync client-side state with Firestore for the service worker to access
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
