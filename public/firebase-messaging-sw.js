"use client";
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging/sw";
import { getManifest } from "@ducanh2912/next-pwa/build/lib/get-manifest";

// This is required to make the service worker variables available
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};


if (typeof self !== "undefined") {
    const manifest = getManifest(self);
    self.addEventListener("push", (event) => {
      console.log('SW Push event', event);
      if (event.data) {
        const data = event.data.json();
        console.log('SW Push data', data);
        if (data.notification) {
          event.waitUntil(
            self.registration.showNotification(data.notification.title, {
              body: data.notification.body,
              icon: manifest?.icons[0].src || "/icon.svg",
            })
          );
        }
      }
    });

    try {
        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);
        // Additional SW logic can be placed here.
    } catch(e) {
        console.error('Service Worker initialization error', e);
    }
}
