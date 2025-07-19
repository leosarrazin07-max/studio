
import admin from 'firebase-admin';

// This helper function ensures that we don't try to initialize the app more than once.
export const initializeAdminApp = () => {
    if (admin.apps.length === 0) {
        admin.initializeApp();
    }
    return admin;
};
