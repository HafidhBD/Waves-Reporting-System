'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getRoleLabel, getStatusColor, getStatusLabel, formatDateTime } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import {
  FolderKanban,
  FileText,
  Users,
  ClipboardCheck,
  Calendar,
} from 'lucide-react';

interface DashboardData {
  stats: {
    activeProjects: number;
    totalProjects: number;
    totalSubmissions: number;
    todaySubmissions: number;
    pendingReview: number;
    totalUsers: number;
    activeUsers: number;
    weekSubmissions: number;
  };
  statusBreakdown: {
    draft: number;
    submitted: number;
    reviewed: number;
    approved: number;
    rejected: number;
  };
  recentSubmissions: Array<{
    id: string;
    status: string;
    createdAt: string;
    formTemplate: { name: string; type: string };
    project: { name: string; clientName: string };
    submittedBy: { name: string };
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) setData(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statsItems = data ? [
    { title: 'المشاريع النشطة', value: data.stats.activeProjects, sub: `${data.stats.totalProjects} إجمالي`, icon: FolderKanban, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'إجمالي التقارير', value: data.stats.totalSubmissions, sub: `${data.stats.todaySubmissions} اليوم`, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'بانتظار المراجعة', value: data.stats.pendingReview, sub: 'تقارير مُرسلة', icon: ClipboardCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'المستخدمون', value: data.stats.totalUsers, sub: `${data.stats.activeUsers} نشط`, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            مرحباً، {session?.user?.name || 'المستخدم'}
          </h1>
          <p className="text-gray-500 mt-1">
            {getRoleLabel((session?.user as any)?.role || 'VIEWER')} • لوحة التحكم الرئيسية
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-waves-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statsItems.map((stat) => (
              <Card key={stat.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
                    </div>
                    <div className={`p-3 rounded-xl ${stat.bg}`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Status Breakdown */}
          {data?.statusBreakdown && data.stats.totalSubmissions > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">توزيع حالات التقارير</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: 'معتمد', count: data.statusBreakdown.approved, color: 'bg-emerald-500', textColor: 'text-emerald-700' },
                    { label: 'تمت المراجعة', count: data.statusBreakdown.reviewed, color: 'bg-purple-500', textColor: 'text-purple-700' },
                    { label: 'مُرسل (بانتظار المراجعة)', count: data.statusBreakdown.submitted, color: 'bg-amber-500', textColor: 'text-amber-700' },
                    { label: 'مسودة', count: data.statusBreakdown.draft, color: 'bg-gray-400', textColor: 'text-gray-600' },
                    { label: 'مرفوض', count: data.statusBreakdown.rejected, color: 'bg-red-500', textColor: 'text-red-700' },
                  ].map((item) => {
                    const pct = data.stats.totalSubmissions > 0 ? Math.round((item.count / data.stats.totalSubmissions) * 100) : 0;
                    return (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className={`text-sm w-40 shrink-0 ${item.textColor}`}>{item.label}</span>
                        <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm font-bold text-gray-700 w-16 text-left">{item.count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-3 border-t flex items-center justify-between text-sm text-gray-500">
                  <span>إجمالي التقارير: <strong className="text-gray-900">{data.stats.totalSubmissions}</strong></span>
                  <span>هذا الأسبوع: <strong className="text-gray-900">{data.stats.weekSubmissions}</strong></span>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-waves-600" />
                  آخر التقارير المرسلة
                </CardTitle>
                <Link href="/dashboard/submissions" className="text-sm text-waves-600 hover:underline">
                  عرض الكل
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {data?.recentSubmissions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ClipboardCheck className="w-12 h-12 mx-auto mb-2 text-gray-200" />
                  <p>لا توجد تقارير بعد</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-right">
                        <th className="pb-3 text-sm font-medium text-gray-500">النموذج</th>
                        <th className="pb-3 text-sm font-medium text-gray-500">المشروع</th>
                        <th className="pb-3 text-sm font-medium text-gray-500 hidden sm:table-cell">المُرسل</th>
                        <th className="pb-3 text-sm font-medium text-gray-500">الحالة</th>
                        <th className="pb-3 text-sm font-medium text-gray-500 hidden md:table-cell">الوقت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data?.recentSubmissions.map((sub) => (
                        <tr key={sub.id} className="hover:bg-gray-50/50">
                          <td className="py-3 text-sm font-medium text-gray-900">{sub.formTemplate.name}</td>
                          <td className="py-3 text-sm text-gray-600">{sub.project.name}</td>
                          <td className="py-3 text-sm text-gray-600 hidden sm:table-cell">{sub.submittedBy.name}</td>
                          <td className="py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(sub.status)}`}>
                              {getStatusLabel(sub.status)}
                            </span>
                          </td>
                          <td className="py-3 text-sm text-gray-400 hidden md:table-cell">{formatDateTime(sub.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/dashboard/projects">
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-5 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <FolderKanban className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">إنشاء مشروع جديد</h3>
                  <p className="text-xs text-gray-400 mt-1">ابدأ مشروعاً جديداً مع النماذج الافتراضية</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/projects">
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-5 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                    <FileText className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">تقديم تقرير</h3>
                  <p className="text-xs text-gray-400 mt-1">اختر مشروعاً لتقديم تقرير ميداني</p>
                </CardContent>
              </Card>
            </Link>
            <Link href="/dashboard/submissions">
              <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-5 text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                    <ClipboardCheck className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-medium text-gray-900">عرض التقارير</h3>
                  <p className="text-xs text-gray-400 mt-1">شاهد جميع التقارير المرسلة</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
