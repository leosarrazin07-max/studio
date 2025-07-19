// This file is no longer used and will be removed in a future deployment.
// The cron job now calls the Cloud Function directly.
// To avoid deployment errors with an empty file, we leave this content.
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: "This endpoint is deprecated. The cron job calls the Cloud Function directly." }, { status: 410 });
}

export async function POST() {
    return NextResponse.json({ message: "This endpoint is deprecated. The cron job calls the Cloud Function directly." }, { status: 410 });
}
