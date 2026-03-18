'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart3, TrendingUp, Users, FileText, MapPin, Camera, CheckCircle2,
  AlertTriangle, Calendar, FolderKanban,
} from 'lucide-react';

const metrics = [
  { title: 'إجمالي التقارير', value: '347', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  { title: 'تقارير التركيب', value: '145', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { title: 'تقارير التفعيل', value: '122', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  { title: 'تقارير الإزالة', value: '52', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  { title: 'زيارات ميدانية', value: '289', icon: MapPin, color: 'text-red-600', bg: 'bg-red-50' },
  { title: 'صور مرفوعة', value: '1,247', icon: Camera, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { title: 'المشرفون النشطون', value: '24', icon: Users, color: 'text-teal-600', bg: 'bg-teal-50' },
  { title: 'المشاريع النشطة', value: '12', icon: FolderKanban, color: 'text-orange-600', bg: 'bg-orange-50' },
];

const monthlyData = [
  { month: 'يناير', installations: 12, activations: 8, dismantling: 4 },
  { month: 'فبراير', installations: 18, activations: 15, dismantling: 6 },
  { month: 'مارس', installations: 25, activations: 20, dismantling: 8 },
  { month: 'أبريل', installations: 22, activations: 18, dismantling: 7 },
  { month: 'مايو', installations: 30, activations: 25, dismantling: 10 },
  { month: 'يونيو', installations: 28, activations: 22, dismantling: 12 },
];

const topIssues = [
  { issue: 'تأخر وصول المواد', count: 23 },
  { issue: 'عدم مطابقة التصميم', count: 18 },
  { issue: 'مشاكل في التوصيلات الكهربائية', count: 15 },
  { issue: 'عدم جاهزية الموقع', count: 12 },
  { issue: 'نقص في معدات السلامة', count: 9 },
];

const completionRates = [
  { label: 'قوائم التحقق مكتملة', value: 87 },
  { label: 'تقارير معتمدة', value: 72 },
  { label: 'تقارير بصور مرفقة', value: 91 },
  { label: 'تقارير بموقع GPS', value: 68 },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">التحليلات</h1>
        <p className="text-gray-500 text-sm mt-1">نظرة شاملة على أداء التقارير الميدانية</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map((m) => (
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
              التقارير الشهرية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyData.map((d) => (
                <div key={d.month} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 w-16">{d.month}</span>
                    <span className="text-xs text-gray-400">
                      {d.installations + d.activations + d.dismantling} تقرير
                    </span>
                  </div>
                  <div className="flex h-5 rounded-full overflow-hidden bg-gray-100 gap-0.5">
                    <div className="bg-blue-500 rounded-r-full" style={{ width: `${(d.installations / 50) * 100}%` }} />
                    <div className="bg-emerald-500" style={{ width: `${(d.activations / 50) * 100}%` }} />
                    <div className="bg-amber-500 rounded-l-full" style={{ width: `${(d.dismantling / 50) * 100}%` }} />
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-4 pt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500" />تركيب</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" />تفعيل</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500" />إزالة</span>
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
            {completionRates.map((r) => (
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
          </CardContent>
        </Card>

        {/* Top Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-waves-600" />
              أبرز المشاكل المتكررة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topIssues.map((issue, i) => (
                <div key={issue.issue} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{issue.issue}</p>
                  </div>
                  <span className="text-sm font-medium text-gray-900 shrink-0">{issue.count} مرة</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Supervisor Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-waves-600" />
              نشاط المشرفين (هذا الشهر)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: 'خالد عبدالله', submissions: 42, projects: 5 },
                { name: 'أحمد محمد', submissions: 38, projects: 4 },
                { name: 'سارة علي', submissions: 35, projects: 3 },
                { name: 'فهد سالم', submissions: 28, projects: 4 },
                { name: 'نورة حسن', submissions: 22, projects: 2 },
              ].map((sup) => (
                <div key={sup.name} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-waves-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-waves-700">{sup.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{sup.name}</p>
                    <p className="text-xs text-gray-400">{sup.projects} مشاريع</p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-sm font-bold text-gray-900">{sup.submissions}</p>
                    <p className="text-xs text-gray-400">تقرير</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
