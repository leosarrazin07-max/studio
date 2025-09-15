
// This file is renamed to schedule-notifications. No longer used.
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  return NextResponse.json({ message: 'This endpoint is deprecated. Use /api/tasks/schedule-notifications.' }, { status: 404 });
}
