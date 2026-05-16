import { NextResponse } from 'next/server';
import { getEnvHealth } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const health = getEnvHealth();
  const ok =
    health.hasMongoUri && health.hasNextAuthSecret && health.hasNextAuthUrl;

  return NextResponse.json(
    {
      ok,
      message: ok
        ? 'Environment looks configured'
        : 'Missing required environment variables on this deployment',
      ...health,
    },
    { status: ok ? 200 : 503 }
  );
}
