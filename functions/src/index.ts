
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as webpush from "web-push";
import {z} from "zod";

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

// This file is now only used for simple API calls from the client, not for the cron job.
// The cron logic has been moved to /api/cron/route.ts in the Next.js app.

export const saveSubscription = functions.region("europe-west9").https.onRequest(async (req, res) => {
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

export const saveState = functions.region("europe-west9").https.onRequest(async (req, res) => {
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

export const deleteState = functions.region("europe-west9").https.onRequest(async (req, res) => {
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
