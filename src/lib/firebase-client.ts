
import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getMessaging } from "firebase/messaging";
import { getFirestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = (typeof window !== 'undefined' && firebaseConfig.projectId) ? getFirestore(app) : undefined;
const messaging = (typeof window !== 'undefined' && firebaseConfig.projectId) ? getMessaging(app) : undefined;


export { app, db, messaging };
