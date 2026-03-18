import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌊 بدء تهيئة قاعدة البيانات...');

  // Create demo users
  const password = await hash('password123', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {},
    create: {
      email: 'superadmin@example.com',
      name: 'محمد المدير العام',
      password,
      role: 'SUPER_ADMIN',
      phone: '+966501234567',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'أحمد المدير',
      password,
      role: 'ADMIN',
      phone: '+966502345678',
    },
  });

  const pm = await prisma.user.upsert({
    where: { email: 'pm@example.com' },
    update: {},
    create: {
      email: 'pm@example.com',
      name: 'سارة مديرة المشاريع',
      password,
      role: 'PROJECT_MANAGER',
      phone: '+966503456789',
    },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@example.com' },
    update: {},
    create: {
      email: 'supervisor@example.com',
      name: 'خالد المشرف الميداني',
      password,
      role: 'FIELD_SUPERVISOR',
      phone: '+966504567890',
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@example.com' },
    update: {},
    create: {
      email: 'viewer@example.com',
      name: 'نورة العميلة',
      password,
      role: 'VIEWER',
      phone: '+966505678901',
    },
  });

  console.log('✅ تم إنشاء المستخدمين');

  // Create demo project
  const project = await prisma.project.upsert({
    where: { projectCode: 'WV-DEMO01' },
    update: {},
    create: {
      name: 'معرض الرياض الدولي للكتاب',
      clientName: 'هيئة الأدب والنشر والترجمة',
      projectCode: 'WV-DEMO01',
      city: 'الرياض',
      location: 'واجهة الرياض',
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-03-15'),
      status: 'ACTIVE',
      description: 'مشروع تجهيز وتنفيذ معرض الرياض الدولي للكتاب - يشمل التركيب والتفعيل والإزالة',
      notes: 'مشروع تجريبي للعرض',
      createdById: superAdmin.id,
    },
  });

  // Add team members
  await prisma.userProjectAccess.createMany({
    data: [
      { userId: superAdmin.id, projectId: project.id, role: 'SUPER_ADMIN' },
      { userId: admin.id, projectId: project.id, role: 'ADMIN' },
      { userId: pm.id, projectId: project.id, role: 'PROJECT_MANAGER' },
      { userId: supervisor.id, projectId: project.id, role: 'FIELD_SUPERVISOR' },
      { userId: viewer.id, projectId: project.id, role: 'VIEWER' },
    ],
    skipDuplicates: true,
  });

  console.log('✅ تم إنشاء المشروع التجريبي');

  // Create default form templates
  const installationForm = await prisma.formTemplate.create({
    data: {
      projectId: project.id,
      name: 'تقرير تنفيذ التركيب',
      nameEn: 'Installation Execution Report',
      type: 'installation',
      status: 'PUBLISHED',
      isDefault: true,
      sortOrder: 1,
    },
  });

  const activationForm = await prisma.formTemplate.create({
    data: {
      projectId: project.id,
      name: 'تقرير التفعيل الميداني',
      nameEn: 'Field Activation Report',
      type: 'activation',
      status: 'PUBLISHED',
      isDefault: true,
      sortOrder: 2,
    },
  });

  const dismantlingForm = await prisma.formTemplate.create({
    data: {
      projectId: project.id,
      name: 'تقرير إزالة وفك التركيب',
      nameEn: 'Dismantling / Removal Report',
      type: 'dismantling',
      status: 'PUBLISHED',
      isDefault: true,
      sortOrder: 3,
    },
  });

  // Create sections and fields for Installation form
  const instSection1 = await prisma.formSection.create({
    data: { formTemplateId: installationForm.id, title: 'المعلومات العامة', titleEn: 'General Information', sortOrder: 1 },
  });
  await prisma.formField.createMany({
    data: [
      { sectionId: instSection1.id, label: 'اسم المشروع', labelEn: 'Project Name', fieldType: 'SHORT_TEXT', isRequired: true, sortOrder: 1 },
      { sectionId: instSection1.id, label: 'اسم العميل', labelEn: 'Client Name', fieldType: 'SHORT_TEXT', isRequired: true, sortOrder: 2 },
      { sectionId: instSection1.id, label: 'اسم الفعالية / النشاط', labelEn: 'Event / Activity Name', fieldType: 'SHORT_TEXT', isRequired: true, sortOrder: 3 },
      { sectionId: instSection1.id, label: 'التاريخ', labelEn: 'Date', fieldType: 'DATE', isRequired: true, sortOrder: 4 },
      { sectionId: instSection1.id, label: 'وقت البداية', labelEn: 'Start Time', fieldType: 'TIME', isRequired: true, sortOrder: 5 },
      { sectionId: instSection1.id, label: 'وقت النهاية', labelEn: 'End Time', fieldType: 'TIME', isRequired: false, sortOrder: 6 },
      { sectionId: instSection1.id, label: 'الموقع', labelEn: 'Location', fieldType: 'SHORT_TEXT', isRequired: true, sortOrder: 7 },
      { sectionId: instSection1.id, label: 'مدير المشروع', labelEn: 'Project Manager', fieldType: 'SHORT_TEXT', isRequired: false, sortOrder: 8 },
      { sectionId: instSection1.id, label: 'المشرف الميداني', labelEn: 'Field Supervisor', fieldType: 'SHORT_TEXT', isRequired: false, sortOrder: 9 },
      { sectionId: instSection1.id, label: 'المقاول / المورد', labelEn: 'Contractor / Vendor', fieldType: 'SHORT_TEXT', isRequired: false, sortOrder: 10 },
      { sectionId: instSection1.id, label: 'نوع التركيب', labelEn: 'Type of Installation', fieldType: 'SHORT_TEXT', isRequired: false, sortOrder: 11 },
      { sectionId: instSection1.id, label: 'حالة التصريح', labelEn: 'Permit Status', fieldType: 'DROPDOWN', isRequired: false, sortOrder: 12 },
      { sectionId: instSection1.id, label: 'عدد فريق العمل', labelEn: 'Team Count', fieldType: 'NUMBER', isRequired: false, sortOrder: 13 },
      { sectionId: instSection1.id, label: 'الطقس / حالة الموقع', labelEn: 'Weather / Site Conditions', fieldType: 'SHORT_TEXT', isRequired: false, sortOrder: 14 },
    ],
  });

  const instSection2 = await prisma.formSection.create({
    data: { formTemplateId: installationForm.id, title: 'التوثيق', titleEn: 'Documentation', sortOrder: 2 },
  });
  await prisma.formField.createMany({
    data: [
      { sectionId: instSection2.id, label: 'قبل التركيب', labelEn: 'Before Installation', fieldType: 'LONG_TEXT', isRequired: false, sortOrder: 1 },
      { sectionId: instSection2.id, label: 'صور قبل التركيب', labelEn: 'Photos Before', fieldType: 'MULTIPLE_IMAGES', isRequired: false, sortOrder: 2 },
      { sectionId: instSection2.id, label: 'أثناء التركيب', labelEn: 'During Installation', fieldType: 'LONG_TEXT', isRequired: false, sortOrder: 3 },
      { sectionId: instSection2.id, label: 'صور أثناء التركيب', labelEn: 'Photos During', fieldType: 'MULTIPLE_IMAGES', isRequired: false, sortOrder: 4 },
      { sectionId: instSection2.id, label: 'بعد التركيب', labelEn: 'After Installation', fieldType: 'LONG_TEXT', isRequired: false, sortOrder: 5 },
      { sectionId: instSection2.id, label: 'صور بعد التركيب', labelEn: 'Photos After', fieldType: 'MULTIPLE_IMAGES', isRequired: false, sortOrder: 6 },
    ],
  });

  const instSection3 = await prisma.formSection.create({
    data: { formTemplateId: installationForm.id, title: 'قائمة التحقق', titleEn: 'Checklist', sortOrder: 3 },
  });
  const installChecklist = [
    'بدأ التركيب في الوقت المحدد', 'اكتمل التركيب في الوقت المحدد', 'تم الحصول على التصريح',
    'ارتدى الفريق معدات السلامة', 'وصلت المواد بحالة جيدة', 'تم تجهيز الموقع',
    'التركيب مطابق للتصميم المعتمد', 'تم وضع العلامات التجارية بشكل صحيح',
    'تم فحص التوصيلات الكهربائية', 'تم السيطرة على مخاطر السلامة',
    'تم تنظيف الموقع بعد التركيب', 'لم يحدث ضرر في الموقع', 'تم التسليم',
  ];
  await prisma.formField.createMany({
    data: installChecklist.map((item, i) => ({
      sectionId: instSection3.id, label: item, fieldType: 'YES_NO' as const, isRequired: false, sortOrder: i + 1,
    })),
  });

  const instSection4 = await prisma.formSection.create({
    data: { formTemplateId: installationForm.id, title: 'ملاحظات المشرف', titleEn: 'Supervisor Notes', sortOrder: 4 },
  });
  await prisma.formField.createMany({
    data: [
      { sectionId: instSection4.id, label: 'ملاحظات المشرف', labelEn: 'Supervisor Notes', fieldType: 'LONG_TEXT', isRequired: false, sortOrder: 1 },
      { sectionId: instSection4.id, label: 'التوقيع', labelEn: 'Signature', fieldType: 'SIGNATURE', isRequired: false, sortOrder: 2 },
      { sectionId: instSection4.id, label: 'الموقع الجغرافي', labelEn: 'GPS Location', fieldType: 'GPS_LOCATION', isRequired: false, sortOrder: 3 },
    ],
  });

  console.log('✅ تم إنشاء نموذج تقرير التركيب');

  // Create settings
  await prisma.setting.upsert({
    where: { key: 'company' },
    update: {},
    create: {
      key: 'company',
      value: {
        name: 'منصة ويفز للتقارير',
        nameEn: 'Waves Reporting Platform',
        primaryColor: '#2573eb',
        logo: null,
      },
    },
  });

  // Create activity log
  await prisma.activityLog.create({
    data: {
      userId: superAdmin.id,
      projectId: project.id,
      action: 'CREATE',
      entity: 'PROJECT',
      entityId: project.id,
      details: { message: 'تم إنشاء المشروع التجريبي' },
    },
  });

  console.log('✅ تم إنشاء الإعدادات وسجل النشاط');
  console.log('🎉 اكتملت تهيئة قاعدة البيانات بنجاح!');
  console.log('');
  console.log('📧 حسابات تجريبية:');
  console.log('   superadmin@example.com / password123');
  console.log('   admin@example.com / password123');
  console.log('   pm@example.com / password123');
  console.log('   supervisor@example.com / password123');
  console.log('   viewer@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ خطأ في تهيئة قاعدة البيانات:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
