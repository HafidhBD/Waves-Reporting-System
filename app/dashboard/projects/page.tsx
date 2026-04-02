'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getStatusColor, getStatusLabel, formatDate } from '@/lib/utils';
import {
  Plus,
  Search,
  FolderKanban,
  MapPin,
  Calendar,
  Users,
  FileText,
  ChevronLeft,
  Loader2,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  clientName: string;
  projectCode: string;
  city: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  createdAt: string;
  _count: { formTemplates: number; submissions: number };
  members: Array<{ user: { name: string } }>;
}

export default function ProjectsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const canCreate = ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(userRole);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '', clientName: '', city: '', location: '', startDate: '', endDate: '', description: '', notes: '',
    enableInstallation: true, enableActivation: true, enableDismantling: true,
  });

  const fetchProjects = async () => {
    try {
      const res = await fetch(`/api/projects${search ? `?search=${search}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [search]);

  const handleCreate = async () => {
    if (!form.name || !form.clientName) {
      toast({ title: 'خطأ', description: 'اسم المشروع واسم العميل مطلوبان', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: 'تم بنجاح', description: 'تم إنشاء المشروع بنجاح' });
        setShowCreate(false);
        setForm({ name: '', clientName: '', city: '', location: '', startDate: '', endDate: '', description: '', notes: '', enableInstallation: true, enableActivation: true, enableDismantling: true });
        fetchProjects();
      } else {
        const err = await res.json();
        toast({ title: 'خطأ', description: err.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ غير متوقع', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المشاريع</h1>
          <p className="text-gray-500 text-sm mt-1">إدارة جميع المشاريع والتقارير الميدانية</p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreate(true)} className="bg-waves-600 hover:bg-waves-700">
            <Plus className="w-4 h-4 ml-2" />
            مشروع جديد
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="بحث في المشاريع..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10 h-11"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-waves-600" />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FolderKanban className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد مشاريع</h3>
            <p className="text-gray-500 text-sm mb-4">ابدأ بإنشاء مشروعك الأول</p>
            {canCreate && (
              <Button onClick={() => setShowCreate(true)} className="bg-waves-600 hover:bg-waves-700">
                <Plus className="w-4 h-4 ml-2" />
                إنشاء مشروع
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <Card className="hover:shadow-lg transition-all hover:border-waves-200 cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{project.name}</h3>
                      <p className="text-sm text-gray-500 truncate">{project.clientName}</p>
                    </div>
                    <Badge className={getStatusColor(project.status)}>
                      {getStatusLabel(project.status)}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{project.projectCode}</span>
                    </div>
                    {project.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{project.city}</span>
                      </div>
                    )}
                    {project.startDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(project.startDate)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        {project._count.formTemplates} نماذج
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {project.members.length} أعضاء
                      </span>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Project Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إنشاء مشروع جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسم المشروع *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="اسم المشروع" />
              </div>
              <div className="space-y-2">
                <Label>اسم العميل *</Label>
                <Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} placeholder="اسم العميل" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المدينة</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="المدينة" />
              </div>
              <div className="space-y-2">
                <Label>الموقع</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="الموقع" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>تاريخ البداية</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>تاريخ النهاية</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="وصف المشروع" />
            </div>
            <div className="space-y-3">
              <Label>النماذج الافتراضية</Label>
              <div className="space-y-2">
                {[
                  { key: 'enableInstallation', label: 'تقرير تنفيذ التركيب' },
                  { key: 'enableActivation', label: 'تقرير التفعيل الميداني' },
                  { key: 'enableDismantling', label: 'تقرير إزالة وفك التركيب' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(form as any)[item.key]}
                      onChange={(e) => setForm({ ...form, [item.key]: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-waves-600 focus:ring-waves-500"
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>إلغاء</Button>
            <Button onClick={handleCreate} disabled={creating} className="bg-waves-600 hover:bg-waves-700">
              {creating ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              إنشاء المشروع
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
