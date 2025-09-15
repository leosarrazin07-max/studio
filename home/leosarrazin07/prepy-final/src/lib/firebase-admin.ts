
import * as admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) {
    console.error("Firebase Admin SDK initialization error:", error);
  }
} else {
    console.log("Firebase Admin SDK already initialized.");
}


const firestore = admin.firestore();
const auth = admin.auth();

export { admin, firestore, auth };
