import { NextResponse } from 'next/server';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || 'NOT SET';
  const masked = dbUrl.replace(/:([^@]+)@/, ':****@');

  return NextResponse.json({
    status: 'ok',
    time: new Date().toISOString(),
    database_url: masked,
    env: {
      NODE_ENV: process.env.NODE_ENV || 'NOT SET',
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    },
  });
}
