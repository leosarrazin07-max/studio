
import { NextResponse } from 'next/server';

// This endpoint is no longer used for scheduling and has been replaced by the event-driven
// /api/tasks/schedule-notifications endpoint. This file is kept to avoid breaking
// any potential old configurations but it now does nothing.
export async function POST(request: Request) {
  try {
    console.log('onDoseLogged endpoint was called, but is now deprecated. Please use Firestore triggers with /api/tasks/schedule-notifications.');
    return NextResponse.json({ success: true, message: 'Endpoint deprecated. No action taken.' });
  } catch (error) {
    console.error('Error in deprecated onDoseLogged function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Internal Server Error', details: errorMessage }, { status: 500 });
  }
}
