import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Delete all data in correct order (respecting foreign keys)
    await prisma.submissionAnswer.deleteMany();
    await prisma.submissionFile.deleteMany();
    await prisma.submissionLocation.deleteMany();
    await prisma.submission.deleteMany();
    await prisma.formFieldOption.deleteMany();
    await prisma.formLogicRule.deleteMany();
    await prisma.formField.deleteMany();
    await prisma.formSection.deleteMany();
    await prisma.formTemplateVersion.deleteMany();
    await prisma.formTemplate.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.userProjectAccess.deleteMany();
    await prisma.project.deleteMany();
    await prisma.setting.deleteMany();
    await prisma.user.deleteMany();

    // Create only one super admin account
    const password = await hash('admin123', 12);
    await prisma.user.create({
      data: {
        email: 'admin@waves-pm.com',
        name: 'مدير النظام',
        password,
        role: 'SUPER_ADMIN',
        phone: '',
      },
    });

    // Create default settings
    await prisma.setting.create({
      data: {
        key: 'company',
        value: {
          name: 'منصة ويفز للتقارير',
          nameEn: 'Waves Reporting Platform',
          primaryColor: '#2573eb',
        },
      },
    });

    return NextResponse.json({
      message: 'تم مسح جميع البيانات الوهمية وإعادة تهيئة النظام',
      status: 'success',
      account: {
        email: 'admin@waves-pm.com',
        password: 'admin123',
        role: 'مدير النظام (SUPER_ADMIN)',
      },
    });
  } catch (error: any) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ' }, { status: 500 });
  }
}
