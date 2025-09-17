
import * as admin from "firebase-admin";
import { logger } from "firebase-functions";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { CloudTasksClient } from "@google-cloud/tasks";
import { google } from "@google-cloud/tasks/build/protos/protos";
import { add, isBefore } from "date-fns";

admin.initializeApp();
const firestore = admin.firestore();

const tasksClient = new CloudTasksClient();
const project = process.env.GCLOUD_PROJECT || "";
const location = "europe-west9";
const queue = "prep-notifications";
const taskQueuePath = tasksClient.queuePath(project, location, queue);
const NOTIFICATION_DISPATCHER_URL = `https://${location}-${project}.cloudfunctions.net/dispatchNotification`;

// Constants from the main app
const PROTECTION_START_HOURS = 2;
const DOSE_REMINDER_WINDOW_START_HOURS = 22;
const DOSE_REMINDER_WINDOW_END_HOURS = 26;
const DOSE_REMINDER_INTERVAL_MINUTES = 10;

interface Prise {
    time: admin.firestore.Timestamp;
    pills: number;
    type: "start" | "dose" | "stop";
    id: string;
}

interface PrepSession {
    fcmToken: string;
    sessionActive: boolean;
    pushEnabled: boolean;
    prises: Prise[];
    scheduledTasks?: string[];
}

/**
 * Schedules a notification to be sent at a specific time using Cloud Tasks.
 */
async function scheduleNotification(
  executeAt: Date,
  fcmToken: string,
  title: string,
  body: string,
): Promise<string> {
  if (isBefore(executeAt, new Date())) {
    logger.info(`[${fcmToken}] Task for "${title}" is in the past. Skipping.`);
    return "skipped-past-date";
  }

  const payload = {fcmToken, title, body};
  const task: google.cloud.tasks.v2.ITask = {
    httpRequest: {
      httpMethod: "POST",
      url: NOTIFICATION_DISPATCHER_URL,
      headers: {"Content-Type": "application/json"},
      body: Buffer.from(JSON.stringify(payload)).toString("base64"),
    },
    scheduleTime: {
      seconds: Math.floor(executeAt.getTime() / 1000),
    },
  };

  try {
    const [response] = await tasksClient.createTask({parent: taskQueuePath, task});
    logger.info(`[${fcmToken}] Task ${response.name} scheduled for "${title}" at ${executeAt.toISOString()}`);
    return response.name || "unknown-task-name";
  } catch (error) {
    logger.error(`[${fcmToken}] Error scheduling task:`, error);
    throw error;
  }
}

/**
 * Cancels all previously scheduled tasks for a given session.
 */
async function cancelPreviousTasks(taskNames: string[] | undefined) {
  if (!taskNames || taskNames.length === 0) {
    return;
  }
  logger.info(`Cancelling ${taskNames.length} previous tasks.`);
  const cancellationPromises = taskNames.map(async (taskName) => {
    try {
      // Skip placeholder values from failed schedules
      if (taskName === "skipped-past-date" || taskName === "unknown-task-name") return;
      await tasksClient.deleteTask({name: taskName});
      logger.info(`Task ${taskName} deleted successfully.`);
    } catch (error: any) {
      // It's okay if the task is already deleted or executed (NOT_FOUND)
      if (error.code !== 5) {
        logger.error(`Error deleting task ${taskName}:`, error);
      }
    }
  });
  await Promise.all(cancellationPromises);
}

/**
 * This function is triggered whenever a prepSession document is written to.
 * It's responsible for scheduling all future notifications for that session.
 */
