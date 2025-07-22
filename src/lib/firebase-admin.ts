
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const firestore = admin.firestore();
const auth = admin.auth();

export { admin, firestore, auth };
