
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as webpush from "web-push";
import {z} from "zod";
import { add } from 'date-fns';


admin.initializeApp();
const db = admin.firestore();

const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_PUBLIC_KEY =
  "BGEPqO_1POfO9s3j01tpkLdYd-v1jYYtMGTcwaxgQ2I_exGj155R8Xk-sXeyV6ORHIq8n4XhGzAsaKxV9wJzO6w";

if (VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:contact@prepy.app",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
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
  time: z.string(),
  pills: z.number(),
  type: z.string(),
});

const StateSchema = z.object({
  doses: z.array(DoseStateSchema),
  sessionActive: z.boolean(),
  pushEnabled: z.boolean(),
});


// Proxied API endpoints for client to call
export const saveSubscription = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }
  try {
    const subscription = SubscriptionSchema.parse(req.body);
    await db.collection("subscriptions").doc(subscription.endpoint).set(subscription);
    res.status(200).send({success: true});
  } catch (error) {
    functions.logger.error("Failed to save subscription:", error);
    res.status(500).send({success: false});
  }
});

export const saveState = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).send('');
    return;
  }
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }
  try {
    const {endpoint, state} = req.body;
    await db.collection("states").doc(endpoint).set(state);
    res.status(200).send({success: true});
  } catch (error) {
    functions.logger.error("Failed to save state:", error);
    res.status(500).send({success: false});
  }
});

export const deleteState = functions.https.onRequest(async (req, res) => {
    res.set('Access-control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
      res.set('Access-Control-Allow-Methods', 'POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.status(204).send('');
      return;
    }
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }
    try {
      const {endpoint} = req.body;
      await db.collection("states").doc(endpoint).delete();
      await db.collection("subscriptions").doc(endpoint).delete();
      res.status(200).send({success: true});
    } catch (error) {
      functions.logger.error("Failed to delete state:", error);
      res.status(500).send({success: false});
    }
  });


// Scheduled function to check for reminders
export const checkAndSendReminders = functions.runWith({secrets: ["VAPID_PRIVATE_KEY"]}).https
  .onRequest(async (req, res) => {
    functions.logger.info("Running checkAndSendReminders on request");

    if (!VAPID_PRIVATE_KEY) {
      functions.logger.error("VAPID_PRIVATE_KEY is not set.");
      res.status(500).send("VAPID_PRIVATE_KEY is not set.");
      return;
    }

    const now = new Date();
    const statesSnapshot = await db.collection("states").where("sessionActive", "==", true).where("pushEnabled", "==", true).get();

    for (const doc of statesSnapshot.docs) {
      try {
        const state = StateSchema.parse(doc.data());
        
        const lastDose = state.doses
          .filter((d) => d.type !== "stop")
          .sort((a, b) => (
            new Date(b.time).getTime() - new Date(a.time).getTime()
          ))[0] ?? null;

        if (!lastDose) continue;
        
        const lastDoseTime = new Date(lastDose.time);
        const nextDoseDueTime = add(lastDoseTime, { hours: 22 });
        const gracePeriodEndTime = add(nextDoseDueTime, { hours: 4 });

        if (now >= nextDoseDueTime && now <= gracePeriodEndTime) {
          const subscriptionSnapshot = await db
            .collection("subscriptions")
            .doc(doc.id)
            .get();

          if (!subscriptionSnapshot.exists) continue;

          const subscription = SubscriptionSchema.parse(
            subscriptionSnapshot.data(),
          );
          const payload = JSON.stringify({
            title: "Rappel PrEP",
            body: "Il est temps de prendre votre prochaine dose !",
          });

          try {
            await webpush.sendNotification(subscription, payload);
            functions.logger.info(`Sent notification to ${subscription.endpoint}`);
          } catch (error) {
              if (error instanceof webpush.WebPushError && (error.statusCode === 410 || error.statusCode === 404)) {
                  functions.logger.warn(`Subscription ${subscription.endpoint} is no longer valid. Deleting.`);
                  await db.collection("subscriptions").doc(doc.id).delete();
                  await db.collection("states").doc(doc.id).delete();
              } else {
                functions.logger.error(`Failed to send notification to ${subscription.endpoint}:`, error);
              }
          }
        }
      } catch (error) {
        functions.logger.error(`Failed to process state for doc ${doc.id}:`, error);
      }
    }
    functions.logger.info("Finished checkAndSendReminders job");
    res.status(200).send("Reminders check finished.");
  });
    