export const scheduleNotifications = onDocumentWritten({
    document: "prepSessions/{fcmToken}",
    region: "europe-west9",
}, async (event) => {
    const fcmToken = event.params.fcmToken;
    const sessionDocRef = firestore.collection("prepSessions").doc(fcmToken);

    const oldData = event.data?.before.data() as PrepSession | undefined;
    await cancelPreviousTasks(oldData?.scheduledTasks);

    const data = event.data?.after.data() as PrepSession | undefined;

    if (!data || !data.sessionActive || !data.pushEnabled) {
      logger.info(`[${fcmToken}] Session ended or push disabled. No new notifications will be scheduled.`);
      return;
    }

    const doses = data.prises
      .filter((p) => p.type !== "stop")
      .sort((a, b) => a.time.toMillis() - b.time.toMillis());

    if (doses.length === 0) {
      logger.info(`[${fcmToken}] No doses found. Nothing to schedule.`);
      return;
    }

    const lastDose = doses[doses.length - 1];
    const lastDoseTime = lastDose.time.toDate();
    const newScheduledTasks: string[] = [];

    if (doses.length === 1 && lastDose.type === "start") {
      const protectionTime = add(lastDoseTime, {hours: PROTECTION_START_HOURS});
      const taskName = await scheduleNotification(
        protectionTime, fcmToken,
        "Protection PrEPy active !",
        "Votre protection est maintenant effective."
      );
      newScheduledTasks.push(taskName);
    }

    const reminderWindowStart = add(lastDoseTime, {hours: DOSE_REMINDER_WINDOW_START_HOURS});
    const task1Name = await scheduleNotification(
      reminderWindowStart, fcmToken,
      "Rappel PrEPy",
      "Il est temps de penser à prendre votre comprimé. Vous avez 4 heures."
    );
    newScheduledTasks.push(task1Name);

    const reminderWindowEnd = add(lastDoseTime, {hours: DOSE_REMINDER_WINDOW_END_HOURS});
    let reminderCount = 1;
    for (let i = DOSE_REMINDER_INTERVAL_MINUTES; i < (DOSE_REMINDER_WINDOW_END_HOURS - DOSE_REMINDER_WINDOW_START_HOURS) * 60; i += DOSE_REMINDER_INTERVAL_MINUTES) {
      const reminderTime = add(reminderWindowStart, {minutes: i});
      if (isBefore(reminderTime, reminderWindowEnd)) {
        const taskNName = await scheduleNotification(
          reminderTime, fcmToken,
          `Rappel PrEPy (${reminderCount + 1})`,
          "N'oubliez pas votre comprimé !"
        );
        newScheduledTasks.push(taskNName);
        reminderCount++;
      }
    }

    const taskFinalName = await scheduleNotification(
      reminderWindowEnd, fcmToken,
      "Prise manquée !",
      "Vous avez dépassé le délai pour votre prise. La protection est rompue."
    );
    newScheduledTasks.push(taskFinalName);

    await sessionDocRef.update({scheduledTasks: newScheduledTasks});
    logger.info(`[${fcmToken}] ${newScheduledTasks.length} notifications scheduled successfully.`);
  });


/**
 * This HTTP-triggered function is the target for Cloud Tasks.
 * It receives a payload and sends the notification via FCM.
 */
export const dispatchNotification = onRequest({
    region: "europe-west9",
    // Ensure the function can be called without authentication from Cloud Tasks
    invoker: "public",
}, async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const {fcmToken, title, body} = req.body;

    if (!fcmToken || !title || !body) {
      logger.error("Invalid payload received:", req.body);
      res.status(400).send("Bad Request: fcmToken, title, and body are required.");
      return;
    }

    const message = {
      notification: {title, body},
      token: fcmToken,
      webpush: {
        notification: {
          icon: "/notification-icon.png",
          badge: "/status-bar-icon.png",
        },
      },
    };

    try {
      await admin.messaging().send(message);
      logger.info(`[${fcmToken}] Notification sent: ${title}`);
      res.status(200).send("Notification sent successfully.");
    } catch (error) {
      logger.error(`[${fcmToken}] Failed to send notification:`, error);
      if ((error as any).code === "messaging/registration-token-not-registered") {
        await firestore.collection("prepSessions").doc(fcmToken).delete();
        logger.info(`[${fcmToken}] Removed invalid token from Firestore.`);
      }
      res.status(500).send("Internal Server Error");
    }
  });
