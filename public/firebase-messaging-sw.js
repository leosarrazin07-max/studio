
// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
// TODO: Replace with your project's messaging sender ID
firebase.initializeApp({
    apiKey: "__NEXT_PUBLIC_FIREBASE_API_KEY__",
    authDomain: "__NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN__",
    projectId: "__NEXT_PUBLIC_FIREBASE_PROJECT_ID__",
    storageBucket: "__NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET__",
    messagingSenderId: "__NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID__",
    appId: "__NEXT_PUBLIC_FIREBASE_APP_ID__",
});


// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});

    