
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
// IMPORTANT: The function name must match the exported name in this file.
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
                // The URI should point to the sendReminder function in the correct region.
                // It's constructed dynamically from environment variables provided by Firebase.
                uri: `https://${LOCATION}-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/sendReminder`,
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
            icon: "/icons/icon-192x192.svg",
        },
        token: fcmToken,
    };

    try {
        await messaging.send(payload);
        functions.logger.log("Successfully sent reminder to", fcmToken);
        
        // Find the document by FCM token and update it.
        const sessionRef = db.collection("prepSessions").doc(fcmToken);
        // We only update lastNotifiedAt here, as sending a notification shouldn't alter the core session state.
        await sessionRef.update({
            lastNotifiedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        res.status(200).send("Reminder sent.");
    } catch (error) {
        functions.logger.error("Error sending reminder to", fcmToken, error);
        
        const firebaseError = error as functions.https.HttpsError;
        // Check for a specific error code that indicates an invalid or unregistered token
        if (firebaseError.code === "messaging/registration-token-not-registered") {
            // The token is no longer valid, probably because the user uninstalled the app or cleared data.
            // We should delete the session document to clean up.
            await db.collection("prepSessions").doc(fcmToken).delete();
            functions.logger.log("Deleted document for invalid token:", fcmToken);
        }
        
        res.status(500).send("Error sending notification.");
    }
});

    