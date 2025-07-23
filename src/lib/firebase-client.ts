
import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getRemoteConfig, fetchAndActivate, getString } from "firebase/remote-config";

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
const remoteConfig = getRemoteConfig(app);

// It's safe to do this on module load, as it's client-side.
if (typeof window !== 'undefined') {
    remoteConfig.settings.minimumFetchIntervalMillis = 3600000; // 1 hour
    remoteConfig.defaultConfig = {
        "vapid_public_key": ""
    };
    fetchAndActivate(remoteConfig).catch((err) => console.error("Remote Config fetch failed", err));
}


export async function getVapidKey(): Promise<string> {
    await fetchAndActivate(remoteConfig);
    return getString(remoteConfig, "vapid_public_key");
}


export { app };

    