'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const statusLabels: Record<string, string> = {
  DRAFT: 'مسودة',
  SUBMITTED: 'مُرسل',
  REVIEWED: 'تمت المراجعة',
  APPROVED: 'معتمد',
  REJECTED: 'مرفوض',
  ACTIVE: 'نشط',
  COMPLETED: 'مكتمل',
  ON_HOLD: 'متوقف',
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'مدير النظام',
  ADMIN: 'مدير',
  PROJECT_MANAGER: 'مدير مشروع',
  FIELD_SUPERVISOR: 'مشرف ميداني',
  VIEWER: 'مشاهد',
};

function formatDate(d: string | null) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ProjectReportPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/export/pdf?projectId=${params.id}`);
        if (res.ok) setData(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-20 text-gray-500">فشل في تحميل بيانات التقرير</div>;
  }

  const { project, statusCounts, submissions, members } = data;

  return (
    <div className="max-w-4xl mx-auto bg-white">
      {/* Print Button - hidden in print */}
      <div className="print:hidden sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
        <h1 className="font-bold text-gray-900">معاينة تقرير المشروع</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.close()}>إغلاق</Button>
          <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700">
            طباعة / تصدير PDF
          </Button>
        </div>
      </div>

      {/* Report Content */}
      <div className="p-8 space-y-8" dir="rtl">
        {/* Header */}
        <div className="text-center border-b-2 border-blue-600 pb-6">
          <h1 className="text-2xl font-bold text-blue-900 mb-1">تقرير ملخص المشروع</h1>
          <h2 className="text-xl font-bold text-gray-800">{project.name}</h2>
          <p className="text-gray-500 mt-1">{project.clientName}</p>
          <p className="text-xs text-gray-400 mt-2">تاريخ التقرير: {new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Project Info */}
        <div>
          <h3 className="text-lg font-bold text-blue-800 border-b pb-2 mb-4">معلومات المشروع</h3>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b"><td className="py-2 text-gray-500 w-1/3">اسم المشروع</td><td className="py-2 font-medium">{project.name}</td></tr>
              <tr className="border-b"><td className="py-2 text-gray-500">اسم العميل</td><td className="py-2 font-medium">{project.clientName}</td></tr>
              <tr className="border-b"><td className="py-2 text-gray-500">رمز المشروع</td><td className="py-2 font-medium font-mono">{project.projectCode}</td></tr>
              <tr className="border-b"><td className="py-2 text-gray-500">المدينة</td><td className="py-2 font-medium">{project.city || '-'}</td></tr>
              <tr className="border-b"><td className="py-2 text-gray-500">الحالة</td><td className="py-2 font-medium">{statusLabels[project.status] || project.status}</td></tr>
              <tr className="border-b"><td className="py-2 text-gray-500">تاريخ البداية</td><td className="py-2 font-medium">{formatDate(project.startDate)}</td></tr>
              <tr className="border-b"><td className="py-2 text-gray-500">تاريخ النهاية</td><td className="py-2 font-medium">{formatDate(project.endDate)}</td></tr>
              {project.description && <tr className="border-b"><td className="py-2 text-gray-500">الوصف</td><td className="py-2">{project.description}</td></tr>}
            </tbody>
          </table>
        </div>

        {/* Team */}
        {members && members.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-blue-800 border-b pb-2 mb-4">فريق العمل</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="py-2 text-right text-gray-600 px-2">#</th>
                  <th className="py-2 text-right text-gray-600 px-2">الاسم</th>
                  <th className="py-2 text-right text-gray-600 px-2">الدور</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m: any, i: number) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 px-2 text-gray-400">{i + 1}</td>
                    <td className="py-2 px-2 font-medium">{m.name}</td>
                    <td className="py-2 px-2 text-gray-600">{roleLabels[m.role] || m.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Statistics */}
        <div>
          <h3 className="text-lg font-bold text-blue-800 border-b pb-2 mb-4">إحصائيات التقارير</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'إجمالي التقارير', value: statusCounts.total, color: 'bg-blue-50 text-blue-800' },
              { label: 'معتمد', value: statusCounts.approved, color: 'bg-green-50 text-green-800' },
              { label: 'تمت المراجعة', value: statusCounts.reviewed, color: 'bg-purple-50 text-purple-800' },
              { label: 'مُرسل (بانتظار)', value: statusCounts.submitted, color: 'bg-amber-50 text-amber-800' },
              { label: 'مسودة', value: statusCounts.draft, color: 'bg-gray-50 text-gray-800' },
              { label: 'مرفوض', value: statusCounts.rejected, color: 'bg-red-50 text-red-800' },
            ].map((s) => (
              <div key={s.label} className={`rounded-lg p-3 text-center ${s.color}`}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Submissions Detail */}
        <div>
          <h3 className="text-lg font-bold text-blue-800 border-b pb-2 mb-4">تفاصيل التقارير</h3>
          {submissions.length === 0 ? (
            <p className="text-gray-400 text-center py-4">لا توجد تقارير</p>
          ) : (
            submissions.map((sub: any, idx: number) => (
              <div key={sub.id} className="mb-6 border rounded-lg p-4 break-inside-avoid">
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                  <div>
                    <span className="font-bold text-gray-800">تقرير #{idx + 1}</span>
                    <span className="text-sm text-gray-500 mr-2">- {sub.formName}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    sub.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    sub.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    sub.status === 'SUBMITTED' ? 'bg-amber-100 text-amber-700' :
                    sub.status === 'REVIEWED' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {statusLabels[sub.status] || sub.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
                  <span>المُرسل: <strong className="text-gray-700">{sub.submittedByName}</strong></span>
                  <span>التاريخ: <strong className="text-gray-700">{formatDate(sub.submittedAt || sub.createdAt)}</strong></span>
                  {sub.reviewedByName && <span>المراجع: <strong className="text-gray-700">{sub.reviewedByName}</strong></span>}
                  {sub.location && <span dir="ltr" className="text-left">GPS: {sub.location.latitude?.toFixed(4)}, {sub.location.longitude?.toFixed(4)}</span>}
                </div>
                {sub.reviewNotes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs mb-3">
                    <strong>ملاحظات المراجعة:</strong> {sub.reviewNotes}
                  </div>
                )}
                <table className="w-full text-sm">
                  <tbody>
                    {sub.answers.filter((a: any) => a.fieldType !== 'SECTION_HEADER' && a.fieldType !== 'SIGNATURE').map((a: any, ai: number) => (
                      <tr key={ai} className="border-b border-gray-100">
                        <td className="py-1.5 text-gray-500 w-2/5">{a.label}</td>
                        <td className="py-1.5 font-medium">
                          {a.fieldType === 'YES_NO' ? (
                            a.value === 'yes' ? 'نعم' : a.value === 'no' ? 'لا' : 'غ/م'
                          ) : (a.fieldType === 'IMAGE_UPLOAD' || a.fieldType === 'MULTIPLE_IMAGES') ? (
                            <span className="text-blue-600">[{(a.value || '').split(',').filter(Boolean).length} صورة مرفقة]</span>
                          ) : a.value || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-blue-600 pt-4 text-center text-xs text-gray-400">
          <p>تم إنشاء هذا التقرير بواسطة منصة ويفز للتقارير | Waves Reporting Platform</p>
          <p className="mt-1">{new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          @page { margin: 1.5cm; size: A4; }
        }
      `}</style>
    </div>
  );
}
