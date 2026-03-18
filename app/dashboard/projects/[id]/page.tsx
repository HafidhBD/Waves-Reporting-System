'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getStatusColor, getStatusLabel, getFormTypeLabel, formatDate, getRoleLabel } from '@/lib/utils';
import {
  ArrowRight, FileText, Users, MapPin, Calendar,
  ClipboardList, Loader2, FolderKanban,
} from 'lucide-react';

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${params.id}`);
        if (res.ok) setProject(await res.json());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchProject();
  }, [params.id]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-waves-600" /></div>;
  }

  if (!project) {
    return (
      <div className="text-center py-20">
        <FolderKanban className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">المشروع غير موجود</h3>
        <Link href="/dashboard/projects"><Button variant="outline" className="mt-4"><ArrowRight className="w-4 h-4 ml-2" />العودة للمشاريع</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/projects" className="hover:text-waves-600">المشاريع</Link>
          <span>/</span>
          <span>{project.name}</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <span className="text-sm text-gray-500">{project.clientName}</span>
          <Badge className={getStatusColor(project.status)}>{getStatusLabel(project.status)}</Badge>
          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{project.projectCode}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'النماذج', value: project._count?.formTemplates || 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'التقارير', value: project._count?.submissions || 0, icon: ClipboardList, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'الفريق', value: project.members?.length || 0, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'المدينة', value: project.city || '-', icon: MapPin, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}><s.icon className={`w-5 h-5 ${s.color}`} /></div>
              <div>
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className="text-lg font-bold text-gray-900">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="forms" className="space-y-4">
        <TabsList className="bg-white border w-full justify-start overflow-x-auto">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="forms">النماذج</TabsTrigger>
          <TabsTrigger value="submissions">التقارير</TabsTrigger>
          <TabsTrigger value="team">الفريق</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader><CardTitle>تفاصيل المشروع</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">اسم المشروع</p><p className="font-medium">{project.name}</p></div>
                <div><p className="text-sm text-gray-500">اسم العميل</p><p className="font-medium">{project.clientName}</p></div>
                <div><p className="text-sm text-gray-500">رمز المشروع</p><p className="font-medium font-mono">{project.projectCode}</p></div>
                <div><p className="text-sm text-gray-500">المدينة</p><p className="font-medium">{project.city || '-'}</p></div>
                <div><p className="text-sm text-gray-500">تاريخ البداية</p><p className="font-medium">{formatDate(project.startDate)}</p></div>
                <div><p className="text-sm text-gray-500">تاريخ النهاية</p><p className="font-medium">{formatDate(project.endDate)}</p></div>
              </div>
              {project.description && (
                <div><p className="text-sm text-gray-500">الوصف</p><p className="text-sm text-gray-700 mt-1">{project.description}</p></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms">
          <div className="space-y-3">
            {project.formTemplates?.length === 0 ? (
              <Card><CardContent className="py-12 text-center"><FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" /><p className="text-gray-500">لا توجد نماذج في هذا المشروع</p></CardContent></Card>
            ) : (
              project.formTemplates?.map((form: any) => (
                <Card key={form.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-waves-50 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-waves-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{form.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{getFormTypeLabel(form.type)}</span>
                          {form.isDefault && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">افتراضي</span>}
                          <Badge className={getStatusColor(form.status)}>{getStatusLabel(form.status)}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-lg font-bold text-gray-900">{form._count?.submissions || 0}</p>
                      <p className="text-xs text-gray-400">تقرير</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="submissions">
          <Card>
            <CardContent className="py-12 text-center">
              <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-2">عرض جميع التقارير المقدمة لهذا المشروع</p>
              <Link href={`/dashboard/submissions?projectId=${project.id}`}>
                <Button variant="outline">عرض التقارير</Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <div className="space-y-3">
            {project.members?.map((m: any) => (
              <Card key={m.user?.id || m.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-waves-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-waves-700">{m.user?.name?.charAt(0) || '?'}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{m.user?.name}</h4>
                    <p className="text-xs text-gray-400">{m.user?.email}</p>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{getRoleLabel(m.role || m.user?.role)}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
