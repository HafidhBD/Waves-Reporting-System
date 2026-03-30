import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const members = await prisma.userProjectAccess.findMany({
      where: { projectId: params.id },
      include: { user: { select: { id: true, name: true, email: true, role: true, isActive: true } } },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const userRole = (session.user as any).role;
    if (!['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(userRole)) {
      return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role } = body;

    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
    }

    const existing = await prisma.userProjectAccess.findUnique({
      where: { userId_projectId: { userId, projectId: params.id } },
    });

    if (existing) {
      return NextResponse.json({ error: 'المستخدم مضاف مسبقاً لهذا المشروع' }, { status: 400 });
    }

    const member = await prisma.userProjectAccess.create({
      data: {
        userId,
        projectId: params.id,
        role: role || 'VIEWER',
      },
      include: { user: { select: { id: true, name: true, email: true, role: true, isActive: true } } },
    });

    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        projectId: params.id,
        action: 'ADD_MEMBER',
        entity: 'PROJECT',
        entityId: params.id,
        details: { memberId: userId, role },
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إضافة العضو' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const userRole = (session.user as any).role;
    if (!['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(userRole)) {
      return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return NextResponse.json({ error: 'معرف العضوية مطلوب' }, { status: 400 });
    }

    await prisma.userProjectAccess.delete({ where: { id: memberId } });

    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        projectId: params.id,
        action: 'REMOVE_MEMBER',
        entity: 'PROJECT',
        entityId: params.id,
        details: { memberId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إزالة العضو' }, { status: 500 });
  }
}
