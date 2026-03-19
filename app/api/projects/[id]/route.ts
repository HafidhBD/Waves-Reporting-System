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

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث المشروع' }, { status: 500 });
  }
}
