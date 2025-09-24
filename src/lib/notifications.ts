"use client";

import { Capacitor } from '@capacitor/core';
import { LocalNotifications, PermissionStatus, ScheduleOptions } from '@capacitor/local-notifications';
import { add } from 'date-fns';
import { DOSE_REMINDER_WINDOW_START_HOURS, DOSE_REMINDER_WINDOW_END_HOURS, DOSE_REMINDER_INTERVAL_MINUTES, PROTECTION_START_HOURS } from './constants';
import type { T } from './types';

export const checkPermissions = async (): Promise<PermissionStatus> => {
    if (!Capacitor.isNativePlatform()) {
        return { display: 'denied' };
    }
    return await LocalNotifications.checkPermissions();
};

export const requestPermissions = async (): Promise<PermissionStatus> => {
    if (!Capacitor.isNativePlatform()) {
        return { display: 'denied' };
    }
    return await LocalNotifications.requestPermissions();
};

export const areNotificationsEnabled = async (): Promise<boolean> => {
    const permissions = await checkPermissions();
    return permissions.display === 'granted';
};

export const scheduleDoseReminders = async (lastDoseTime: Date, t: T) => {
    if (!(await areNotificationsEnabled())) return;

    await cancelAllNotifications();

    const notifications: ScheduleOptions['notifications'] = [];

    // Protection active notification
    const protectionTime = add(lastDoseTime, { hours: PROTECTION_START_HOURS });
    if (protectionTime > new Date()) {
        notifications.push({
            id: 1,
            title: "Protection PrEPy active !",
            body: "Votre protection est maintenant effective.",
            schedule: { at: protectionTime },
        });
    }

    // Reminder window start
    const reminderWindowStart = add(lastDoseTime, { hours: DOSE_REMINDER_WINDOW_START_HOURS });
     if (reminderWindowStart > new Date()) {
        notifications.push({
            id: 2,
            title: "Rappel PrEPy",
            body: "Il est temps de penser à prendre votre comprimé. Vous avez 4 heures.",
            schedule: { at: reminderWindowStart },
        });
    }
    
    // Intermediate reminders
    const reminderWindowEnd = add(lastDoseTime, { hours: DOSE_REMINDER_WINDOW_END_HOURS });
    let reminderCount = 1;
    let notificationId = 3;
    for (let i = DOSE_REMINDER_INTERVAL_MINUTES; i < (DOSE_REMINDER_WINDOW_END_HOURS - DOSE_REMINDER_WINDOW_START_HOURS) * 60; i += DOSE_REMINDER_INTERVAL_MINUTES) {
      const reminderTime = add(reminderWindowStart, {minutes: i});
      if (reminderTime < reminderWindowEnd && reminderTime > new Date()) {
        notifications.push({
          id: notificationId++,
          title: `Rappel PrEPy (${reminderCount + 1})`,
          body: "N'oubliez pas votre comprimé !",
          schedule: { at: reminderTime },
        });
        reminderCount++;
      }
    }

    // Final "missed" reminder
    if (reminderWindowEnd > new Date()) {
        notifications.push({
            id: 99,
            title: "Prise manquée !",
            body: "Vous avez dépassé le délai pour votre prise. La protection est rompue.",
            schedule: { at: reminderWindowEnd },
        });
    }
    
    if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
    }
};

export const cancelAllNotifications = async () => {
    if (!Capacitor.isNativePlatform()) return;
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
        await LocalNotifications.cancel(pending);
    }
};
