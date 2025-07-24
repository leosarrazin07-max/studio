
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {add, isAfter, isBefore} from "date-fns";
import {
  DOSE_REMINDER_WINDOW_START_HOURS,
  DOSE_REMINDER_WINDOW_END_HOURS,
} from "./constants";

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

interface PrepStateDocument {
    fcmToken: string;
    sessionActive: boolean;
    prises: { time: admin.firestore.Timestamp, pills: number }[];
    lastNotifiedAt: admin.firestore.Timestamp | null;
}

// This function runs every 5 minutes
export const checkDoseReminders = functions.region("europe-west9")
  .pubsub.schedule("every 5 minutes").onRun(async (context) => {
    const now = new Date();
    const querySnapshot = await db.collection("prepSessions").get();

    const tasks: Promise<any>[] = [];

    querySnapshot.forEach((doc) => {
      const session = doc.data() as PrepStateDocument;
      const {fcmToken, sessionActive, prises, lastNotifiedAt} = session;

      // Don't send notifications if the session is inactive
      // or if we have no token.
      if (!sessionActive || !fcmToken || prises.length === 0) {
        return;
      }

      const lastDose = prises.sort((a, b) =>
        b.time.toMillis() - a.time.toMillis())[0];
      if (!lastDose) return;

      const lastDoseTime = lastDose.time.toDate();
      const reminderWindowStart =
        add(lastDoseTime, {hours: DOSE_REMINDER_WINDOW_START_HOURS});
      const reminderWindowEnd =
        add(lastDoseTime, {hours: DOSE_REMINDER_WINDOW_END_HOURS});

      // Check if we are inside the reminder window
      if (isAfter(now, reminderWindowStart) &&
          isBefore(now, reminderWindowEnd)) {
        // To avoid spamming, check if a notification has been sent recently.
        // We'll only send one notification per reminder window.
        const shouldNotify = !lastNotifiedAt ||
                             isBefore(lastNotifiedAt.toDate(), reminderWindowStart);

        if (shouldNotify) {
          const payload = {
            notification: {
              title: "Rappel PrEPy",
              body: "Il est temps de prendre votre comprimé pour rester protégé.",
              icon: "/icons/icon-192x192.png",
            },
            token: fcmToken,
          };

          const sendPromise = messaging.send(payload)
            .then(() => {
              functions.logger.log("Notification sent to token:", fcmToken);
              // Update the last notified time to now
              return doc.ref.update({lastNotifiedAt: admin.firestore.Timestamp.fromDate(now)});
            })
            .catch((error) => {
              functions.logger.error("Error sending notification:", error);
              // If the token is invalid, maybe remove it from the database
              if (error.code === "messaging/registration-token-not-registered") {
                return doc.ref.delete();
              }
              return null;
            });
          tasks.push(sendPromise);
        }
      }
    });

    await Promise.all(tasks);
    return null;
  });

// Add a constants file for shared values
// functions/src/constants.ts
// Values must match src/lib/constants.ts
