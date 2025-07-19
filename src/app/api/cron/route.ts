
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const cronSecret = request.headers.get('x-cron-secret');
  if (cronSecret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  // This is the URL of the deployed Cloud Function.
  // Using the correct region 'europe-west9' and function name 'cronJob'.
  const functionUrl = `https://europe-west9-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/cronJob`;

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'X-Cron-Secret': process.env.CRON_SECRET!,
        'Content-Type': 'application/json'
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Cron job function returned an error:', data);
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
