'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getStatusColor, getStatusLabel, getFormTypeLabel, formatDate, formatDateTime, getRoleLabel } from '@/lib/utils';
import {
  ArrowRight, FileText, Users, MapPin, Calendar,
  ClipboardList, Loader2, FolderKanban, Plus, Settings2,
  Eye, Trash2, UserPlus, CheckCircle, XCircle, Clock, ZoomIn, X, Download,
} from 'lucide-react';

export default function ProjectDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const { toast } = useToast();
  const userRole = (session?.user as any)?.role;
  const canManage = ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(userRole);

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [subsLoading, setSubsLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  // Submission detail
  const [showDetail, setShowDetail] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [supervisorFilter, setSupervisorFilter] = useState('ALL');

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

  const fetchSubmissions = async () => {
    setSubsLoading(true);
    try {
      const res = await fetch(`/api/submissions?projectId=${params.id}`);
      if (res.ok) setSubmissions(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setSubsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) setAllUsers(await res.json());
    } catch (e) { /* ignore if no permission */ }
  };

  useEffect(() => {
    if (params.id) {
      fetchProject();
      fetchSubmissions();
      fetchUsers();
    }
  }, [params.id]);

  const addMember = async () => {
    if (!selectedUserId) return;
    setAddingMember(true);
    try {
      const res = await fetch(`/api/projects/${params.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId }),
      });
      if (res.ok) {
        toast({ title: 'تم', description: 'تم إضافة العضو بنجاح' });
        setSelectedUserId('');
        fetchProject();
      } else {
        const err = await res.json();
        toast({ title: 'خطأ', description: err.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' });
    } finally {
      setAddingMember(false);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm('هل تريد إزالة هذا العضو من المشروع؟')) return;
    try {
      const res = await fetch(`/api/projects/${params.id}/members?memberId=${memberId}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'تم', description: 'تم إزالة العضو' });
        fetchProject();
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' });
    }
  };

  const openDetail = async (sub: any) => {
    setShowDetail(true);
    setDetailLoading(true);
    setReviewNotes('');
    setSelectedSub(null);
    try {
      const res = await fetch(`/api/submissions/${sub.id}`);
      if (res.ok) {
        setSelectedSub(await res.json());
      } else {
        toast({ title: 'خطأ', description: 'فشل في تحميل التقرير', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' });
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!selectedSub) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/submissions/${selectedSub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reviewNotes }),
      });
      if (res.ok) {
        toast({ title: 'تم', description: `تم تحديث الحالة إلى ${getStatusLabel(status)}` });
        setShowDetail(false);
        fetchSubmissions();
      } else {
        const err = await res.json();
        toast({ title: 'خطأ', description: err.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  // Filter users not already in project
  const memberUserIds = new Set(project?.members?.map((m: any) => m.user?.id || m.userId) || []);
  const availableUsers = allUsers.filter((u: any) => !memberUserIds.has(u.id) && u.isActive);

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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {canManage && (
            <Button variant="outline" size="sm" onClick={() => window.open(`/dashboard/projects/${project.id}/report`, '_blank')}>
              <Download className="w-4 h-4 ml-1" />تصدير PDF
            </Button>
          )}
        </div>
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

        {/* Overview Tab */}
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

        {/* Forms Tab */}
        <TabsContent value="forms">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{project.formTemplates?.length || 0} نموذج</p>
              {canManage && (
                <Link href={`/dashboard/projects/${project.id}/forms`}>
                  <Button size="sm" variant="outline"><Plus className="w-4 h-4 ml-1" />إضافة نموذج</Button>
                </Link>
              )}
            </div>
            {project.formTemplates?.length === 0 ? (
              <Card><CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-3">لا توجد نماذج في هذا المشروع</p>
                {canManage && (
                  <Link href={`/dashboard/projects/${project.id}/forms`}>
                    <Button className="bg-waves-600 hover:bg-waves-700"><Plus className="w-4 h-4 ml-1" />إنشاء نموذج</Button>
                  </Link>
                )}
              </CardContent></Card>
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
                    <div className="flex items-center gap-2">
                      <div className="text-left ml-2">
                        <p className="text-lg font-bold text-gray-900">{form._count?.submissions || 0}</p>
                        <p className="text-xs text-gray-400">تقرير</p>
                      </div>
                      <Link href={`/dashboard/projects/${project.id}/forms`} onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline"><Settings2 className="w-4 h-4" /></Button>
                      </Link>
                      <Link href={`/dashboard/projects/${project.id}/submit/${form.id}`}>
                        <Button size="sm" className="bg-waves-600 hover:bg-waves-700">تقديم تقرير</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Submissions Tab */}
        <TabsContent value="submissions">
          <div className="space-y-3">
            {(() => {
              const uniqueSupervisors = Array.from(new Map(submissions.map((s: any) => [s.submittedBy?.id, s.submittedBy])).values()).filter(Boolean);
              const filteredSubs = supervisorFilter === 'ALL' ? submissions : submissions.filter((s: any) => s.submittedBy?.id === supervisorFilter);
              return (<>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <p className="text-sm text-gray-500">{filteredSubs.length} تقرير</p>
              {uniqueSupervisors.length > 1 && (
                <Select value={supervisorFilter} onValueChange={setSupervisorFilter}>
                  <SelectTrigger className="w-full sm:w-56 h-10">
                    <SelectValue placeholder="فرز حسب المشرف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">جميع المشرفين</SelectItem>
                    {uniqueSupervisors.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {subsLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-waves-600" /></div>
            ) : filteredSubs.length === 0 ? (
              <Card><CardContent className="py-12 text-center">
                <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">لا توجد تقارير مُرسلة لهذا المشروع بعد</p>
              </CardContent></Card>
            ) : (
              filteredSubs.map((sub: any) => (
                <Card key={sub.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(sub)}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-waves-600 shrink-0" />
                          <h4 className="font-medium text-gray-900 truncate">{sub.formTemplate?.name}</h4>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                          <span>{sub.submittedBy?.name}</span>
                          <span className="text-gray-300">|</span>
                          <span>{formatDateTime(sub.submittedAt || sub.createdAt)}</span>
                          {sub.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />GPS</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(sub.status)}`}>
                          {getStatusLabel(sub.status)}
                        </span>
                        <Eye className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
              </>);
            })()}
          </div>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <div className="space-y-4">
            {canManage && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4" />إضافة عضو للمشروع</h4>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="اختر مستخدم..." /></SelectTrigger>
                      <SelectContent>
                        {availableUsers.length === 0 ? (
                          <SelectItem value="__none" disabled>لا يوجد مستخدمون متاحون</SelectItem>
                        ) : (
                          availableUsers.map((u: any) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.name} ({u.email}) - {getRoleLabel(u.role)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <Button onClick={addMember} disabled={!selectedUserId || addingMember} className="bg-waves-600 hover:bg-waves-700">
                      {addingMember ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : <UserPlus className="w-4 h-4 ml-1" />}
                      إضافة
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {project.members?.length === 0 ? (
                <Card><CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">لم يتم إضافة أعضاء لهذا المشروع بعد</p>
                </CardContent></Card>
              ) : (
                project.members?.map((m: any) => (
                  <Card key={m.id}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-waves-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-waves-700">{m.user?.name?.charAt(0) || '?'}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{m.user?.name}</h4>
                        <p className="text-xs text-gray-400">{m.user?.email}</p>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{getRoleLabel(m.role || m.user?.role)}</span>
                      {canManage && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => removeMember(m.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Submission Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>تفاصيل التقرير</DialogTitle></DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-waves-600" /></div>
          ) : selectedSub ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500">النموذج</p><p className="font-medium">{selectedSub.formTemplate?.name}</p></div>
                <div><p className="text-gray-500">المشروع</p><p className="font-medium">{selectedSub.project?.name}</p></div>
                <div><p className="text-gray-500">المُرسل</p><p className="font-medium">{selectedSub.submittedBy?.name}</p></div>
                <div><p className="text-gray-500">الحالة</p><span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${getStatusColor(selectedSub.status)}`}>{getStatusLabel(selectedSub.status)}</span></div>
                <div><p className="text-gray-500">تاريخ الإرسال</p><p className="font-medium">{formatDateTime(selectedSub.submittedAt || selectedSub.createdAt)}</p></div>
                {selectedSub.location && (
                  <div><p className="text-gray-500">الموقع</p><p className="font-medium text-xs" dir="ltr">{selectedSub.location.latitude?.toFixed(6)}, {selectedSub.location.longitude?.toFixed(6)}</p></div>
                )}
              </div>

              {selectedSub.formTemplate?.sections?.map((section: any) => (
                <div key={section.id} className="space-y-3">
                  <h3 className="font-bold text-gray-800 border-b pb-2">{section.title}</h3>
                  {section.fields?.map((field: any) => {
                    const answer = selectedSub.answers?.find((a: any) => a.fieldId === field.id);
                    if (!answer && field.fieldType === 'SECTION_HEADER') return null;
                    const isImage = field.fieldType === 'IMAGE_UPLOAD' || field.fieldType === 'MULTIPLE_IMAGES';
                    return (
                      <div key={field.id} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 text-sm">
                        <span className="text-gray-500 sm:w-1/3 shrink-0">{field.label}</span>
                        <span className="font-medium text-gray-900 sm:w-2/3">
                          {isImage && answer?.value ? (
                            <div className="flex flex-wrap gap-2">
                              {answer.value.split(',').map((img: string, idx: number) => {
                                const raw = img.trim();
                                const src = raw.startsWith('/api/uploads/') ? raw : raw.startsWith('/uploads/') ? `/api/uploads/${raw.replace('/uploads/', '')}` : raw.startsWith('/') ? raw : `/api/uploads/${raw}`;
                                return (
                                  <div key={idx} className="relative group cursor-pointer" onClick={() => setLightboxImg(src)}>
                                    <img src={src} alt={field.label} className="w-20 h-20 object-cover rounded-lg border hover:opacity-80 transition-opacity" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-lg">
                                      <ZoomIn className="w-5 h-5 text-white" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : field.fieldType === 'YES_NO' && answer?.value ? (
                            answer.value === 'yes' ? <span className="text-emerald-600">نعم ✓</span> :
                            answer.value === 'no' ? <span className="text-red-600">لا ✗</span> :
                            <span className="text-gray-400">غ/م</span>
                          ) : answer?.value || <span className="text-gray-300">-</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Attached Files */}
              {selectedSub.files && selectedSub.files.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bold text-gray-800 border-b pb-2">المرفقات ({selectedSub.files.length})</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedSub.files.map((file: any) => {
                      const isImg = file.fileType?.startsWith('image/');
                      const rawSrc = file.fileUrl || `/uploads/${file.fileName}`;
                      const src = rawSrc.startsWith('/api/uploads/') ? rawSrc : rawSrc.startsWith('/uploads/') ? `/api/uploads/${rawSrc.replace('/uploads/', '')}` : rawSrc;
                      return isImg ? (
                        <div key={file.id} className="relative group cursor-pointer" onClick={() => setLightboxImg(src)}>
                          <img src={src} alt={file.fileName} className="w-20 h-20 object-cover rounded-lg border hover:opacity-80 transition-opacity" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-lg">
                            <ZoomIn className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      ) : (
                        <a key={file.id} href={src} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-gray-50 border rounded-lg text-sm text-gray-700 hover:bg-gray-100">
                          <FileText className="w-4 h-4" />{file.fileName}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {canManage && selectedSub.status !== 'APPROVED' && selectedSub.status !== 'DRAFT' && (
                <div className="border-t pt-4 space-y-3">
                  <h3 className="font-bold text-gray-800">مراجعة التقرير</h3>
                  <div className="space-y-2">
                    <Label>ملاحظات المراجعة</Label>
                    <Textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="أضف ملاحظاتك هنا..." rows={3} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => updateStatus('APPROVED')} disabled={updating} className="bg-emerald-600 hover:bg-emerald-700">
                      {updating ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <CheckCircle className="w-4 h-4 ml-2" />}
                      اعتماد
                    </Button>
                    <Button onClick={() => updateStatus('REVIEWED')} disabled={updating} variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                      <Clock className="w-4 h-4 ml-2" />تمت المراجعة
                    </Button>
                    <Button onClick={() => updateStatus('REJECTED')} disabled={updating} variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                      <XCircle className="w-4 h-4 ml-2" />رفض
                    </Button>
                  </div>
                </div>
              )}

              {selectedSub.reviewedBy && (
                <div className="text-xs text-gray-400 border-t pt-3">
                  تمت المراجعة بواسطة {selectedSub.reviewedBy.name} • {formatDateTime(selectedSub.reviewedAt)}
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-8">لم يتم العثور على التقرير</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={() => setLightboxImg(null)}>
          <button className="absolute top-4 left-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70 z-10" onClick={() => setLightboxImg(null)}>
            <X className="w-6 h-6" />
          </button>
          <img src={lightboxImg} alt="صورة" className="max-w-full max-h-[90vh] object-contain rounded-lg" onClick={(e: React.MouseEvent) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
