
// This endpoint is no longer needed in the local-first architecture.
// It is kept empty to avoid breaking any old references during transition, but it can be deleted.
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({ success: true, message: 'This endpoint is deprecated.' });
}

export async function DELETE(request: Request) {
  return NextResponse.json({ success: true, message: 'This endpoint is deprecated.' });
}
