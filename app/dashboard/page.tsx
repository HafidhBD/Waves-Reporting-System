'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getRoleLabel } from '@/lib/utils';
import {
  FolderKanban,
  FileText,
  Users,
  ClipboardCheck,
  TrendingUp,
  Calendar,
  MapPin,
  Activity,
} from 'lucide-react';

const stats = [
  { title: 'المشاريع النشطة', value: '12', change: '+2 هذا الشهر', icon: FolderKanban, color: 'text-blue-600', bg: 'bg-blue-50' },
  { title: 'إجمالي التقارير', value: '347', change: '+28 هذا الأسبوع', icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { title: 'تقارير اليوم', value: '8', change: '3 بانتظار المراجعة', icon: ClipboardCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
  { title: 'المشرفون النشطون', value: '24', change: '18 في الميدان', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
];

const recentSubmissions = [
  { id: '1', form: 'تقرير تنفيذ التركيب', project: 'معرض الرياض الدولي', user: 'أحمد محمد', status: 'SUBMITTED', time: 'منذ 15 دقيقة' },
  { id: '2', form: 'تقرير التفعيل الميداني', project: 'فعالية موسم جدة', user: 'سارة علي', status: 'APPROVED', time: 'منذ ساعة' },
  { id: '3', form: 'تقرير إزالة وفك التركيب', project: 'مؤتمر التقنية', user: 'خالد عبدالله', status: 'REVIEWED', time: 'منذ ساعتين' },
  { id: '4', form: 'تقرير تنفيذ التركيب', project: 'معرض الغذاء', user: 'نورة حسن', status: 'DRAFT', time: 'منذ 3 ساعات' },
  { id: '5', form: 'تقرير التفعيل الميداني', project: 'فعالية اليوم الوطني', user: 'فهد سالم', status: 'REJECTED', time: 'منذ 5 ساعات' },
];

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  REVIEWED: 'bg-purple-100 text-purple-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'مسودة',
  SUBMITTED: 'مُرسل',
  REVIEWED: 'تمت المراجعة',
  APPROVED: 'معتمد',
  REJECTED: 'مرفوض',
};

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submissions Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-waves-600" />
              التقارير المرسلة هذا الأسبوع
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2 px-2">
              {[
                { day: 'السبت', value: 12 },
                { day: 'الأحد', value: 19 },
                { day: 'الاثنين', value: 8 },
                { day: 'الثلاثاء', value: 15 },
                { day: 'الأربعاء', value: 22 },
                { day: 'الخميس', value: 18 },
                { day: 'الجمعة', value: 5 },
              ].map((item) => (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-medium text-gray-900">{item.value}</span>
                  <div
                    className="w-full bg-waves-500 rounded-t-md transition-all hover:bg-waves-600"
                    style={{ height: `${(item.value / 25) * 200}px` }}
                  />
                  <span className="text-xs text-gray-500">{item.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Form Types */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-waves-600" />
              التقارير حسب النوع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'تقارير التركيب', count: 145, percent: 42, color: 'bg-blue-500' },
              { name: 'تقارير التفعيل', count: 122, percent: 35, color: 'bg-emerald-500' },
              { name: 'تقارير الإزالة', count: 52, percent: 15, color: 'bg-amber-500' },
              { name: 'نماذج مخصصة', count: 28, percent: 8, color: 'bg-purple-500' },
            ].map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{item.name}</span>
                  <span className="font-medium text-gray-900">{item.count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Submissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-waves-600" />
              آخر التقارير المرسلة
            </CardTitle>
            <a href="/dashboard/submissions" className="text-sm text-waves-600 hover:underline">
              عرض الكل
            </a>
          </div>
        </CardHeader>
        <CardContent>
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
                {recentSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50/50">
                    <td className="py-3 text-sm font-medium text-gray-900">{sub.form}</td>
                    <td className="py-3 text-sm text-gray-600">{sub.project}</td>
                    <td className="py-3 text-sm text-gray-600 hidden sm:table-cell">{sub.user}</td>
                    <td className="py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[sub.status]}`}>
                        {statusLabels[sub.status]}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-gray-400 hidden md:table-cell">{sub.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer group">
          <CardContent className="p-5 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <FolderKanban className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-medium text-gray-900">إنشاء مشروع جديد</h3>
            <p className="text-xs text-gray-400 mt-1">ابدأ مشروعاً جديداً مع النماذج الافتراضية</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer group">
          <CardContent className="p-5 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <FileText className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-medium text-gray-900">تقديم تقرير</h3>
            <p className="text-xs text-gray-400 mt-1">أرسل تقريراً ميدانياً من المشروع</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer group">
          <CardContent className="p-5 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-medium text-gray-900">عرض الخريطة</h3>
            <p className="text-xs text-gray-400 mt-1">شاهد مواقع التقارير على الخريطة</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
