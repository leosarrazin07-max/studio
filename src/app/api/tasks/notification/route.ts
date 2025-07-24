
import { NextResponse } from 'next/server';

// This endpoint is no longer used as there is no server-side notification logic.
// For safety, we'll just make it return an error so it's not used accidentally.
export async function POST(request: Request) {
  return NextResponse.json({ error: 'This endpoint is deprecated.' }, { status: 410 });
}
