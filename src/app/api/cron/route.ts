
import { NextResponse } from 'next/server';
import * as webpush from 'web-push';
import { z } from 'zod';
import { add, sub, isWithinInterval } from 'date-fns';
import { DOSE_INTERVAL_HOURS } from '@/lib/constants';
import { initializeServerApp } from '@/lib/firebase-server';

const { db } = initializeServerApp();

const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY as string;
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

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

type FirestoreStateDocument = {
    name: string;
    fields: {
        doses: {
            arrayValue: {
                values: {
                    mapValue: {
                        fields: {
                            time: { stringValue: string };
                            pills: { integerValue: string };
                            type: { stringValue: string };
                        }
                    }
                }[]
            }
        },
        sessionActive: { booleanValue: boolean },
        pushEnabled: { booleanValue: boolean }
    }
};

async function getAccessToken() {
    const response = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
        headers: {
            'Metadata-Flavor': 'Google',
        },
    });
    const data = await response.json();
    return data.access_token;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!VAPID_PRIVATE_KEY || !projectId) {
    console.error("Configuration variables are not set.");
    return NextResponse.json({ success: false, error: "Server configuration incomplete." }, { status: 500 });
  }

  try {
    const accessToken = await getAccessToken();
    const now = new Date();

    const statesResponse = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/states`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!statesResponse.ok) {
        throw new Error(`Failed to fetch states: ${await statesResponse.text()}`);
    }
    const statesData = await statesResponse.json();
    const stateDocs: FirestoreStateDocument[] = statesData.documents || [];
    
    let notificationsSent = 0;
    let errorsEncountered = 0;

    for (const doc of stateDocs) {
      try {
        const docId = doc.name.split('/').pop()!;
        const state = {
            doses: (doc.fields.doses.arrayValue.values || []).map(v => ({
                time: v.mapValue.fields.time.stringValue,
                pills: parseInt(v.mapValue.fields.pills.integerValue, 10),
                type: v.mapValue.fields.type.stringValue,
            })),
            sessionActive: doc.fields.sessionActive.booleanValue,
            pushEnabled: doc.fields.pushEnabled.booleanValue,
        };

        const parseResult = StateSchema.safeParse(state);
        if (!parseResult.success) {
            console.warn(`Invalid state for doc ${docId}:`, parseResult.error);
            continue;
        }
        const parsedState = parseResult.data;
        
        if (!parsedState.sessionActive || !parsedState.pushEnabled) {
            continue;
        }

        const lastDose = parsedState.doses
          .filter((d) => d.type !== "stop")
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())[0] ?? null;

        if (!lastDose) continue;
        
        const lastDoseTime = new Date(lastDose.time);
        const nextDoseDueTime = add(lastDoseTime, { hours: DOSE_INTERVAL_HOURS });

        // Reminder window: 2h before and 2h after the due time
        const reminderWindowStart = sub(nextDoseDueTime, { hours: 2 });
        const reminderWindowEnd = add(nextDoseDueTime, { hours: 2 });
        
        if (isWithinInterval(now, { start: reminderWindowStart, end: reminderWindowEnd })) {
            const subscriptionResponse = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/subscriptions/${docId}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });

            if (!subscriptionResponse.ok) continue;

            const subscriptionData = await subscriptionResponse.json();
            const subscription = {
                endpoint: subscriptionData.fields.endpoint.stringValue,
                keys: {
                    p256dh: subscriptionData.fields.keys.mapValue.fields.p256dh.stringValue,
                    auth: subscriptionData.fields.keys.mapValue.fields.auth.stringValue
                }
            };
          
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
                    const deleteSubUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/subscriptions/${docId}`;
                    const deleteStateUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/states/${docId}`;
                    await fetch(deleteSubUrl, { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } });
                    await fetch(deleteStateUrl, { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } });
                } else {
                    console.error(`Failed to send notification to ${subscription.endpoint}:`, error);
                    errorsEncountered++;
                }
            }
        }
      } catch (error) {
        console.error(`Failed to process state for doc ${doc.name.split('/').pop()}:`, error);
        errorsEncountered++;
      }
    }
    
    return NextResponse.json({ success: true, message: `Cron job finished. Sent ${notificationsSent} notifications. Encountered ${errorsEncountered} errors.` });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ success: false, error: 'Cron job failed' }, { status: 500 });
  }
}
