
// This is a basic service worker.
// It's currently only used for enabling Push Notifications.

self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'PrEPy';
  const options = {
    body: data.body || 'Notification de PrEPy',
    icon: data.icon || '/icon-192x192.png',
    badge: '/badge-72x72.png',
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
