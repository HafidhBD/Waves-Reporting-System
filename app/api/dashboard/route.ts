import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      activeProjects,
      totalProjects,
      totalSubmissions,
      todaySubmissions,
      pendingReview,
      totalUsers,
      activeUsers,
      recentSubmissions,
    ] = await Promise.all([
      prisma.project.count({ where: { status: 'ACTIVE' } }),
      prisma.project.count(),
      prisma.submission.count(),
      prisma.submission.count({ where: { createdAt: { gte: today } } }),
      prisma.submission.count({ where: { status: 'SUBMITTED' } }),
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.submission.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          formTemplate: { select: { name: true, type: true } },
          project: { select: { name: true, clientName: true } },
          submittedBy: { select: { name: true } },
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        activeProjects,
        totalProjects,
        totalSubmissions,
        todaySubmissions,
        pendingReview,
        totalUsers,
        activeUsers,
      },
      recentSubmissions,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
