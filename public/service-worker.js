
"use strict";

self.addEventListener('install', event => {
  console.log('Service Worker installing.');
  // Perform install steps
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating.');
  // Perform activation steps
});

self.addEventListener('fetch', event => {
  // console.log('Fetching:', event.request.url);
  // Respond with cached resources or fetch from network
});

self.addEventListener('push', event => {
  console.log('[Service Worker] Push Received.');
  if (!event.data) {
    console.error('[Service Worker] Push event but no data');
    return;
  }
  
  try {
    const data = event.data.json();
    const title = data.title || 'PrEPy';
    const options = {
      body: data.body || 'Notification de PrEPy',
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/badge.svg', // Monochrome icon for status bar
      vibrate: [200, 100, 200],
      tag: 'prepy-notification',
      renotify: true,
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
     console.error('[Service Worker] Error parsing push data:', e);
     // Fallback for simple text pushes
     const title = 'PrEPy';
     const options = {
        body: event.data.text(),
        icon: '/icon-192x192.png',
        badge: '/badge.svg',
      };
      event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click Received.');
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
