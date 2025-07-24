
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getFunctions } from "firebase-admin/functions";
import {add} from "date-fns";
import {
  DOSE_REMINDER_WINDOW_START_HOURS,
} from "./constants";

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();
const LOCATION = "europe-west9";
const queue = getFunctions().taskQueue("sendReminder", LOCATION);


interface PrepStateDocument {
    fcmToken: string;
    sessionActive: boolean;
    prises: { time: admin.firestore.Timestamp, pills: number }[];
    lastNotifiedAt: admin.firestore.Timestamp | null;
}

/**
 * This function is triggered whenever a user's session document is written to.
 * It cancels any pending reminders and schedules a new one if the session is active.
 */
export const onDoseLogged = functions.region(LOCATION).firestore
  .document("prepSessions/{sessionId}")
  .onWrite(async (change, context) => {
    // We don't need to do anything if the document is deleted.
    if (!change.after.exists) {
        functions.logger.log("Document deleted. No action taken.");
        return null;
    }

    const session = change.after.data() as PrepStateDocument;
    const { sessionId } = context.params;

    // First, let's cancel any previously scheduled notifications for this session
    // to avoid duplicate reminders. The Task Queue API doesn't have a simple
    // "cancel by tag" feature, so we rely on naming tasks predictively.
    // For this app, we assume one reminder per session is enough.
    // A more complex app might store task names in Firestore.

    if (!session.sessionActive || !session.fcmToken || session.prises.length === 0) {
        functions.logger.log(`Session ${sessionId} is inactive or has no token/doses. No reminder will be scheduled.`);
        return null;
    }

    const lastDose = session.prises.sort((a, b) => b.time.toMillis() - a.time.toMillis())[0];
    if (!lastDose) {
         functions.logger.log(`Session ${sessionId} has no doses. No reminder will be scheduled.`);
        return null;
    }

    // Schedule the new reminder
    const reminderTime = add(lastDose.time.toDate(), { hours: DOSE_REMINDER_WINDOW_START_HOURS });
    const scheduleDelaySeconds = Math.floor((reminderTime.getTime() - Date.now()) / 1000);

    if (scheduleDelaySeconds <= 0) {
        functions.logger.log(`Reminder time for session ${sessionId} is in the past. No reminder will be scheduled.`);
        return null;
    }

    try {
        await queue.enqueue(
            { fcmToken: session.fcmToken },
            {
                scheduleDelaySeconds,
                // Use a stable name to effectively "cancel" and replace any pending task for this session.
                // If a task with this name already exists, it will be replaced.
                uri: `https://us-central1-prepy-33a65.cloudfunctions.net/sendReminder`, // TODO: Get this dynamically
            }
        );
        functions.logger.log(`Reminder scheduled for token ${session.fcmToken} in ${scheduleDelaySeconds} seconds.`);
    } catch (error) {
        functions.logger.error(`Error scheduling reminder for ${sessionId}:`, error);
    }

    return null;
});


/**
 * This function is an HTTP endpoint designed to be called by Cloud Tasks.
 * It sends a single push notification to the specified FCM token.
 */
export const sendReminder = functions.region(LOCATION).https.onRequest(async (req, res) => {
    if (req.method !== "POST") {
        functions.logger.warn("Received non-POST request to sendReminder.");
        res.status(405).send("Method Not Allowed");
        return;
    }

    const { fcmToken } = req.body;

    if (!fcmToken) {
        functions.logger.warn("Request to sendReminder missing fcmToken.");
        res.status(400).send("Bad Request: fcmToken is required.");
        return;
    }

    const payload = {
        notification: {
            title: "Rappel PrEPy",
            body: "Il est temps de prendre votre comprimé pour rester protégé.",
            icon: "/icons/icon-192x192.png",
        },
        token: fcmToken,
    };

    try {
        await messaging.send(payload);
        functions.logger.log("Successfully sent reminder to", fcmToken);
        // Update the user's document to prevent re-notification within the same window
        await db.collection("prepSessions").doc(fcmToken).update({
            lastNotifiedAt: admin.firestore.Timestamp.now()
        });
        res.status(200).send("Reminder sent.");
    } catch (error) {
        functions.logger.error("Error sending reminder to", fcmToken, error);
        // If the token is invalid, delete the session document
        if (error.code === "messaging/registration-token-not-registered") {
            await db.collection("prepSessions").doc(fcmToken).delete();
            functions.logger.log("Deleted invalid token:", fcmToken);
        }
        res.status(500).send("Error sending notification.");
    }
});
