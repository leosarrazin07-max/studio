
import { NextResponse } from 'next/server';
import { handleCron } from '@/lib/cron-handler';

// This route is protected by OIDC authentication configured in Cloud Scheduler.
// App Hosting automatically verifies the token.

export const dynamic = 'force-dynamic'; // Ensures the route is not statically cached

export async function GET(request: Request) {
  try {
    const { notificationsSent, errorsEncountered } = await handleCron();
    return NextResponse.json({
      success: true,
      message: `Cron job finished. Sent ${notificationsSent} notifications. Encountered ${errorsEncountered} errors.`,
    });
  } catch (error: any) {
    console.error('Cron job failed catastrophically:', error);
    // Log the error stack for better debugging
    if (error.stack) {
      console.error(error.stack);
    }
    return NextResponse.json(
      { success: false, error: 'Cron job failed', details: error.message },
      { status: 500 }
    );
  }
}
