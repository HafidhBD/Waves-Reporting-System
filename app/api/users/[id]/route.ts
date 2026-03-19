import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true, email: true, name: true, role: true, isActive: true,
        phone: true, createdAt: true, lastLoginAt: true,
        _count: { select: { submissions: true, projectAccess: true } },
      },
    });

    if (!user) return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const currentUserRole = (session.user as any).role;
    if (currentUserRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'فقط مدير النظام يمكنه تعديل المستخدمين' }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, role, phone, isActive, password } = body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (role !== undefined) data.role = role;
    if (phone !== undefined) data.phone = phone;
    if (isActive !== undefined) data.isActive = isActive;
    if (password) data.password = await hash(password, 12);

    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: { id: true, email: true, name: true, role: true, isActive: true, phone: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: 'UPDATE',
        entity: 'USER',
        entityId: user.id,
        details: { name: user.name, changes: Object.keys(data) },
      },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error updating user:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 400 });
    }
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث المستخدم' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const currentUserRole = (session.user as any).role;
    if (currentUserRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'فقط مدير النظام يمكنه حذف المستخدمين' }, { status: 403 });
    }

    const currentUserId = (session.user as any).id;
    if (params.id === currentUserId) {
      return NextResponse.json({ error: 'لا يمكنك حذف حسابك الخاص' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: params.id } });

    await prisma.activityLog.create({
      data: {
        userId: currentUserId,
        action: 'DELETE',
        entity: 'USER',
        entityId: params.id,
        details: {},
      },
    });

    return NextResponse.json({ message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف المستخدم' }, { status: 500 });
  }
}
