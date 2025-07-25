
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getFunctions } from "firebase-admin/functions";
import {add} from "date-fns";
import { onTaskDispatched } from "firebase-functions/v2/tasks";
import { DOSE_REMINDER_WINDOW_START_HOURS } from "./constants";

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();
const LOCATION = "europe-west9";
const taskQueue = getFunctions().taskQueue("reminderTasks", LOCATION);

interface PrepStateDocument {
    fcmToken: string;
    sessionActive: boolean;
    prises: { time: admin.firestore.Timestamp, pills: number }[];
    lastNotifiedAt: admin.firestore.Timestamp | null;
}

/**
 * This function is triggered whenever a user's session document is written to.
 * It schedules a reminder to be sent via the task queue.
 */
export const onDoseLogged = functions.region(LOCATION).firestore
  .document("prepSessions/{sessionId}")
  .onWrite(async (change, context) => {
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

    const reminderTime = add(lastDose.time.toDate(), { hours: DOSE_REMINDER_WINDOW_START_HOURS });
    const scheduleDelaySeconds = Math.floor((reminderTime.getTime() - Date.now()) / 1000);

    if (scheduleDelaySeconds <= 0) {
        functions.logger.log(`Reminder time for session ${sessionId} is in the past. No reminder will be scheduled.`);
        return null;
    }

    try {
        await taskQueue.enqueue(
            { fcmToken: session.fcmToken, sessionId: sessionId },
            { scheduleDelaySeconds }
        );
        functions.logger.log(`Reminder scheduled for token ${session.fcmToken} in ${scheduleDelaySeconds} seconds.`);
    } catch (error) {
        functions.logger.error(`Error scheduling reminder for ${sessionId}:`, error);
    }

    return null;
});


/**
 * This function is a V2 Task Queue function.
 * It sends a single push notification to the specified FCM token.
 */
export const sendReminder = onTaskDispatched<{"fcmToken": string, "sessionId": string}>(
    {
        region: LOCATION,
        taskQueueOptions: {
            name: "reminderTasks",
            retryConfig: {
                maxAttempts: 5,
                minBackoffSeconds: 60,
            },
            rateLimits: {
                maxConcurrentDispatches: 1000,
            },
        },
    },
    async (task) => {
        const { fcmToken, sessionId } = task.data;

        if (!fcmToken) {
            functions.logger.warn("Request to sendReminder missing fcmToken.");
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

            const sessionRef = db.collection("prepSessions").doc(sessionId);
            await sessionRef.update({
                lastNotifiedAt: admin.firestore.FieldValue.serverTimestamp()
            });

        } catch (error) {
            functions.logger.error("Error sending reminder to", fcmToken, error);

            if ((error as any).code === 'messaging/registration-token-not-registered') {
                await db.collection("prepSessions").doc(sessionId).delete();
                functions.logger.log("Deleted document for invalid token:", fcmToken);
                return;
            }

            throw new functions.https.HttpsError("internal", "Error sending notification, will retry.");
        }
    }
);
