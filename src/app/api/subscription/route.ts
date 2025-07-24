
import { NextResponse } from 'next/server';

// This endpoint is no longer used for FCM and can be left empty or removed.
// For safety, we'll just make it return an error so it's not used accidentally.
export async function POST(request: Request) {
  return NextResponse.json({ error: 'This endpoint is deprecated.' }, { status: 410 });
}

export async function DELETE(request: Request) {
  return NextResponse.json({ error: 'This endpoint is deprecated.' }, { status: 410 });
}
