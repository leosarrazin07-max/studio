
import { NextResponse } from 'next/server';
import { initializeServerApp } from '@/lib/firebase-server';
import * as webpush from 'web-push';
import { z } from 'zod';
import { add, sub, isWithinInterval } from 'date-fns';
import { getFirestore } from 'firebase-admin/firestore';
import { DOSE_INTERVAL_HOURS } from '@/lib/constants';

const { db } = initializeServerApp();

const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY as string;
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string;

if (VAPID_PRIVATE_KEY && VAPID_PUBLIC_KEY) {
    webpush.setVapidDetails(
      'mailto:contact@prepy.app',
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    );
}

const SubscriptionSchema = z.object({
  endpoint: z.string(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

const DoseStateSchema = z.object({
  time: z.string().datetime(),
  pills: z.number(),
  type: z.string(),
});

const StateSchema = z.object({
  doses: z.array(DoseStateSchema),
  sessionActive: z.boolean(),
  pushEnabled: z.boolean(),
});

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!VAPID_PRIVATE_KEY) {
    console.error("VAPID_PRIVATE_KEY is not set.");
    return NextResponse.json({ success: false, error: "VAPID_PRIVATE_KEY is not set." }, { status: 500 });
  }

  try {
    const now = new Date();
    const firestore = getFirestore(db);
    const statesSnapshot = await firestore.collection("states").get();

    let notificationsSent = 0;
    let errorsEncountered = 0;

    for (const docSnapshot of statesSnapshot.docs) {
      try {
        const parseResult = StateSchema.safeParse(docSnapshot.data());
        if (!parseResult.success) {
            console.warn(`Invalid state for doc ${docSnapshot.id}:`, parseResult.error);
            continue;
        }
        const state = parseResult.data;
        
        if (!state.sessionActive || !state.pushEnabled) {
            continue;
        }

        const lastDose = state.doses
          .filter((d) => d.type !== "stop")
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())[0] ?? null;

        if (!lastDose) continue;
        
        const lastDoseTime = new Date(lastDose.time);
        const nextDoseDueTime = add(lastDoseTime, { hours: DOSE_INTERVAL_HOURS });

        // Reminder window: 2h before and 2h after the due time
        const reminderWindowStart = sub(nextDoseDueTime, { hours: 2 });
        const reminderWindowEnd = add(nextDoseDueTime, { hours: 2 });
        
        // Check if `now` is within the reminder window
        if (isWithinInterval(now, { start: reminderWindowStart, end: reminderWindowEnd })) {
          const subscriptionRef = firestore.collection("subscriptions").doc(docSnapshot.id);
          const subscriptionSnapshot = await subscriptionRef.get();

          if (!subscriptionSnapshot.exists) continue;

          const subscription = SubscriptionSchema.parse(subscriptionSnapshot.data());
          const payload = JSON.stringify({
            title: "Rappel PrEP",
            body: "Il est temps de prendre votre prochaine dose !",
          });

          try {
            await webpush.sendNotification(subscription, payload);
            notificationsSent++;
          } catch (error: any) {
              if (error instanceof webpush.WebPushError && (error.statusCode === 410 || error.statusCode === 404)) {
                  console.warn(`Subscription ${subscription.endpoint} is no longer valid. Deleting.`);
                  await firestore.collection("subscriptions").doc(docSnapshot.id).delete();
                  await firestore.collection("states").doc(docSnapshot.id).delete();
              } else {
                console.error(`Failed to send notification to ${subscription.endpoint}:`, error);
                errorsEncountered++;
              }
          }
        }
      } catch (error) {
        console.error(`Failed to process state for doc ${docSnapshot.id}:`, error);
        errorsEncountered++;
      }
    }
    
    return NextResponse.json({ success: true, message: `Cron job finished. Sent ${notificationsSent} notifications. Encountered ${errorsEncountered} errors.` });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ success: false, error: 'Cron job failed' }, { status: 500 });
  }
}
