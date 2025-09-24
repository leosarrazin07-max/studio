// This endpoint is no longer needed in the local-first architecture.
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({ message: 'This endpoint is deprecated.' }, { status: 404 });
}
