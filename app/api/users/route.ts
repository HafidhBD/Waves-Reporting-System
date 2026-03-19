import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { hash } from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const userRole = (session.user as any).role;
    if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true, email: true, name: true, role: true, isActive: true,
        phone: true, createdAt: true, lastLoginAt: true,
        _count: { select: { submissions: true, projectAccess: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const userRole = (session.user as any).role;
    if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });
    }

    const body = await req.json();
    const { email, name, password, role, phone } = body;

    if (!email || !name || !password) {
      return NextResponse.json({ error: 'البريد والاسم وكلمة المرور مطلوبة' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'البريد الإلكتروني مستخدم بالفعل' }, { status: 400 });
    }

    const hashedPassword = await hash(password, 12);
    const user = await prisma.user.create({
      data: { email, name, password: hashedPassword, role: role || 'VIEWER', phone },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    await prisma.activityLog.create({
      data: {
        userId: (session.user as any).id,
        action: 'CREATE',
        entity: 'USER',
        entityId: user.id,
        details: { name: user.name, email: user.email, role: user.role },
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء المستخدم' }, { status: 500 });
  }
}
