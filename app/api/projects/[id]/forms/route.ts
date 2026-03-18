import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const userRole = (session.user as any).role;
    if (!['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(userRole)) {
      return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });
    }

    const body = await req.json();
    const { name, nameEn, description, type, sections } = body;

    if (!name) {
      return NextResponse.json({ error: 'اسم النموذج مطلوب' }, { status: 400 });
    }

    const formTemplate = await prisma.formTemplate.create({
      data: {
        projectId: params.id,
        name,
        nameEn: nameEn || null,
        description: description || null,
        type: type || 'custom',
        status: 'DRAFT',
        isDefault: false,
      },
    });

    if (sections && Array.isArray(sections)) {
      for (let si = 0; si < sections.length; si++) {
        const s = sections[si];
        if (!s.title && !s.titleEn) continue;

        const section = await prisma.formSection.create({
          data: {
            formTemplateId: formTemplate.id,
            title: s.title || `القسم ${si + 1}`,
            titleEn: s.titleEn || null,
            sortOrder: si + 1,
          },
        });

        if (s.fields && Array.isArray(s.fields)) {
          const fieldsData = s.fields
            .filter((f: any) => f.label)
            .map((f: any, fi: number) => ({
              sectionId: section.id,
              label: f.label,
              labelEn: f.labelEn || null,
              fieldType: f.fieldType || 'SHORT_TEXT',
              isRequired: f.isRequired || false,
              placeholder: f.placeholder || null,
              helpText: f.helpText || null,
              sortOrder: fi + 1,
            }));

          if (fieldsData.length > 0) {
            await prisma.formField.createMany({ data: fieldsData });
          }
        }
      }
    }

    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        projectId: params.id,
        action: 'CREATE',
        entity: 'FORM_TEMPLATE',
        entityId: formTemplate.id,
        details: { name: formTemplate.name, type: formTemplate.type },
      },
    });

    return NextResponse.json(formTemplate, { status: 201 });
  } catch (error) {
    console.error('Error creating form:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء النموذج' }, { status: 500 });
  }
}
