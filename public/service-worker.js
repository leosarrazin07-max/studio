
self.addEventListener('push', event => {
  try {
    const data = event.data.json();
    const title = data.title || 'PrEPy';
    const options = {
      body: data.body || 'Notification',
      icon: data.icon || '/icon-192x192.png',
      badge: '/badge-72x72.png',
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    // Fallback for when payload is not JSON
    const title = 'PrEPy';
    const options = {
        body: event.data.text(),
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});

// This is not used in the current setup but is good practice to include.
// It ensures that the new service worker activates as soon as it's installed.
self.addEventListener('install', (event) => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});
