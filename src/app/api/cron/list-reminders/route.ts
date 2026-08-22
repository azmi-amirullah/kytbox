import { NextRequest, NextResponse } from 'next/server';
import { processTaskDueReminders } from '@/features/list/actions';
import { env } from '@/env';

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  // Enforce CRON_SECRET authorization header if configured
  if (env.CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${env.CRON_SECRET}`;
    if (authHeader !== expectedAuth) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing bearer token' },
        { status: 401 }
      );
    }
  }

  try {
    const result = await processTaskDueReminders();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error during reminder processing';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
