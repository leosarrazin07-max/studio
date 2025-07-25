
import * as admin from "firebase-admin";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { setGlobalOptions, TaskQueue } from "firebase-functions/v2/tasks";
import { HttpsError, onTaskDispatched } from "firebase-functions/v2/https";
import { add } from "date-fns";
import { DOSE_REMINDER_WINDOW_START_HOURS } from "./constants";
import * as logger from "firebase-functions/logger";

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();
const LOCATION = "europe-west9";

// Set the location for all functions
setGlobalOptions({ region: LOCATION });

interface PrepStateDocument {
    fcmToken: string;
    sessionActive: boolean;
    prises: { time: admin.firestore.Timestamp, pills: number }[];
}

/**
 * This function is triggered whenever a user's session document is written to.
 * It schedules a reminder to be sent via the task queue.
 */
export const onDoseLogged = onDocumentWritten("prepSessions/{sessionId}", async (event) => {
    if (!event.data?.after.exists) {
        logger.log("Document deleted. No action taken.");
        return;
    }

    const session = event.data.after.data() as PrepStateDocument;
    const { sessionId } = event.params;

    if (!session.sessionActive || !session.fcmToken || session.prises.length === 0) {
        logger.log(`Session ${sessionId} is inactive or has no token/doses. No reminder will be scheduled.`);
        return;
    }

    const lastDose = session.prises.sort((a, b) => b.time.toMillis() - a.time.toMillis())[0];
    if (!lastDose) {
         logger.log(`Session ${sessionId} has no doses. No reminder will be scheduled.`);
        return;
    }

    const reminderTime = add(lastDose.time.toDate(), { hours: DOSE_REMINDER_WINDOW_START_HOURS });
    const scheduleDelaySeconds = Math.max(0, Math.floor((reminderTime.getTime() - Date.now()) / 1000));

    if (scheduleDelaySeconds <= 0) {
        logger.log(`Reminder time for session ${sessionId} is in the past. No reminder will be scheduled.`);
        return;
    }

    const queue = new TaskQueue< { fcmToken: string; sessionId: string } >("sendremindertask");

    try {
        await queue.enqueue(
            { fcmToken: session.fcmToken, sessionId: sessionId },
            { scheduleTime: reminderTime }
        );
        logger.log(`Reminder scheduled for token ${session.fcmToken} at ${reminderTime}.`);
    } catch (error) {
        logger.error(`Error scheduling reminder for ${sessionId}:`, error);
        // This is often a permissions error if the service account is not configured.
    }
});


/**
 * This function is a V2 Task Queue function.
 * It sends a single push notification to the specified FCM token.
 */
export const sendremindertask = onTaskDispatched<{ fcmToken: string; sessionId: string }>(async (req) => {
    const { fcmToken, sessionId } = req.data;

    if (!fcmToken) {
        logger.warn("Request to sendReminder missing fcmToken.");
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
        logger.log("Successfully sent reminder to", fcmToken);

        const sessionRef = db.collection("prepSessions").doc(sessionId);
        await sessionRef.update({
            lastNotifiedAt: admin.firestore.FieldValue.serverTimestamp()
        });

    } catch (error) {
        logger.error("Error sending reminder to", fcmToken, error);

        if ((error as any).code === 'messaging/registration-token-not-registered') {
            const sessionRef = db.collection("prepSessions").doc(sessionId);
            try {
              await sessionRef.delete();
              logger.log("Deleted document for invalid token:", fcmToken);
            } catch (deleteError) {
              logger.error("Failed to delete document for invalid token:", fcmToken, deleteError);
            }
            return;
        }
        
        // This will cause the task to be retried.
        throw new HttpsError("internal", "Error sending notification, will retry.");
    }
});
