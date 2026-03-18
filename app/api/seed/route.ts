import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

export async function GET() {
  try {
    // Check if already seeded
    const existingUser = await prisma.user.findUnique({
      where: { email: 'superadmin@example.com' },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'تم تهيئة البيانات مسبقاً', status: 'already_seeded' });
    }

    const password = await hash('password123', 12);

    // Create users
    const superAdmin = await prisma.user.create({
      data: { email: 'superadmin@example.com', name: 'محمد المدير العام', password, role: 'SUPER_ADMIN', phone: '+966501234567' },
    });

    await prisma.user.create({
      data: { email: 'admin@example.com', name: 'أحمد المدير', password, role: 'ADMIN', phone: '+966502345678' },
    });

    await prisma.user.create({
      data: { email: 'pm@example.com', name: 'سارة مديرة المشاريع', password, role: 'PROJECT_MANAGER', phone: '+966503456789' },
    });

    await prisma.user.create({
      data: { email: 'supervisor@example.com', name: 'خالد المشرف الميداني', password, role: 'FIELD_SUPERVISOR', phone: '+966504567890' },
    });

    await prisma.user.create({
      data: { email: 'viewer@example.com', name: 'نورة العميلة', password, role: 'VIEWER', phone: '+966505678901' },
    });

    // Create demo project
    const project = await prisma.project.create({
      data: {
        name: 'معرض الرياض الدولي للكتاب',
        clientName: 'هيئة الأدب والنشر والترجمة',
        projectCode: 'WV-DEMO01',
        city: 'الرياض',
        location: 'واجهة الرياض',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-03-15'),
        status: 'ACTIVE',
        description: 'مشروع تجهيز وتنفيذ معرض الرياض الدولي للكتاب',
        createdById: superAdmin.id,
      },
    });

    // Create 3 default form templates
    const installForm = await prisma.formTemplate.create({
      data: { projectId: project.id, name: 'تقرير تنفيذ التركيب', nameEn: 'Installation Execution Report', type: 'installation', status: 'PUBLISHED', isDefault: true, sortOrder: 1 },
    });

    const activationForm = await prisma.formTemplate.create({
      data: { projectId: project.id, name: 'تقرير التفعيل الميداني', nameEn: 'Field Activation Report', type: 'activation', status: 'PUBLISHED', isDefault: true, sortOrder: 2 },
    });

    const dismantlingForm = await prisma.formTemplate.create({
      data: { projectId: project.id, name: 'تقرير إزالة وفك التركيب', nameEn: 'Dismantling / Removal Report', type: 'dismantling', status: 'PUBLISHED', isDefault: true, sortOrder: 3 },
    });

    // Installation form sections & fields
    const instS1 = await prisma.formSection.create({ data: { formTemplateId: installForm.id, title: 'المعلومات العامة', titleEn: 'General Information', sortOrder: 1 } });
    await prisma.formField.createMany({ data: [
      { sectionId: instS1.id, label: 'اسم المشروع', labelEn: 'Project Name', fieldType: 'SHORT_TEXT', isRequired: true, sortOrder: 1 },
      { sectionId: instS1.id, label: 'اسم العميل', labelEn: 'Client Name', fieldType: 'SHORT_TEXT', isRequired: true, sortOrder: 2 },
      { sectionId: instS1.id, label: 'اسم الفعالية', labelEn: 'Event Name', fieldType: 'SHORT_TEXT', isRequired: true, sortOrder: 3 },
      { sectionId: instS1.id, label: 'التاريخ', labelEn: 'Date', fieldType: 'DATE', isRequired: true, sortOrder: 4 },
      { sectionId: instS1.id, label: 'وقت البداية', labelEn: 'Start Time', fieldType: 'TIME', isRequired: true, sortOrder: 5 },
      { sectionId: instS1.id, label: 'وقت النهاية', labelEn: 'End Time', fieldType: 'TIME', isRequired: false, sortOrder: 6 },
      { sectionId: instS1.id, label: 'الموقع', labelEn: 'Location', fieldType: 'SHORT_TEXT', isRequired: true, sortOrder: 7 },
      { sectionId: instS1.id, label: 'مدير المشروع', labelEn: 'Project Manager', fieldType: 'SHORT_TEXT', isRequired: false, sortOrder: 8 },
      { sectionId: instS1.id, label: 'المشرف الميداني', labelEn: 'Field Supervisor', fieldType: 'SHORT_TEXT', isRequired: false, sortOrder: 9 },
      { sectionId: instS1.id, label: 'المقاول / المورد', labelEn: 'Contractor', fieldType: 'SHORT_TEXT', isRequired: false, sortOrder: 10 },
      { sectionId: instS1.id, label: 'نوع التركيب', labelEn: 'Installation Type', fieldType: 'SHORT_TEXT', isRequired: false, sortOrder: 11 },
      { sectionId: instS1.id, label: 'عدد فريق العمل', labelEn: 'Team Count', fieldType: 'NUMBER', isRequired: false, sortOrder: 12 },
    ]});

    const instS2 = await prisma.formSection.create({ data: { formTemplateId: installForm.id, title: 'التوثيق', titleEn: 'Documentation', sortOrder: 2 } });
    await prisma.formField.createMany({ data: [
      { sectionId: instS2.id, label: 'قبل التركيب', labelEn: 'Before Installation', fieldType: 'LONG_TEXT', isRequired: false, sortOrder: 1 },
      { sectionId: instS2.id, label: 'صور قبل التركيب', labelEn: 'Photos Before', fieldType: 'MULTIPLE_IMAGES', isRequired: false, sortOrder: 2 },
      { sectionId: instS2.id, label: 'أثناء التركيب', labelEn: 'During Installation', fieldType: 'LONG_TEXT', isRequired: false, sortOrder: 3 },
      { sectionId: instS2.id, label: 'صور أثناء التركيب', labelEn: 'Photos During', fieldType: 'MULTIPLE_IMAGES', isRequired: false, sortOrder: 4 },
      { sectionId: instS2.id, label: 'بعد التركيب', labelEn: 'After Installation', fieldType: 'LONG_TEXT', isRequired: false, sortOrder: 5 },
      { sectionId: instS2.id, label: 'صور بعد التركيب', labelEn: 'Photos After', fieldType: 'MULTIPLE_IMAGES', isRequired: false, sortOrder: 6 },
    ]});

    const instS3 = await prisma.formSection.create({ data: { formTemplateId: installForm.id, title: 'قائمة التحقق', titleEn: 'Checklist', sortOrder: 3 } });
    const checklist = ['بدأ التركيب في الوقت المحدد','اكتمل التركيب في الوقت المحدد','تم الحصول على التصريح','ارتدى الفريق معدات السلامة','وصلت المواد بحالة جيدة','تم تجهيز الموقع','التركيب مطابق للتصميم المعتمد','تم وضع العلامات التجارية بشكل صحيح','تم فحص التوصيلات الكهربائية','تم السيطرة على مخاطر السلامة','تم تنظيف الموقع بعد التركيب','لم يحدث ضرر في الموقع','تم التسليم'];
    await prisma.formField.createMany({ data: checklist.map((item, i) => ({ sectionId: instS3.id, label: item, fieldType: 'YES_NO' as const, isRequired: false, sortOrder: i + 1 })) });

    const instS4 = await prisma.formSection.create({ data: { formTemplateId: installForm.id, title: 'ملاحظات المشرف', titleEn: 'Supervisor Notes', sortOrder: 4 } });
    await prisma.formField.createMany({ data: [
      { sectionId: instS4.id, label: 'ملاحظات المشرف', labelEn: 'Supervisor Notes', fieldType: 'LONG_TEXT', isRequired: false, sortOrder: 1 },
      { sectionId: instS4.id, label: 'التوقيع', labelEn: 'Signature', fieldType: 'SIGNATURE', isRequired: false, sortOrder: 2 },
      { sectionId: instS4.id, label: 'الموقع الجغرافي', labelEn: 'GPS Location', fieldType: 'GPS_LOCATION', isRequired: false, sortOrder: 3 },
    ]});

    // Settings
    await prisma.setting.create({
      data: { key: 'company', value: { name: 'منصة ويفز للتقارير', nameEn: 'Waves Reporting Platform', primaryColor: '#2573eb' } },
    });

    return NextResponse.json({
      message: 'تم تهيئة البيانات بنجاح!',
      status: 'success',
      accounts: [
        { role: 'مدير النظام', email: 'superadmin@example.com', password: 'password123' },
        { role: 'مدير', email: 'admin@example.com', password: 'password123' },
        { role: 'مدير مشروع', email: 'pm@example.com', password: 'password123' },
        { role: 'مشرف ميداني', email: 'supervisor@example.com', password: 'password123' },
        { role: 'مشاهد', email: 'viewer@example.com', password: 'password123' },
      ],
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ أثناء تهيئة البيانات' }, { status: 500 });
  }
}
