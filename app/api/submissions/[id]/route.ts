import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: {
        formTemplate: {
          include: {
            sections: {
              include: {
                fields: { orderBy: { sortOrder: 'asc' } },
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
        project: { select: { id: true, name: true, clientName: true } },
        submittedBy: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true, email: true } },
        answers: { include: { field: true } },
        location: true,
        files: true,
      },
    });

    if (!submission) return NextResponse.json({ error: 'التقرير غير موجود' }, { status: 404 });
    return NextResponse.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const userRole = (session.user as any).role;
    if (!['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(userRole)) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لتحديث حالة التقرير' }, { status: 403 });
    }

    const body = await req.json();
    const { status, reviewNotes } = body;

    const validStatuses = ['SUBMITTED', 'REVIEWED', 'APPROVED', 'REJECTED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'حالة غير صالحة' }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const data: any = {};
    if (status) data.status = status;
    if (reviewNotes !== undefined) data.reviewNotes = reviewNotes;
    if (['REVIEWED', 'APPROVED', 'REJECTED'].includes(status)) {
      data.reviewedById = userId;
      data.reviewedAt = new Date();
    }

    const submission = await prisma.submission.update({
      where: { id: params.id },
      data,
      include: {
        formTemplate: { select: { name: true } },
        project: { select: { name: true } },
      },
    });

    await prisma.activityLog.create({
      data: {
        userId,
        projectId: submission.projectId,
        action: status === 'APPROVED' ? 'APPROVE' : status === 'REJECTED' ? 'REJECT' : 'REVIEW',
        entity: 'SUBMISSION',
        entityId: submission.id,
        details: { status, formName: submission.formTemplate.name },
      },
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error('Error updating submission:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث التقرير' }, { status: 500 });
  }
}
