
// This is a placeholder service worker file.
// It's the foundation for handling background tasks like push notifications.

// The 'install' event is fired when the service worker is first installed.
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  // Pre-caching assets can be done here.
});

// The 'activate' event is fired when the service worker becomes active.
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Active');
  // Clean up old caches here.
});

// The 'push' event is where we'll handle incoming push notifications.
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received.');
  // For now, we'll just log it. In the next step, we'll show a notification.
  const data = event.data ? event.data.json() : { title: 'Default Title', body: 'Default body.' };
  
  const title = data.title;
  const options = {
    body: data.body,
    icon: '/icon-192x192.png' // Example icon
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// The 'notificationclick' event is fired when a user clicks on a notification.
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked.');
  event.notification.close();
  // Add logic here to open the app or a specific URL.
});
