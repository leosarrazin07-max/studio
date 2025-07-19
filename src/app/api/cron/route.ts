
import { NextResponse } from 'next/server';

// This function is now just a proxy to the real cron job function.
// This architecture ensures that server-side packages like 'firebase-admin'
// are not bundled with the Next.js client application, fixing build errors.

// IMPORTANT: After deploying this change, you must also deploy the Cloud Function
// located in the `functions` directory by running `firebase deploy --only functions`.

export async function GET(request: Request) {
  // The OIDC authentication is automatically verified by App Hosting.
  // We can add our own secret to ensure only our app can call this.
  const cronSecret = request.headers.get('X-Cron-Secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // This is the URL of the deployed Cloud Function.
  // Format: https://<region>-<project-id>.cloudfunctions.net/<function-name>
  const functionUrl = `https://us-central1-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/cronJob`;

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        // We add a secret header to secure the call between Next.js and the function.
        'X-Cron-Secret': process.env.CRON_SECRET!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: "Cron call from Next.js" })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Cron job function failed');
    }

    return NextResponse.json({ success: true, ...data });

  } catch (error: any) {
    console.error('Failed to invoke cron job function:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to invoke cron job function', details: error.message },
      { status: 500 }
    );
  }
}
