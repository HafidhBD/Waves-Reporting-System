'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3, Users, FileText, Camera, CheckCircle2,
  FolderKanban, Loader2, ClipboardCheck, XCircle, Clock,
} from 'lucide-react';

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const userRole = (session?.user as any)?.role;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('ALL');

  useEffect(() => {
    if (session && !['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(userRole)) {
      router.replace('/dashboard');
      return;
    }
  }, [session, userRole, router]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const url = selectedProject === 'ALL' ? '/api/analytics' : `/api/analytics?projectId=${selectedProject}`;
        const res = await fetch(url);
        if (res.ok) setData(await res.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (session) fetchData();
  }, [session, selectedProject]);

  if (!session || !['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(userRole)) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-waves-600" />
      </div>
    );
  }

  if (!data) return <div className="text-center py-20 text-gray-400">فشل في تحميل البيانات</div>;

  const { metrics, monthlyData, topSupervisors, completionRates, projects } = data;

  const metricsItems = [
    { title: 'إجمالي التقارير', value: metrics.totalSubmissions, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'معتمد', value: metrics.approvedCount, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'بانتظار المراجعة', value: metrics.submittedCount, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'مرفوض', value: metrics.rejectedCount, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { title: 'تمت المراجعة', value: metrics.reviewedCount, icon: ClipboardCheck, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'مرفقات', value: metrics.totalFiles, icon: Camera, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'المستخدمون النشطون', value: metrics.activeUsers, icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
    { title: 'المشاريع النشطة', value: metrics.activeProjects, icon: FolderKanban, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  const maxMonthly = Math.max(...monthlyData.map((d: any) => d.total), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التحليلات</h1>
          <p className="text-gray-500 text-sm mt-1">نظرة شاملة على أداء التقارير الميدانية</p>
        </div>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-full sm:w-64 h-10">
            <SelectValue placeholder="جميع المشاريع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">جميع المشاريع</SelectItem>
            {projects?.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metricsItems.map((m) => (
          <Card key={m.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${m.bg}`}>
                  <m.icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{m.title}</p>
                  <p className="text-xl font-bold text-gray-900">{m.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-waves-600" />
              التقارير الشهرية (آخر 6 أشهر)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.map((d: any) => (
                <div key={d.month} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 w-16">{d.month}</span>
                    <span className="text-xs text-gray-400">{d.total} تقرير</span>
                  </div>
                  <div className="flex h-5 rounded-full overflow-hidden bg-gray-100 gap-0.5">
                    {d.approved > 0 && <div className="bg-emerald-500 rounded-r-full" style={{ width: `${(d.approved / maxMonthly) * 100}%` }} />}
                    {d.pending > 0 && <div className="bg-amber-500" style={{ width: `${(d.pending / maxMonthly) * 100}%` }} />}
                    {d.rejected > 0 && <div className="bg-red-500 rounded-l-full" style={{ width: `${(d.rejected / maxMonthly) * 100}%` }} />}
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-4 pt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" />معتمد</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500" />قيد المراجعة</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500" />مرفوض</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completion Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-waves-600" />
              معدلات الإنجاز
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { label: 'نسبة الاعتماد', value: completionRates.approvalRate },
              { label: 'نسبة المراجعة', value: completionRates.reviewRate },
            ].map((r) => (
              <div key={r.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{r.label}</span>
                  <span className="font-bold text-gray-900">{r.value}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      r.value >= 80 ? 'bg-emerald-500' : r.value >= 60 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${r.value}%` }}
                  />
                </div>
              </div>
            ))}

            {/* Status breakdown */}
            <div className="pt-4 border-t space-y-3">
              <p className="text-sm font-medium text-gray-700">توزيع الحالات</p>
              {[
                { label: 'معتمد', count: metrics.approvedCount, color: 'bg-emerald-500' },
                { label: 'تمت المراجعة', count: metrics.reviewedCount, color: 'bg-purple-500' },
                { label: 'مُرسل', count: metrics.submittedCount, color: 'bg-amber-500' },
                { label: 'مسودة', count: metrics.draftCount, color: 'bg-gray-400' },
                { label: 'مرفوض', count: metrics.rejectedCount, color: 'bg-red-500' },
              ].map((s) => {
                const pct = metrics.totalSubmissions > 0 ? Math.round((s.count / metrics.totalSubmissions) * 100) : 0;
                return (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded ${s.color}`} />
                    <span className="text-xs text-gray-600 flex-1">{s.label}</span>
                    <span className="text-xs font-medium text-gray-800">{s.count} ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Supervisor Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-waves-600" />
              أكثر المشرفين نشاطاً
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topSupervisors.length === 0 ? (
              <p className="text-center py-4 text-gray-400 text-sm">لا توجد بيانات</p>
            ) : (
              <div className="space-y-3">
                {topSupervisors.map((sup: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-waves-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-waves-700">{sup.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{sup.name}</p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-sm font-bold text-gray-900">{sup.count}</p>
                      <p className="text-xs text-gray-400">تقرير</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Projects Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-waves-600" />
              المشاريع
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projects?.length === 0 ? (
              <p className="text-center py-4 text-gray-400 text-sm">لا توجد مشاريع</p>
            ) : (
              <div className="space-y-3">
                {projects?.slice(0, 5).map((p: any) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className={`w-2 h-8 rounded-full ${p.status === 'ACTIVE' ? 'bg-emerald-500' : p.status === 'COMPLETED' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">{p._count.formTemplates} نموذج</p>
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-sm font-bold text-gray-900">{p._count.submissions}</p>
                      <p className="text-xs text-gray-400">تقرير</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
