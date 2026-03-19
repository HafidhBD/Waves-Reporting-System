import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateProjectCode } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const where: any = {};
    if (status && status !== 'ALL') where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { clientName: { contains: search } },
        { projectCode: { contains: search } },
      ];
    }

    const userRole = (session.user as any).role;
    if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
      where.OR = [
        { createdById: (session.user as any).id },
        { members: { some: { userId: (session.user as any).id } } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        _count: { select: { formTemplates: true, submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب المشاريع' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(userRole)) {
      return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });
    }

    const body = await req.json();
    const { name, clientName, city, location, startDate, endDate, description, notes, enableInstallation, enableActivation, enableDismantling } = body;

    if (!name || !clientName) {
      return NextResponse.json({ error: 'اسم المشروع واسم العميل مطلوبان' }, { status: 400 });
    }

    const projectCode = generateProjectCode();
    const userId = (session.user as any).id;

    const project = await prisma.project.create({
      data: {
        name,
        clientName,
        projectCode,
        city: city || null,
        location: location || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        description: description || null,
        notes: notes || null,
        createdById: userId,
        members: {
          create: { userId, role: userRole as any },
        },
      },
    });

    // Create default forms if enabled
    const defaultForms = [];
    if (enableInstallation) {
      defaultForms.push({
        projectId: project.id,
        name: 'تقرير تنفيذ التركيب',
        nameEn: 'Installation Execution Report',
        type: 'installation',
        status: 'PUBLISHED' as const,
        isDefault: true,
        sortOrder: 1,
      });
    }
    if (enableActivation) {
      defaultForms.push({
        projectId: project.id,
        name: 'تقرير التفعيل الميداني',
        nameEn: 'Field Activation Report',
        type: 'activation',
        status: 'PUBLISHED' as const,
        isDefault: true,
        sortOrder: 2,
      });
    }
    if (enableDismantling) {
      defaultForms.push({
        projectId: project.id,
        name: 'تقرير إزالة وفك التركيب',
        nameEn: 'Dismantling / Removal Report',
        type: 'dismantling',
        status: 'PUBLISHED' as const,
        isDefault: true,
        sortOrder: 3,
      });
    }

    if (defaultForms.length > 0) {
      await prisma.formTemplate.createMany({ data: defaultForms });
    }

    // Create default form sections and fields for each default form
    const createdForms = await prisma.formTemplate.findMany({
      where: { projectId: project.id, isDefault: true },
    });

    for (const form of createdForms) {
      await createDefaultFormStructure(form.id, form.type);
    }

    await prisma.activityLog.create({
      data: {
        userId,
        projectId: project.id,
        action: 'CREATE',
        entity: 'PROJECT',
        entityId: project.id,
        details: { name: project.name, clientName: project.clientName },
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء المشروع' }, { status: 500 });
  }
}

async function createDefaultFormStructure(formId: string, type: string) {
  if (type === 'installation') {
    const section1 = await prisma.formSection.create({
      data: { formTemplateId: formId, title: 'المعلومات العامة', titleEn: 'General Information', sortOrder: 1 },
    });
    const fields1 = [
      { sectionId: section1.id, label: 'اسم المشروع', labelEn: 'Project Name', fieldType: 'SHORT_TEXT' as const, isRequired: true, sortOrder: 1 },
      { sectionId: section1.id, label: 'اسم العميل', labelEn: 'Client Name', fieldType: 'SHORT_TEXT' as const, isRequired: true, sortOrder: 2 },
      { sectionId: section1.id, label: 'اسم الفعالية / النشاط', labelEn: 'Event / Activity Name', fieldType: 'SHORT_TEXT' as const, isRequired: true, sortOrder: 3 },
      { sectionId: section1.id, label: 'التاريخ', labelEn: 'Date', fieldType: 'DATE' as const, isRequired: true, sortOrder: 4 },
      { sectionId: section1.id, label: 'وقت البداية', labelEn: 'Start Time', fieldType: 'TIME' as const, isRequired: true, sortOrder: 5 },
      { sectionId: section1.id, label: 'وقت النهاية', labelEn: 'End Time', fieldType: 'TIME' as const, isRequired: false, sortOrder: 6 },
      { sectionId: section1.id, label: 'الموقع', labelEn: 'Location', fieldType: 'SHORT_TEXT' as const, isRequired: true, sortOrder: 7 },
      { sectionId: section1.id, label: 'مدير المشروع', labelEn: 'Project Manager', fieldType: 'SHORT_TEXT' as const, isRequired: false, sortOrder: 8 },
      { sectionId: section1.id, label: 'المشرف الميداني', labelEn: 'Field Supervisor', fieldType: 'SHORT_TEXT' as const, isRequired: false, sortOrder: 9 },
      { sectionId: section1.id, label: 'المقاول / المورد', labelEn: 'Contractor / Vendor', fieldType: 'SHORT_TEXT' as const, isRequired: false, sortOrder: 10 },
      { sectionId: section1.id, label: 'نوع التركيب', labelEn: 'Type of Installation', fieldType: 'SHORT_TEXT' as const, isRequired: false, sortOrder: 11 },
      { sectionId: section1.id, label: 'حالة التصريح', labelEn: 'Permit Status', fieldType: 'DROPDOWN' as const, isRequired: false, sortOrder: 12 },
      { sectionId: section1.id, label: 'عدد فريق العمل', labelEn: 'Team Count', fieldType: 'NUMBER' as const, isRequired: false, sortOrder: 13 },
      { sectionId: section1.id, label: 'الطقس / حالة الموقع', labelEn: 'Weather / Site Conditions', fieldType: 'SHORT_TEXT' as const, isRequired: false, sortOrder: 14 },
    ];
    await prisma.formField.createMany({ data: fields1 });

    const section2 = await prisma.formSection.create({
      data: { formTemplateId: formId, title: 'التوثيق', titleEn: 'Documentation', sortOrder: 2 },
    });
    const fields2 = [
      { sectionId: section2.id, label: 'قبل التركيب', labelEn: 'Before Installation', fieldType: 'LONG_TEXT' as const, isRequired: false, sortOrder: 1 },
      { sectionId: section2.id, label: 'صور قبل التركيب', labelEn: 'Photos Before Installation', fieldType: 'MULTIPLE_IMAGES' as const, isRequired: false, sortOrder: 2 },
      { sectionId: section2.id, label: 'أثناء التركيب', labelEn: 'During Installation', fieldType: 'LONG_TEXT' as const, isRequired: false, sortOrder: 3 },
      { sectionId: section2.id, label: 'صور أثناء التركيب', labelEn: 'Photos During Installation', fieldType: 'MULTIPLE_IMAGES' as const, isRequired: false, sortOrder: 4 },
      { sectionId: section2.id, label: 'بعد التركيب', labelEn: 'After Installation', fieldType: 'LONG_TEXT' as const, isRequired: false, sortOrder: 5 },
      { sectionId: section2.id, label: 'صور بعد التركيب', labelEn: 'Photos After Installation', fieldType: 'MULTIPLE_IMAGES' as const, isRequired: false, sortOrder: 6 },
    ];
    await prisma.formField.createMany({ data: fields2 });

    const section3 = await prisma.formSection.create({
      data: { formTemplateId: formId, title: 'قائمة التحقق', titleEn: 'Checklist', sortOrder: 3 },
    });
    const checklistItems = [
      'بدأ التركيب في الوقت المحدد',
      'اكتمل التركيب في الوقت المحدد',
      'تم الحصول على التصريح',
      'ارتدى الفريق معدات السلامة',
      'وصلت المواد بحالة جيدة',
      'تم تجهيز الموقع',
      'التركيب مطابق للتصميم المعتمد',
      'تم وضع العلامات التجارية بشكل صحيح',
      'تم فحص التوصيلات الكهربائية',
      'تم السيطرة على مخاطر السلامة',
      'تم تنظيف الموقع بعد التركيب',
      'لم يحدث ضرر في الموقع',
      'تم التسليم',
    ];
    const fields3 = checklistItems.map((item, i) => ({
      sectionId: section3.id,
      label: item,
      fieldType: 'YES_NO' as const,
      isRequired: false,
      sortOrder: i + 1,
    }));
    await prisma.formField.createMany({ data: fields3 });

    const section4 = await prisma.formSection.create({
      data: { formTemplateId: formId, title: 'ملاحظات المشرف', titleEn: 'Supervisor Notes', sortOrder: 4 },
    });
    await prisma.formField.createMany({
      data: [
        { sectionId: section4.id, label: 'ملاحظات المشرف', labelEn: 'Supervisor Notes', fieldType: 'LONG_TEXT' as const, isRequired: false, sortOrder: 1 },
        { sectionId: section4.id, label: 'التوقيع', labelEn: 'Signature', fieldType: 'SIGNATURE' as const, isRequired: false, sortOrder: 2 },
        { sectionId: section4.id, label: 'الموقع الجغرافي', labelEn: 'GPS Location', fieldType: 'GPS_LOCATION' as const, isRequired: false, sortOrder: 3 },
      ],
    });
  } else if (type === 'activation') {
    const section1 = await prisma.formSection.create({
      data: { formTemplateId: formId, title: 'المعلومات العامة', titleEn: 'General Information', sortOrder: 1 },
    });
    await prisma.formField.createMany({
      data: [
        { sectionId: section1.id, label: 'اسم المشروع', labelEn: 'Project Name', fieldType: 'SHORT_TEXT' as const, isRequired: true, sortOrder: 1 },
        { sectionId: section1.id, label: 'اسم العميل', labelEn: 'Client Name', fieldType: 'SHORT_TEXT' as const, isRequired: true, sortOrder: 2 },
        { sectionId: section1.id, label: 'اسم التفعيل', labelEn: 'Activation Name', fieldType: 'SHORT_TEXT' as const, isRequired: true, sortOrder: 3 },
        { sectionId: section1.id, label: 'التاريخ', labelEn: 'Date', fieldType: 'DATE' as const, isRequired: true, sortOrder: 4 },
        { sectionId: section1.id, label: 'بداية الوردية', labelEn: 'Shift Start', fieldType: 'TIME' as const, isRequired: true, sortOrder: 5 },
        { sectionId: section1.id, label: 'نهاية الوردية', labelEn: 'Shift End', fieldType: 'TIME' as const, isRequired: false, sortOrder: 6 },
        { sectionId: section1.id, label: 'الموقع', labelEn: 'Location', fieldType: 'SHORT_TEXT' as const, isRequired: true, sortOrder: 7 },
        { sectionId: section1.id, label: 'مدير المشروع', labelEn: 'Project Manager', fieldType: 'SHORT_TEXT' as const, isRequired: false, sortOrder: 8 },
        { sectionId: section1.id, label: 'المشرف الميداني', labelEn: 'Field Supervisor', fieldType: 'SHORT_TEXT' as const, isRequired: false, sortOrder: 9 },
        { sectionId: section1.id, label: 'العلامة التجارية / العميل', labelEn: 'Brand / Client', fieldType: 'SHORT_TEXT' as const, isRequired: false, sortOrder: 10 },
        { sectionId: section1.id, label: 'فئة التفعيل', labelEn: 'Activation Category', fieldType: 'SHORT_TEXT' as const, isRequired: false, sortOrder: 11 },
        { sectionId: section1.id, label: 'عدد الموظفين', labelEn: 'Number of Staff', fieldType: 'NUMBER' as const, isRequired: false, sortOrder: 12 },
        { sectionId: section1.id, label: 'عدد المروّجين', labelEn: 'Number of Promoters', fieldType: 'NUMBER' as const, isRequired: false, sortOrder: 13 },
        { sectionId: section1.id, label: 'عدد المشاركين المتوقع', labelEn: 'Estimated Participants', fieldType: 'NUMBER' as const, isRequired: false, sortOrder: 14 },
      ],
    });

    const section2 = await prisma.formSection.create({
      data: { formTemplateId: formId, title: 'التوثيق', titleEn: 'Documentation', sortOrder: 2 },
    });
    await prisma.formField.createMany({
      data: [
        { sectionId: section2.id, label: 'حالة التجهيز', labelEn: 'Setup Status', fieldType: 'LONG_TEXT' as const, isRequired: false, sortOrder: 1 },
        { sectionId: section2.id, label: 'سير النشاط', labelEn: 'Activity Flow', fieldType: 'LONG_TEXT' as const, isRequired: false, sortOrder: 2 },
        { sectionId: section2.id, label: 'تفاعل الجمهور', labelEn: 'Audience Engagement', fieldType: 'LONG_TEXT' as const, isRequired: false, sortOrder: 3 },
        { sectionId: section2.id, label: 'ملاحظات وقت الذروة', labelEn: 'Peak Time Observations', fieldType: 'LONG_TEXT' as const, isRequired: false, sortOrder: 4 },
        { sectionId: section2.id, label: 'صور', labelEn: 'Photo Uploads', fieldType: 'MULTIPLE_IMAGES' as const, isRequired: false, sortOrder: 5 },
        { sectionId: section2.id, label: 'المشاكل المواجهة', labelEn: 'Issues Encountered', fieldType: 'LONG_TEXT' as const, isRequired: false, sortOrder: 6 },
      ],
    });

    const section3 = await prisma.formSection.create({
      data: { formTemplateId: formId, title: 'قائمة التحقق', titleEn: 'Checklist', sortOrder: 3 },
    });
    const checklistItems = [
      'بدأ التفعيل في الوقت المحدد',
      'الفريق حاضر وتم إحاطته',
      'الزي الرسمي مطابق للمعايير',
      'المنطقة جاهزة بالكامل',
      'العلامات التجارية مرئية',
      'أدوات التفاعل متوفرة',
      'الهدايا / المواد متوفرة',
      'إجراءات السلامة مطبقة',
      'أدوات أنشطة الأطفال آمنة',
      'تم إدارة تدفق الحشود',
      'تم توثيق تفاعل الزوار',
      'الموقع نظيف',
      'تم إتمام إجراءات الإغلاق',
    ];
    await prisma.formField.createMany({
      data: checklistItems.map((item, i) => ({
        sectionId: section3.id, label: item, fieldType: 'YES_NO' as const, isRequired: false, sortOrder: i + 1,
      })),
    });

    const section4 = await prisma.formSection.create({
      data: { formTemplateId: formId, title: 'ملاحظات المشرف', titleEn: 'Supervisor Notes', sortOrder: 4 },
    });
    await prisma.formField.createMany({
      data: [
        { sectionId: section4.id, label: 'ملاحظات المشرف', labelEn: 'Supervisor Notes', fieldType: 'LONG_TEXT' as const, isRequired: false, sortOrder: 1 },
        { sectionId: section4.id, label: 'التوقيع', labelEn: 'Signature', fieldType: 'SIGNATURE' as const, isRequired: false, sortOrder: 2 },
        { sectionId: section4.id, label: 'الموقع الجغرافي', labelEn: 'GPS Location', fieldType: 'GPS_LOCATION' as const, isRequired: false, sortOrder: 3 },
      ],
    });
  } else if (type === 'dismantling') {
    const section1 = await prisma.formSection.create({
      data: { formTemplateId: formId, title: 'المعلومات العامة', titleEn: 'General Information', sortOrder: 1 },
    });
    await prisma.formField.createMany({
      data: [
        { sectionId: section1.id, label: 'اسم المشروع', labelEn: 'Project Name', fieldType: 'SHORT_TEXT' as const, isRequired: true, sortOrder: 1 },
        { sectionId: section1.id, label: 'اسم العميل', labelEn: 'Client Name', fieldType: 'SHORT_TEXT' as const, isRequired: true, sortOrder: 2 },
        { sectionId: section1.id, label: 'اسم الفعالية / النشاط', labelEn: 'Event / Activity Name', fieldType: 'SHORT_TEXT' as const, isRequired: true, sortOrder: 3 },
        { sectionId: section1.id, label: 'التاريخ', labelEn: 'Date', fieldType: 'DATE' as const, isRequired: true, sortOrder: 4 },
        { sectionId: section1.id, label: 'وقت البداية', labelEn: 'Start Time', fieldType: 'TIME' as const, isRequired: true, sortOrder: 5 },
        { sectionId: section1.id, label: 'وقت النهاية', labelEn: 'End Time', fieldType: 'TIME' as const, isRequired: false, sortOrder: 6 },
        { sectionId: section1.id, label: 'الموقع', labelEn: 'Location', fieldType: 'SHORT_TEXT' as const, isRequired: true, sortOrder: 7 },
        { sectionId: section1.id, label: 'مدير المشروع', labelEn: 'Project Manager', fieldType: 'SHORT_TEXT' as const, isRequired: false, sortOrder: 8 },
        { sectionId: section1.id, label: 'مشرف الإزالة', labelEn: 'Removal Supervisor', fieldType: 'SHORT_TEXT' as const, isRequired: false, sortOrder: 9 },
        { sectionId: section1.id, label: 'المورد / المقاول', labelEn: 'Vendor / Contractor', fieldType: 'SHORT_TEXT' as const, isRequired: false, sortOrder: 10 },
        { sectionId: section1.id, label: 'نوع الإزالة', labelEn: 'Removal Type', fieldType: 'SHORT_TEXT' as const, isRequired: false, sortOrder: 11 },
      ],
    });

    const section2 = await prisma.formSection.create({
      data: { formTemplateId: formId, title: 'التوثيق', titleEn: 'Documentation', sortOrder: 2 },
    });
    await prisma.formField.createMany({
      data: [
        { sectionId: section2.id, label: 'قبل الفك', labelEn: 'Before Dismantling', fieldType: 'LONG_TEXT' as const, isRequired: false, sortOrder: 1 },
        { sectionId: section2.id, label: 'صور قبل الفك', labelEn: 'Photos Before Dismantling', fieldType: 'MULTIPLE_IMAGES' as const, isRequired: false, sortOrder: 2 },
        { sectionId: section2.id, label: 'أثناء الإزالة', labelEn: 'During Removal', fieldType: 'LONG_TEXT' as const, isRequired: false, sortOrder: 3 },
        { sectionId: section2.id, label: 'صور أثناء الإزالة', labelEn: 'Photos During Removal', fieldType: 'MULTIPLE_IMAGES' as const, isRequired: false, sortOrder: 4 },
        { sectionId: section2.id, label: 'حالة الموقع النهائية', labelEn: 'Final Site Condition', fieldType: 'LONG_TEXT' as const, isRequired: false, sortOrder: 5 },
        { sectionId: section2.id, label: 'صور الحالة النهائية', labelEn: 'Photos Final Condition', fieldType: 'MULTIPLE_IMAGES' as const, isRequired: false, sortOrder: 6 },
      ],
    });

    const section3 = await prisma.formSection.create({
      data: { formTemplateId: formId, title: 'قائمة التحقق', titleEn: 'Checklist', sortOrder: 3 },
    });
    const checklistItems = [
      'بدأت الإزالة في الوقت المحدد',
      'اكتملت الإزالة في الوقت المحدد',
      'تم تأكيد الموافقات المطلوبة',
      'ارتدى الفريق معدات السلامة',
      'تمت إزالة جميع المواد',
      'تم تسليم المكان نظيفاً',
      'لم يحدث أي ضرر',
      'تم التعامل مع النفايات بشكل صحيح',
      'تم عد الأصول واستعادتها',
      'تم التسليم',
    ];
    await prisma.formField.createMany({
      data: checklistItems.map((item, i) => ({
        sectionId: section3.id, label: item, fieldType: 'YES_NO' as const, isRequired: false, sortOrder: i + 1,
      })),
    });

    const section4 = await prisma.formSection.create({
      data: { formTemplateId: formId, title: 'ملاحظات المشرف', titleEn: 'Supervisor Notes', sortOrder: 4 },
    });
    await prisma.formField.createMany({
      data: [
        { sectionId: section4.id, label: 'ملاحظات المشرف', labelEn: 'Supervisor Notes', fieldType: 'LONG_TEXT' as const, isRequired: false, sortOrder: 1 },
        { sectionId: section4.id, label: 'التوقيع', labelEn: 'Signature', fieldType: 'SIGNATURE' as const, isRequired: false, sortOrder: 2 },
        { sectionId: section4.id, label: 'الموقع الجغرافي', labelEn: 'GPS Location', fieldType: 'GPS_LOCATION' as const, isRequired: false, sortOrder: 3 },
      ],
    });
  }
}
