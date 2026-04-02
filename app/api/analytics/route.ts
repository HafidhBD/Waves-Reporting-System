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

    const subWhere: any = {};
    if (projectId) subWhere.projectId = projectId;

    const [
      totalSubmissions,
      approvedCount,
      rejectedCount,
      reviewedCount,
      submittedCount,
      draftCount,
      totalProjects,
      activeProjects,
      totalUsers,
      activeUsers,
      totalFiles,
      projects,
      submissions,
      supervisorStats,
    ] = await Promise.all([
      prisma.submission.count({ where: subWhere }),
      prisma.submission.count({ where: { ...subWhere, status: 'APPROVED' } }),
      prisma.submission.count({ where: { ...subWhere, status: 'REJECTED' } }),
      prisma.submission.count({ where: { ...subWhere, status: 'REVIEWED' } }),
      prisma.submission.count({ where: { ...subWhere, status: 'SUBMITTED' } }),
      prisma.submission.count({ where: { ...subWhere, status: 'DRAFT' } }),
      prisma.project.count(),
      prisma.project.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.submissionFile.count({ where: subWhere.projectId ? { submission: { projectId: subWhere.projectId } } : {} }),
      prisma.project.findMany({
        select: { id: true, name: true, status: true, _count: { select: { submissions: true, formTemplates: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.submission.findMany({
        where: subWhere,
        select: { createdAt: true, status: true, formTemplate: { select: { type: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.submission.groupBy({
        by: ['submittedById'],
        where: subWhere,
        _count: { id: true },
      }),
    ]);

    // Get supervisor names
    const supervisorIds = supervisorStats.map((s: any) => s.submittedById);
    const supervisorUsers = await prisma.user.findMany({
      where: { id: { in: supervisorIds } },
      select: { id: true, name: true },
    });
    const supervisorMap = new Map(supervisorUsers.map((u: any) => [u.id, u.name]));

    const topSupervisors = supervisorStats
      .map((s: any) => ({ name: supervisorMap.get(s.submittedById) || 'غير معروف', count: s._count.id }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);

    // Monthly data (last 6 months)
    const now = new Date();
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthSubs = submissions.filter((s: any) => {
        const sd = new Date(s.createdAt);
        return sd >= d && sd <= end;
      });
      const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      monthlyData.push({
        month: monthNames[d.getMonth()],
        total: monthSubs.length,
        approved: monthSubs.filter((s: any) => s.status === 'APPROVED').length,
        rejected: monthSubs.filter((s: any) => s.status === 'REJECTED').length,
        pending: monthSubs.filter((s: any) => s.status === 'SUBMITTED' || s.status === 'REVIEWED').length,
      });
    }

    // Completion rates
    const approvalRate = totalSubmissions > 0 ? Math.round((approvedCount / totalSubmissions) * 100) : 0;
    const reviewRate = totalSubmissions > 0 ? Math.round(((approvedCount + reviewedCount + rejectedCount) / totalSubmissions) * 100) : 0;

    return NextResponse.json({
      metrics: {
        totalSubmissions,
        approvedCount,
        rejectedCount,
        reviewedCount,
        submittedCount,
        draftCount,
        totalProjects,
        activeProjects,
        totalUsers,
        activeUsers,
        totalFiles,
      },
      monthlyData,
      topSupervisors,
      completionRates: {
        approvalRate,
        reviewRate,
      },
      projects,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
