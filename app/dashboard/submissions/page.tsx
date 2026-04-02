'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getStatusColor, getStatusLabel, formatDateTime } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Search, ClipboardList, Loader2, FileText, MapPin, Eye,
  CheckCircle, XCircle, Clock, X, ZoomIn, Filter, Trash2,
} from 'lucide-react';

interface Submission {
  id: string;
  status: string;
  createdAt: string;
  submittedAt: string | null;
  formTemplate: { id: string; name: string; type: string };
  project: { id: string; name: string; clientName: string };
  submittedBy: { id: string; name: string; email: string };
  location: { latitude: number; longitude: number } | null;
  _count: { answers: number; files: number };
}

export default function SubmissionsPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const canReview = ['SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'].includes(userRole);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showDetail, setShowDetail] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [personFilter, setPersonFilter] = useState('ALL');
  const [formFilter, setFormFilter] = useState('ALL');
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchSubmissions = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      const res = await fetch(`/api/submissions?${params.toString()}`);
      if (res.ok) setSubmissions(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubmissions(); }, [statusFilter]);

  // Unique persons and forms for filters
  const uniquePersons = Array.from(new Map(submissions.map(s => [s.submittedBy.id, s.submittedBy])).values());
  const uniqueForms = Array.from(new Map(submissions.map(s => [s.formTemplate.id, s.formTemplate])).values());

  const filtered = submissions.filter((s) => {
    const matchSearch = s.formTemplate.name.includes(search) ||
      s.project.name.includes(search) ||
      s.submittedBy.name.includes(search) ||
      s.project.clientName.includes(search);
    const matchPerson = personFilter === 'ALL' || s.submittedBy.id === personFilter;
    const matchForm = formFilter === 'ALL' || s.formTemplate.id === formFilter;
    return matchSearch && matchPerson && matchForm;
  });

  const openDetail = async (sub: Submission) => {
    setShowDetail(true);
    setDetailLoading(true);
    setReviewNotes('');
    try {
      const res = await fetch(`/api/submissions/${sub.id}`);
      if (res.ok) setSelectedSub(await res.json());
    } catch (e) {
      console.error(e);
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

  const deleteSubmission = async () => {
    if (!selectedSub) return;
    if (!confirm('هل أنت متأكد من حذف هذا التقرير؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/submissions/${selectedSub.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: 'تم', description: 'تم حذف التقرير بنجاح' });
        setShowDetail(false);
        fetchSubmissions();
      } else {
        const err = await res.json();
        toast({ title: 'خطأ', description: err.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء حذف التقرير', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التقارير المُرسلة</h1>
          <p className="text-gray-500 text-sm mt-1">جميع التقارير الميدانية المُقدمة</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="بحث في التقارير..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 h-11" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 h-11">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">جميع الحالات</SelectItem>
            <SelectItem value="DRAFT">مسودة</SelectItem>
            <SelectItem value="SUBMITTED">مُرسل</SelectItem>
            <SelectItem value="REVIEWED">تمت المراجعة</SelectItem>
            <SelectItem value="APPROVED">معتمد</SelectItem>
            <SelectItem value="REJECTED">مرفوض</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={personFilter} onValueChange={setPersonFilter}>
          <SelectTrigger className="w-full sm:w-56 h-11">
            <SelectValue placeholder="فرز حسب الشخص" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">جميع الأشخاص</SelectItem>
            {uniquePersons.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={formFilter} onValueChange={setFormFilter}>
          <SelectTrigger className="w-full sm:w-56 h-11">
            <SelectValue placeholder="فرز حسب الاستمارة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">جميع الاستمارات</SelectItem>
            {uniqueForms.map((f) => (
              <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-waves-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ClipboardList className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد تقارير</h3>
            <p className="text-gray-500 text-sm">لم يتم إرسال أي تقارير بعد</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((sub) => (
            <Card key={sub.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(sub)}>
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-waves-600 shrink-0" />
                      <h3 className="font-medium text-gray-900 truncate">{sub.formTemplate.name}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                      <span>{sub.project.name}</span>
                      <span className="text-gray-300">|</span>
                      <span>{sub.project.clientName}</span>
                      <span className="text-gray-300">|</span>
                      <span>{sub.submittedBy.name}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{formatDateTime(sub.submittedAt || sub.createdAt)}</span>
                      {sub.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          GPS
                        </span>
                      )}
                      <span>{sub._count.answers} إجابات</span>
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
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل التقرير</DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-waves-600" />
            </div>
          ) : selectedSub ? (
            <div className="space-y-6">
              {/* Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500">النموذج</p><p className="font-medium">{selectedSub.formTemplate?.name}</p></div>
                <div><p className="text-gray-500">المشروع</p><p className="font-medium">{selectedSub.project?.name}</p></div>
                <div><p className="text-gray-500">المُرسل</p><p className="font-medium">{selectedSub.submittedBy?.name}</p></div>
                <div><p className="text-gray-500">الحالة</p><p className="font-medium"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs ${getStatusColor(selectedSub.status)}`}>{getStatusLabel(selectedSub.status)}</span></p></div>
                <div><p className="text-gray-500">تاريخ الإرسال</p><p className="font-medium">{formatDateTime(selectedSub.submittedAt || selectedSub.createdAt)}</p></div>
                {selectedSub.location && (
                  <div><p className="text-gray-500">الموقع</p><p className="font-medium text-xs" dir="ltr">{selectedSub.location.latitude?.toFixed(6)}, {selectedSub.location.longitude?.toFixed(6)}</p></div>
                )}
              </div>

              {/* Answers */}
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

              {/* Review Section */}
              {canReview && selectedSub.status !== 'APPROVED' && selectedSub.status !== 'DRAFT' && (
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
                      <Clock className="w-4 h-4 ml-2" />
                      تمت المراجعة
                    </Button>
                    <Button onClick={() => updateStatus('REJECTED')} disabled={updating} variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                      <XCircle className="w-4 h-4 ml-2" />
                      رفض
                    </Button>
                  </div>
                </div>
              )}

              {selectedSub.reviewedBy && (
                <div className="text-xs text-gray-400 border-t pt-3">
                  تمت المراجعة بواسطة {selectedSub.reviewedBy.name} • {formatDateTime(selectedSub.reviewedAt)}
                </div>
              )}

              {canReview && (
                <div className="border-t pt-4">
                  <Button onClick={deleteSubmission} disabled={updating} variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700">
                    {updating ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Trash2 className="w-4 h-4 ml-2" />}
                    حذف التقرير
                  </Button>
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
          <img src={lightboxImg} alt="صورة" className="max-w-full max-h-[90vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
