
'use strict';

const VAPID_PUBLIC_KEY = self.location.search.split('vapidPublicKey=')[1];

self.addEventListener('push', function (event) {
    const data = event.data.json();
    const title = data.title || 'PrEPy';
    const options = {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

const CHECK_INTERVAL = 60 * 1000; // Check every minute

function checkStateAndNotify() {
    const stateStr = localStorage.getItem('prepState');
    if (!stateStr) return;

    try {
        const state = JSON.parse(stateStr);
        if (!state.sessionActive || !state.pushEnabled) return;

        const now = new Date();
        const firstDose = state.doses.find(d => d.type === 'start');
        if (!firstDose) return;
        const firstDoseTime = new Date(firstDose.time);

        // --- 1. Protection Active Notification ---
        const protectionStartTime = new Date(firstDoseTime.getTime() + 2 * 60 * 60 * 1000); // PROTECTION_START_HOURS
        if (!state.protectionNotified && now >= protectionStartTime) {
            self.registration.showNotification('PrEPy', {
                body: 'Votre protection PrEP est maintenant active !',
                icon: '/icon-192x192.png',
                badge: '/badge-72x72.png',
            });
            state.protectionNotified = true;
            localStorage.setItem('prepState', JSON.stringify(state));
        }

        // --- 2. Dose Reminder Notifications ---
        const lastDose = state.doses
            .filter(d => d.type !== 'stop')
            .sort((a, b) => new Date(b.time) - new Date(a.time))[0];
        
        if (!lastDose) return;

        const lastDoseTime = new Date(lastDose.time);
        const reminderWindowStart = new Date(lastDoseTime.getTime() + 22 * 60 * 60 * 1000); // DOSE_REMINDER_WINDOW_START_HOURS
        const reminderWindowEnd = new Date(lastDoseTime.getTime() + 26 * 60 * 60 * 1000); // DOSE_REMINDER_WINDOW_END_HOURS
        
        if (now >= reminderWindowStart && now <= reminderWindowEnd) {
             // To avoid spamming, let's check if we've already sent a reminder recently.
             const lastNotificationTime = state.lastReminderSent ? new Date(state.lastReminderSent) : null;
             const tenMinutes = 10 * 60 * 1000;
             if (!lastNotificationTime || (now.getTime() - lastNotificationTime.getTime() > tenMinutes)) {
                 self.registration.showNotification('PrEPy Rappel', {
                    body: 'Il est temps de prendre votre dose de PrEP.',
                    icon: '/icon-192x192.png',
                    badge: '/badge-72x72.png',
                    renotify: true, // Vibrate on each new notification
                    tag: 'dose-reminder' // Replace any existing notification with the same tag
                 });
                 state.lastReminderSent = now.toISOString();
                 localStorage.setItem('prepState', JSON.stringify(state));
             }
        }

    } catch (e) {
        console.error('Service Worker: Error processing state', e);
    }
}

setInterval(checkStateAndNotify, CHECK_INTERVAL);
