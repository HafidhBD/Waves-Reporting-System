import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        formTemplates: {
          include: { _count: { select: { submissions: true } } },
          orderBy: { sortOrder: 'asc' },
        },
        _count: { select: { formTemplates: true, submissions: true } },
      },
    });

    if (!project) return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
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

    // Restrict status change to ADMIN/SUPER_ADMIN only
    if (body.status && !['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لتغيير حالة المشروع' }, { status: 403 });
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.clientName && { clientName: body.clientName }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.location !== undefined && { location: body.location }),
        ...(body.startDate !== undefined && { startDate: body.startDate ? new Date(body.startDate) : null }),
        ...(body.endDate !== undefined && { endDate: body.endDate ? new Date(body.endDate) : null }),
        ...(body.status && { status: body.status }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });

    const userId = (session.user as any).id;
    if (body.status) {
      await prisma.activityLog.create({
        data: {
          userId,
          projectId: project.id,
          action: 'UPDATE',
          entity: 'PROJECT',
          entityId: project.id,
          details: { status: body.status, projectName: project.name },
        },
      });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث المشروع' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const userRole = (session.user as any).role;
    if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'ليس لديك صلاحية لحذف المشروع' }, { status: 403 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, _count: { select: { submissions: true } } },
    });

    if (!project) {
      return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });
    }

    // Delete related data in order
    await prisma.submissionLocation.deleteMany({
      where: { submission: { projectId: params.id } },
    });
    await prisma.submissionFile.deleteMany({
      where: { submission: { projectId: params.id } },
    });
    await prisma.submissionAnswer.deleteMany({
      where: { submission: { projectId: params.id } },
    });
    await prisma.submission.deleteMany({ where: { projectId: params.id } });
    await prisma.formField.deleteMany({
      where: { section: { formTemplate: { projectId: params.id } } },
    });
    await prisma.formSection.deleteMany({
      where: { formTemplate: { projectId: params.id } },
    });
    await prisma.formTemplate.deleteMany({ where: { projectId: params.id } });
    await prisma.userProjectAccess.deleteMany({ where: { projectId: params.id } });
    await prisma.activityLog.deleteMany({ where: { projectId: params.id } });
    await prisma.project.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف المشروع' }, { status: 500 });
  }
}
