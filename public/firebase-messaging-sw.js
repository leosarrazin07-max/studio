
// This service worker is required for Firebase Cloud Messaging (FCM) to work.
// It must be in the public directory.

// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDQhG9yV5U8iP9jK2m3n4o5p6q7r8s9t0u",
  authDomain: "prepy-app.firebaseapp.com",
  projectId: "prepy-app",
  storageBucket: "prepy-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:a1b2c3d4e5f6g7h8i9j0k1"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Optional: background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png' // Make sure you have an icon file here
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
