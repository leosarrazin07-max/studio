
import { NextResponse } from 'next/server';

// This endpoint is no longer used directly by the client.
// The logic is now handled by a scheduled Cloud Function.
export async function POST(request: Request) {
  return NextResponse.json({ message: 'This endpoint is not used for client-side scheduling.' }, { status: 404 });
}
