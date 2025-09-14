
import { NextResponse } from 'next/server';
import { admin, firestore } from '@/lib/firebase-admin';
import { add, differenceInHours, differenceInMinutes, isBefore } from 'date-fns';
import { PROTECTION_START_HOURS, DOSE_REMINDER_WINDOW_START_HOURS, DOSE_REMINDER_WINDOW_END_HOURS, DOSE_REMINDER_INTERVAL_MINUTES } from '@/lib/constants';

// This is a placeholder for a real task queue client
// In a real Google Cloud environment, you'd use @google-cloud/tasks
const cloudTasksClient = {
  createTask: async ({ a, b, c, d }: { a: any, b: any, c: any, d: any }) => {
    console.log(`[TASK_SIMULATOR] Task created to be executed at ${b}`);
    const delay = differenceInMinutes(new Date(b), new Date());
    setTimeout(() => {
        // In a real scenario, this would be an HTTP call from Cloud Tasks
        // to our own endpoint. Here we just simulate sending the message.
        console.log(`[TASK_SIMULATOR] Executing task for token ${d.token}`);
        admin.messaging().send(d).catch(err => console.error("Error in simulated task:", err));
    }, delay * 60 * 1000);
    return Promise.resolve('[simulated-task]');
  },
  // In a real scenario, we'd need to manage task names to cancel them.
  deleteTask: (taskName: string) => {
    console.log(`[TASK_SIMULATOR] Would delete task: ${taskName}. (Not implemented in simulator)`);
    return Promise.resolve();
  }
}

async function sendNotification(fcmToken: string, title: string, body: string) {
    if (!fcmToken) return;
    const message = {
        notification: { title, body },
        token: fcmToken,
        webpush: {
            notification: {
                icon: '/notification-icon.png',
                badge: '/status-bar-icon.png'
            }
        }
    };
    try {
        await admin.messaging().send(message);
        console.log(`[${fcmToken}] Notification sent: ${title}`);
    } catch (error) {
        console.error(`[${fcmToken}] Failed to send notification:`, error);
        if ((error as any).code === 'messaging/registration-token-not-registered') {
            await firestore.collection('prepSessions').doc(fcmToken).delete();
            console.log(`[${fcmToken}] Removed invalid token from Firestore.`);
        }
    }
}

// A helper to schedule a task. In a real app, this would use Cloud Tasks.
async function scheduleTask(fcmToken: string, executeAt: Date, title: string, body: string) {
    if (isBefore(executeAt, new Date())) {
        console.log(`[${fcmToken}] Task for "${title}" is in the past. Skipping.`);
        return;
    }
    const message = {
        notification: { title, body },
        token: fcmToken,
        webpush: {
            notification: {
                icon: '/notification-icon.png',
                badge: '/status-bar-icon.png'
            }
        }
    };
    // The simulator sends it directly. A real implementation would make an HTTP request.
    await cloudTasksClient.createTask({ a: null, b: executeAt.toISOString(), c: null, d: message });
}


// This endpoint should be triggered by Eventarc on Firestore document write
// to projects/{project}/databases/(default)/documents/prepSessions/{token}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Received Eventarc payload:", JSON.stringify(body, null, 2));

    // Extract the document data from the Eventarc payload
    const fcmToken = body.documentName.split('/').pop();
    const eventData = body.value;

    if (!fcmToken || !eventData) {
        console.error("Invalid Eventarc payload, missing token or data.");
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // First, clear any existing tasks for this token (important!)
    // This is a simplification. A real implementation would require storing task IDs.
    // await cloudTasksClient.deleteTask(...)

    const { sessionActive, pushEnabled, prises } = {
        sessionActive: eventData.fields.sessionActive.booleanValue,
        pushEnabled: eventData.fields.pushEnabled.booleanValue,
        prises: eventData.fields.prises.arrayValue.values.map((v: any) => ({
            id: v.mapValue.fields.id.stringValue,
            pills: parseInt(v.mapValue.fields.pills.integerValue),
            time: new Date(v.mapValue.fields.time.timestampValue),
            type: v.mapValue.fields.type.stringValue
        }))
    };
    
    if (!sessionActive || !pushEnabled) {
        console.log(`[${fcmToken}] Session not active or push disabled. No notifications will be scheduled.`);
        return NextResponse.json({ message: "Scheduling skipped." });
    }
    
    const doses = prises.filter((p: any) => p.type !== 'stop').sort((a: any, b: any) => a.time.getTime() - b.time.getTime());
    if (doses.length === 0) {
        console.log(`[${fcmToken}] No doses found. No notifications will be scheduled.`);
        return NextResponse.json({ message: "Scheduling skipped, no doses." });
    }

    const lastDose = doses[doses.length - 1];
    const firstDose = doses[0];

    // --- SCHEDULE NOTIFICATIONS BASED ON STATE ---

    // 1. Protection start notification (only for the very first dose)
    if (doses.length === 1 && lastDose.type === 'start') {
        const protectionTime = add(lastDose.time, { hours: PROTECTION_START_HOURS });
        await scheduleTask(fcmToken, protectionTime, 'Protection PrEPy active !', "Votre protection est maintenant effective.");
    }
    
    // Check for lapsed protection
    const hoursSinceLastDose = differenceInHours(new Date(), lastDose.time);
    if(hoursSinceLastDose > DOSE_REMINDER_WINDOW_END_HOURS) {
         await sendNotification(fcmToken, "Prise manquée", "Votre protection PrEPy n'est plus garantie. Ouvrez l'application pour la suite.");
         // Stop scheduling further notifications
         return NextResponse.json({ message: "Protection lapsed. Final notification sent." });
    }

    // 2. Schedule the main reminder window
    const reminderWindowStart = add(lastDose.time, { hours: DOSE_REMINDER_WINDOW_START_HOURS });
    await scheduleTask(fcmToken, reminderWindowStart, 'Rappel PrEPy', "Il est temps de penser à prendre votre comprimé. Vous avez 4 heures.");

    // 3. Schedule insistent reminders every 10 minutes within the 4-hour window
    const reminderWindowEnd = add(lastDose.time, { hours: DOSE_REMINDER_WINDOW_END_HOURS });
    for (let i = DOSE_REMINDER_INTERVAL_MINUTES; i < (DOSE_REMINDER_WINDOW_END_HOURS - DOSE_REMINDER_WINDOW_START_HOURS) * 60; i += DOSE_REMINDER_INTERVAL_MINUTES) {
        const reminderTime = add(reminderWindowStart, { minutes: i });
        if (isBefore(reminderTime, reminderWindowEnd)) {
            await scheduleTask(fcmToken, reminderTime, 'Rappel PrEPy', `N'oubliez pas votre comprimé !`);
        }
    }
    
    // 4. Schedule the final "missed dose" notification
    await scheduleTask(fcmToken, reminderWindowEnd, 'Prise manquée !', "Vous avez dépassé le délai pour votre prise. La protection est rompue.");


    console.log(`[${fcmToken}] Notifications scheduled successfully following last dose at ${lastDose.time.toISOString()}`);
    return NextResponse.json({ success: true, message: 'Notification tasks scheduled.' });
  } catch (error) {
    console.error('Error in schedule-notifications function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
