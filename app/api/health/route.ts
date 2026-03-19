import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || 'NOT SET';
  const masked = dbUrl.replace(/:([^@]+)@/, ':****@');

  let dbStatus = 'unknown';
  let dbError = '';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err: any) {
    dbStatus = 'failed';
    dbError = err.message?.substring(0, 300) || 'unknown error';
  }

  return NextResponse.json({
    status: 'ok',
    time: new Date().toISOString(),
    database: {
      url: masked,
      status: dbStatus,
      error: dbError || undefined,
    },
    env: {
      NODE_ENV: process.env.NODE_ENV || 'NOT SET',
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
    },
  });
}
