/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  if (!event.data) {
    console.log('[Service Worker] Push event but no data');
    return;
  }
  
  const data = event.data.json();
  const title = data.title || 'PrEPy';
  const options = {
    body: data.body || 'Notification body',
    icon: data.icon || '/pill.png', // Default icon
    badge: '/badge.png', // Badge for the notification bar
    tag: data.tag || 'prepy-notification',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

self.addEventListener('install', (event) => {
    console.log('[Service Worker] Install');
    // event.waitUntil(self.skipWaiting()); // Activate worker immediately
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activate');
    // event.waitUntil(clients.claim()); // Become available to all pages
});
