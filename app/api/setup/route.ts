import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Step 1: Push schema to database (create tables)
    console.log('Step 1: Creating database tables...');
    try {
      const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss', {
        cwd: process.cwd(),
        timeout: 60000,
        env: { ...process.env },
      });
      console.log('Prisma push stdout:', stdout);
      if (stderr) console.log('Prisma push stderr:', stderr);
    } catch (pushError: any) {
      console.error('Prisma push error:', pushError.message);
      return NextResponse.json({
        status: 'error',
        step: 'db_push',
        message: 'فشل في إنشاء الجداول',
        error: pushError.message,
        stderr: pushError.stderr,
      }, { status: 500 });
    }

    // Step 2: Seed data
    console.log('Step 2: Seeding data...');
    try {
      const seedUrl = new URL('/api/seed', process.env.NEXTAUTH_URL || 'http://localhost:3000');
      const seedRes = await fetch(seedUrl.toString());
      const seedData = await seedRes.json();
      
      return NextResponse.json({
        status: 'success',
        message: 'تم إعداد قاعدة البيانات بنجاح!',
        tables: 'تم إنشاء جميع الجداول',
        seed: seedData,
      });
    } catch (seedError: any) {
      return NextResponse.json({
        status: 'partial',
        message: 'تم إنشاء الجداول بنجاح لكن فشل تعبئة البيانات',
        error: seedError.message,
        hint: 'جرب فتح /api/seed مباشرة',
      });
    }

  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'حدث خطأ أثناء الإعداد',
      error: error.message,
    }, { status: 500 });
  }
}
