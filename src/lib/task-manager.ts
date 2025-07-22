
'use server';
import { CloudTasksClient } from '@google-cloud/tasks';
import { google } from '@google-cloud/tasks/build/protos/protos';
import { add, sub } from 'date-fns';
import { DOSE_REMINDER_WINDOW_START_HOURS, DOSE_REMINDER_WINDOW_END_HOURS, PROTECTION_START_HOURS } from '@/lib/constants';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
const QUEUE_LOCATION = 'europe-west1';
const QUEUE_ID = 'prep-notifications';
const API_ENDPOINT = '/api/tasks/notification';

const tasksClient = new CloudTasksClient();

const getQueuePath = () => {
    return tasksClient.queuePath(PROJECT_ID, QUEUE_LOCATION, QUEUE_ID);
}

// Helper to get full URL for the task handler
const getHandlerUrl = () => {
    // In production, App Hosting provides the base URL.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
        throw new Error("NEXT_PUBLIC_APP_URL environment variable is not set.");
    }
    return `${baseUrl}${API_ENDPOINT}`;
}

// We give each user's notification chain a consistent name to be able to cancel it.
const getTaskName = (subscriptionId: string, type: 'chain' | 'protection', timestamp: number) => {
    return tasksClient.taskPath(PROJECT_ID, QUEUE_LOCATION, QUEUE_ID, `${subscriptionId}_${type}_${timestamp}`);
}

/**
 * Creates the first task in a notification chain for dose reminders.
 * @param subscriptionId - Unique ID for the user's subscription.
 * @param lastDoseTime - The time of the user's last dose.
 */
export async function scheduleNotificationChain(subscriptionId: string, lastDoseTime: Date) {
    const startTime = add(lastDoseTime, { hours: DOSE_REMINDER_WINDOW_START_HOURS });
    const endTime = add(lastDoseTime, { hours: DOSE_REMINDER_WINDOW_END_HOURS });

    const payload = {
        subscriptionId,
        type: 'first_reminder',
        endTime: endTime.toISOString(),
    };

    const task: google.cloud.tasks.v2.ITask = {
        name: getTaskName(subscriptionId, 'chain', startTime.getTime()),
        httpRequest: {
            httpMethod: 'POST',
            url: getHandlerUrl(),
            headers: { 'Content-Type': 'application/json' },
            body: Buffer.from(JSON.stringify(payload)).toString('base64'),
        },
        scheduleTime: {
            seconds: Math.floor(startTime.getTime() / 1000),
        },
    };

    try {
        await tasksClient.createTask({ parent: getQueuePath(), task });
    } catch (error: any) {
        // If the task already exists, it's not an error for us.
        if (error.code !== 6) { // 6 = ALREADY_EXISTS
            console.error("Failed to create notification chain task:", error);
            throw error;
        }
    }
}

/**
 * Schedules the one-time notification for when protection becomes active.
 * @param subscriptionId - Unique ID for the user's subscription.
 * @param firstDoseTime - The time of the user's very first dose in the session.
 */
export async function scheduleProtectionActiveNotification(subscriptionId: string, firstDoseTime: Date) {
    const protectionTime = add(firstDoseTime, { hours: PROTECTION_START_HOURS });

    const payload = {
        subscriptionId,
        type: 'protection_active',
    };

    const task: google.cloud.tasks.v2.ITask = {
        name: getTaskName(subscriptionId, 'protection', protectionTime.getTime()),
        httpRequest: {
            httpMethod: 'POST',
            url: getHandlerUrl(),
            headers: { 'Content-Type': 'application/json' },
            body: Buffer.from(JSON.stringify(payload)).toString('base64'),
        },
        scheduleTime: {
            seconds: Math.floor(protectionTime.getTime() / 1000),
        },
    };
    
    try {
        await tasksClient.createTask({ parent: getQueuePath(), task });
    } catch (error: any) {
        if (error.code !== 6) { // 6 = ALREADY_EXISTS
            console.error("Failed to create protection active task:", error);
            throw error;
        }
    }
}

/**
 * Cancels all scheduled tasks for a given user.
 * This is useful when the user ends a session or deletes their history.
 * @param subscriptionId - Unique ID for the user's subscription.
 */
export async function cancelUserNotifications(subscriptionId: string) {
    try {
        const [tasks] = await tasksClient.listTasks({ parent: getQueuePath() });
        const userTasks = tasks.filter(task => task.name && task.name.includes(subscriptionId));

        for (const task of userTasks) {
            if (task.name) {
                try {
                    await tasksClient.deleteTask({ name: task.name });
                } catch (deleteError: any) {
                    // It might have been executed between list and delete, not a critical error.
                    if (deleteError.code !== 5) { // 5 = NOT_FOUND
                        console.warn(`Could not delete task ${task.name}:`, deleteError.message);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Failed to list or cancel tasks for user:", error);
        throw error;
    }
}
