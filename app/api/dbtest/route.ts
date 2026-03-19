import { NextResponse } from 'next/server';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || 'NOT SET';
  const masked = dbUrl.replace(/:([^@]+)@/, ':****@');

  // Test 1: Can we even import Prisma?
  let prismaImport = 'unknown';
  let prismaError = '';

  // Test 2: Can we connect to DB?
  let dbStatus = 'unknown';
  let dbError = '';

  try {
    const { PrismaClient } = await import('@prisma/client');
    prismaImport = 'success';

    const prisma = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL },
      },
    });

    try {
      await prisma.$queryRaw`SELECT 1 as test`;
      dbStatus = 'connected';
    } catch (err: any) {
      dbStatus = 'failed';
      dbError = err.message?.substring(0, 500) || 'unknown';
    } finally {
      await prisma.$disconnect();
    }
  } catch (err: any) {
    prismaImport = 'failed';
    prismaError = err.message?.substring(0, 500) || 'unknown';
  }

  return NextResponse.json({
    status: 'ok',
    time: new Date().toISOString(),
    database_url: masked,
    prisma_import: prismaImport,
    prisma_import_error: prismaError || undefined,
    db_connection: dbStatus,
    db_error: dbError || undefined,
  });
}
