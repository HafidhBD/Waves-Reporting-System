import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const userRole = (session.user as any).role;
    if (!['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(userRole)) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'معرف المشروع مطلوب' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        formTemplates: { select: { id: true, name: true, type: true } },
        members: { include: { user: { select: { name: true, role: true } } } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });
    }

    const submissions = await prisma.submission.findMany({
      where: { projectId },
      include: {
        formTemplate: { select: { name: true, type: true, sections: { include: { fields: { orderBy: { sortOrder: 'asc' } } }, orderBy: { sortOrder: 'asc' } } } },
        submittedBy: { select: { name: true } },
        answers: { include: { field: { select: { label: true, fieldType: true } } } },
        location: true,
        reviewedBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const statusCounts = {
      total: submissions.length,
      draft: submissions.filter(s => s.status === 'DRAFT').length,
      submitted: submissions.filter(s => s.status === 'SUBMITTED').length,
      reviewed: submissions.filter(s => s.status === 'REVIEWED').length,
      approved: submissions.filter(s => s.status === 'APPROVED').length,
      rejected: submissions.filter(s => s.status === 'REJECTED').length,
    };

    return NextResponse.json({
      project: {
        name: project.name,
        clientName: project.clientName,
        projectCode: project.projectCode,
        city: project.city,
        startDate: project.startDate,
        endDate: project.endDate,
        description: project.description,
        status: project.status,
      },
      formTemplates: project.formTemplates,
      members: project.members.map(m => ({ name: m.user.name, role: m.user.role })),
      statusCounts,
      submissions: submissions.map(s => ({
        id: s.id,
        status: s.status,
        createdAt: s.createdAt,
        submittedAt: s.submittedAt,
        formName: s.formTemplate.name,
        submittedByName: s.submittedBy.name,
        reviewedByName: s.reviewedBy?.name || null,
        reviewNotes: s.reviewNotes,
        location: s.location ? { latitude: s.location.latitude, longitude: s.location.longitude } : null,
        answers: s.answers.map(a => ({
          label: a.field.label,
          fieldType: a.field.fieldType,
          value: a.value,
        })),
      })),
    });
  } catch (error) {
    console.error('Error generating PDF data:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
