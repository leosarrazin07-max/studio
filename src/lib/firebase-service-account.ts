
// This file is sensitive and should not be exposed to the client.
// It's used by firebase-admin on the server side.
// For Firebase App Hosting, environment variables are the recommended way to store secrets.
// We will retrieve the service account details from environment variables.

export const getServiceAccount = () => {
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_PRIVATE_KEY ||
    !process.env.FIREBASE_CLIENT_EMAIL
  ) {
    // These variables are automatically provided by the App Hosting environment.
    // If they are missing, it means we are likely in a local development environment
    // without a .env.local file or the app is not deployed correctly.
    console.warn("Firebase Admin credentials not found in environment variables. Using default credentials.");
    return undefined; // Allows firebase-admin to use Application Default Credentials
  }

  return {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };
};
