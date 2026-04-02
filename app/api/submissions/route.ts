import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const formTemplateId = searchParams.get('formTemplateId');
    const status = searchParams.get('status');

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (formTemplateId) where.formTemplateId = formTemplateId;
    if (status && status !== 'ALL') where.status = status;

    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;
    if (userRole === 'FIELD_SUPERVISOR') {
      where.submittedById = userId;
    } else if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
      where.OR = [
        { submittedById: userId },
        { project: { members: { some: { userId } } } },
      ];
    }

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        formTemplate: { select: { id: true, name: true, type: true } },
        project: { select: { id: true, name: true, clientName: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
        location: true,
        _count: { select: { answers: true, files: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const body = await req.json();
    const { formTemplateId, projectId, answers, status: subStatus, latitude, longitude, accuracy } = body;

    if (!formTemplateId || !projectId) {
      return NextResponse.json({ error: 'معرف النموذج والمشروع مطلوبان' }, { status: 400 });
    }

    const userId = (session.user as any).id;

    const submission = await prisma.submission.create({
      data: {
        formTemplateId,
        projectId,
        submittedById: userId,
        status: subStatus === 'DRAFT' ? 'DRAFT' : 'SUBMITTED',
        submittedAt: subStatus === 'DRAFT' ? null : new Date(),
        answers: answers ? {
          create: answers.map((a: any) => ({
            fieldId: a.fieldId,
            value: typeof a.value === 'string' ? a.value : JSON.stringify(a.value),
          })),
        } : undefined,
        location: (latitude && longitude) ? {
          create: { latitude, longitude, accuracy: accuracy || null },
        } : undefined,
      },
      include: {
        formTemplate: { select: { name: true, type: true } },
        project: { select: { name: true, clientName: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        projectId,
        action: subStatus === 'DRAFT' ? 'SAVE_DRAFT' : 'SUBMIT',
        entity: 'SUBMISSION',
        entityId: submission.id,
        details: { formName: submission.formTemplate.name },
      },
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إرسال التقرير' }, { status: 500 });
  }
}
