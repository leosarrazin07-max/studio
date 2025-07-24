
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {add, isBefore} from "date-fns";
import {
  DOSE_REMINDER_WINDOW_START_HOURS,
  DOSE_REMINDER_WINDOW_END_HOURS,
} from "../../src/lib/constants";

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

interface Prise {
  time: string; // ISO string
  pills: number;
  type: "start" | "dose" | "stop";
  id: string;
}

interface PrepState {
  prises: Prise[];
  sessionActive: boolean;
  pushEnabled: boolean;
}

export const checkDoseReminders = functions.pubsub
  .schedule("every 5 minutes")
  .onRun(async (context) => {
    const now = new Date();
    const tokensSnapshot = await db.collection("fcmTokens").get();

    if (tokensSnapshot.empty) {
      console.log("No tokens to process.");
      return null;
    }

    const promises: Promise<any>[] = [];

    tokensSnapshot.forEach((doc) => {
      const token = doc.id;
      const data = doc.data() as PrepState;

      if (!data.sessionActive || !data.prises || data.prises.length === 0) {
        return; // Skip inactive sessions or those with no doses
      }

      // Sort doses and find the last one
      const sortedDoses = data.prises
        .filter((p) => p.type !== "stop")
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      if (sortedDoses.length === 0) {
        return;
      }
      const lastDose = sortedDoses[0];
      const lastDoseTime = new Date(lastDose.time);

      const reminderWindowStart = add(lastDoseTime, {
        hours: DOSE_REMINDER_WINDOW_START_HOURS,
      });
      const reminderWindowEnd = add(lastDoseTime, {
        hours: DOSE_REMINDER_WINDOW_END_HOURS,
      });

      // Check if we are within the reminder window
      if (
        isBefore(now, reminderWindowEnd) &&
        isBefore(reminderWindowStart, now)
      ) {
        const payload: admin.messaging.MessagingPayload = {
          notification: {
            title: "Rappel PrEPy !",
            body:
              "C'est le moment de prendre votre comprimé pour rester protégé.",
            icon: "/icons/icon-192x192.png",
          },
        };

        promises.push(
          messaging.sendToDevice(token, payload).catch((error) => {
            console.error("Failure sending notification to", token, error);
            // Cleanup stale tokens
            if (
              error.code === "messaging/invalid-registration-token" ||
              error.code === "messaging/registration-token-not-registered"
            ) {
              return doc.ref.delete();
            }
            return;
          })
        );
      }
    });

    await Promise.all(promises);
    console.log("Dose reminder check complete.");
    return null;
  });

    