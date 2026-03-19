import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const form = await prisma.formTemplate.findUnique({
      where: { id: params.id },
      include: {
        project: { select: { id: true, name: true, clientName: true } },
        sections: {
          include: {
            fields: {
              include: { options: { orderBy: { sortOrder: 'asc' } } },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!form) return NextResponse.json({ error: 'النموذج غير موجود' }, { status: 404 });
    return NextResponse.json(form);
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const userRole = (session.user as any).role;
    if (!['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(userRole)) {
      return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });
    }

    const body = await req.json();

    // Update form template metadata
    const form = await prisma.formTemplate.update({
      where: { id: params.id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.nameEn !== undefined && { nameEn: body.nameEn }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.status && { status: body.status }),
      },
    });

    // If sections are provided, replace all sections and fields
    if (body.sections && Array.isArray(body.sections)) {
      // Delete existing fields and sections
      const existingSections = await prisma.formSection.findMany({
        where: { formTemplateId: params.id },
        select: { id: true },
      });
      const sectionIds = existingSections.map((s: any) => s.id);
      if (sectionIds.length > 0) {
        await prisma.fieldOption.deleteMany({
          where: { field: { sectionId: { in: sectionIds } } },
        });
        await prisma.formField.deleteMany({
          where: { sectionId: { in: sectionIds } },
        });
        await prisma.formSection.deleteMany({
          where: { formTemplateId: params.id },
        });
      }

      // Create new sections and fields
      for (let si = 0; si < body.sections.length; si++) {
        const s = body.sections[si];
        if (!s.title && !s.titleEn) continue;

        const section = await prisma.formSection.create({
          data: {
            formTemplateId: params.id,
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

    // Return updated form with sections
    const updatedForm = await prisma.formTemplate.findUnique({
      where: { id: params.id },
      include: {
        sections: {
          include: { fields: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return NextResponse.json(updatedForm);
  } catch (error) {
    console.error('Error updating form:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث النموذج' }, { status: 500 });
  }
}
