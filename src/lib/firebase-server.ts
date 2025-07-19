
import admin from 'firebase-admin';

// This helper function ensures that we don't try to initialize the app more than once.
export const initializeServerApp = () => {
    if (admin.apps.length > 0) {
        return {
            db: admin.app()
        };
    }

    const app = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
    
    return {
        db: app
    };
};
