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
    const format = searchParams.get('format') || 'json';

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (formTemplateId) where.formTemplateId = formTemplateId;

    const submissions = await prisma.submission.findMany({
      where,
      include: {
        formTemplate: { select: { name: true, type: true } },
        project: { select: { name: true, clientName: true } },
        submittedBy: { select: { name: true, email: true } },
        answers: { include: { field: { select: { label: true, fieldType: true } } } },
        location: true,
        files: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      const headers = [
        'رقم التقرير', 'المشروع', 'العميل', 'النموذج', 'المُرسل',
        'الحالة', 'تاريخ الإرسال', 'خط العرض', 'خط الطول',
      ];

      const allFieldLabels = new Set<string>();
      submissions.forEach((s) => s.answers.forEach((a) => allFieldLabels.add(a.field.label)));
      const fieldLabels = Array.from(allFieldLabels);
      headers.push(...fieldLabels);

      const rows = submissions.map((s) => {
        const base = [
          s.id,
          s.project.name,
          s.project.clientName,
          s.formTemplate.name,
          s.submittedBy.name,
          s.status,
          s.submittedAt?.toISOString() || s.createdAt.toISOString(),
          s.location?.latitude?.toString() || '',
          s.location?.longitude?.toString() || '',
        ];

        const answerMap = new Map(s.answers.map((a) => [a.field.label, a.value || '']));
        fieldLabels.forEach((label) => base.push(answerMap.get(label) || ''));

        return base;
      });

      const csvContent = [
        '\uFEFF' + headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="waves-export-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ count: submissions.length, submissions });
  } catch (error) {
    console.error('Error exporting:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء التصدير' }, { status: 500 });
  }
}
