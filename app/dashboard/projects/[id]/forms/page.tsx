'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getStatusColor, getStatusLabel, getFormTypeLabel } from '@/lib/utils';
import {
  Plus, FileText, Loader2, ArrowRight, GripVertical, Trash2,
  Settings2, Eye, Copy, ChevronLeft,
} from 'lucide-react';

const FIELD_TYPES = [
  { value: 'SHORT_TEXT', label: 'نص قصير' },
  { value: 'LONG_TEXT', label: 'نص طويل' },
  { value: 'NUMBER', label: 'رقم' },
  { value: 'DATE', label: 'تاريخ' },
  { value: 'TIME', label: 'وقت' },
  { value: 'DATETIME', label: 'تاريخ ووقت' },
  { value: 'SINGLE_SELECT', label: 'اختيار واحد' },
  { value: 'MULTI_SELECT', label: 'اختيار متعدد' },
  { value: 'DROPDOWN', label: 'قائمة منسدلة' },
  { value: 'RADIO', label: 'أزرار اختيار' },
  { value: 'CHECKBOX_LIST', label: 'قائمة تحقق' },
  { value: 'YES_NO', label: 'نعم / لا' },
  { value: 'RATING', label: 'تقييم' },
  { value: 'FILE_UPLOAD', label: 'رفع ملف' },
  { value: 'IMAGE_UPLOAD', label: 'رفع صورة' },
  { value: 'MULTIPLE_IMAGES', label: 'صور متعددة' },
  { value: 'SIGNATURE', label: 'توقيع' },
  { value: 'GPS_LOCATION', label: 'موقع GPS' },
  { value: 'HIDDEN', label: 'حقل مخفي' },
  { value: 'CALCULATED', label: 'حقل محسوب' },
  { value: 'READONLY_INFO', label: 'معلومات للقراءة فقط' },
  { value: 'SECTION_HEADER', label: 'عنوان قسم' },
  { value: 'REPEATER_GROUP', label: 'مجموعة مكررة' },
  { value: 'CHECKLIST_BLOCK', label: 'كتلة قائمة تحقق' },
];

interface FormSection {
  id: string;
  title: string;
  titleEn: string;
  fields: FormField[];
}

interface FormField {
  id: string;
  label: string;
  labelEn: string;
  fieldType: string;
  isRequired: boolean;
  placeholder: string;
  helpText: string;
}

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [forms, setForms] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);
  const [editingForm, setEditingForm] = useState<any>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newForm, setNewForm] = useState({
    name: '',
    nameEn: '',
    description: '',
    type: 'custom',
  });

  const [sections, setSections] = useState<FormSection[]>([
    {
      id: 'section-1',
      title: 'القسم الأول',
      titleEn: 'Section 1',
      fields: [],
    },
  ]);

  useEffect(() => {
    const fetchForms = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/projects/${params.id}`);
        if (res.ok) {
          const project = await res.json();
          setForms(project.formTemplates || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (params.id) fetchForms();
  }, [params.id]);

  const addSection = () => {
    const newId = `section-${Date.now()}`;
    setSections([...sections, { id: newId, title: '', titleEn: '', fields: [] }]);
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter((s) => s.id !== sectionId));
  };

  const addField = (sectionId: string) => {
    const newId = `field-${Date.now()}`;
    setSections(sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            fields: [...s.fields, {
              id: newId, label: '', labelEn: '', fieldType: 'SHORT_TEXT',
              isRequired: false, placeholder: '', helpText: '',
            }],
          }
        : s
    ));
  };

  const removeField = (sectionId: string, fieldId: string) => {
    setSections(sections.map((s) =>
      s.id === sectionId
        ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) }
        : s
    ));
  };

  const updateField = (sectionId: string, fieldId: string, key: string, value: any) => {
    setSections(sections.map((s) =>
      s.id === sectionId
        ? { ...s, fields: s.fields.map((f) => f.id === fieldId ? { ...f, [key]: value } : f) }
        : s
    ));
  };

  const updateSection = (sectionId: string, key: string, value: string) => {
    setSections(sections.map((s) => s.id === sectionId ? { ...s, [key]: value } : s));
  };

  const loadFormForEdit = async (form: any) => {
    try {
      const res = await fetch(`/api/forms/${form.id}`);
      if (res.ok) {
        const data = await res.json();
        setEditingForm(data);
        setNewForm({ name: data.name, nameEn: data.nameEn || '', description: data.description || '', type: data.type || 'custom' });
        const loadedSections = data.sections?.map((s: any) => ({
          id: s.id,
          title: s.title || '',
          titleEn: s.titleEn || '',
          fields: s.fields?.map((f: any) => ({
            id: f.id,
            label: f.label || '',
            labelEn: f.labelEn || '',
            fieldType: f.fieldType || 'SHORT_TEXT',
            isRequired: f.isRequired || false,
            placeholder: f.placeholder || '',
            helpText: f.helpText || '',
          })) || [],
        })) || [{ id: 'section-1', title: 'القسم الأول', titleEn: 'Section 1', fields: [] }];
        setSections(loadedSections);
        setShowEditForm(true);
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'خطأ', description: 'فشل في تحميل النموذج', variant: 'destructive' });
    }
  };

  const handleUpdateForm = async () => {
    if (!editingForm || !newForm.name) {
      toast({ title: 'خطأ', description: 'اسم النموذج مطلوب', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/forms/${editingForm.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newForm, sections }),
      });
      if (res.ok) {
        toast({ title: 'تم بنجاح', description: 'تم تحديث النموذج بنجاح' });
        setShowEditForm(false);
        setEditingForm(null);
        setNewForm({ name: '', nameEn: '', description: '', type: 'custom' });
        setSections([{ id: 'section-1', title: 'القسم الأول', titleEn: 'Section 1', fields: [] }]);
        const projectRes = await fetch(`/api/projects/${params.id}`);
        if (projectRes.ok) {
          const project = await projectRes.json();
          setForms(project.formTemplates || []);
        }
      } else {
        const err = await res.json();
        toast({ title: 'خطأ', description: err.error || 'حدث خطأ', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ غير متوقع', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateForm = async () => {
    if (!newForm.name) {
      toast({ title: 'خطأ', description: 'اسم النموذج مطلوب', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(`/api/projects/${params.id}/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newForm, sections }),
      });
      if (res.ok) {
        toast({ title: 'تم بنجاح', description: 'تم إنشاء النموذج بنجاح' });
        setShowCreateForm(false);
        setNewForm({ name: '', nameEn: '', description: '', type: 'custom' });
        setSections([{ id: 'section-1', title: 'القسم الأول', titleEn: 'Section 1', fields: [] }]);
        const projectRes = await fetch(`/api/projects/${params.id}`);
        if (projectRes.ok) {
          const project = await projectRes.json();
          setForms(project.formTemplates || []);
        }
      } else {
        const err = await res.json();
        toast({ title: 'خطأ', description: err.error || 'حدث خطأ', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ غير متوقع', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
        <Link href="/dashboard/projects" className="hover:text-waves-600">المشاريع</Link>
        <span>/</span>
        <Link href={`/dashboard/projects/${params.id}`} className="hover:text-waves-600">تفاصيل المشروع</Link>
        <span>/</span>
        <span>النماذج</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">منشئ النماذج</h1>
          <p className="text-gray-500 text-sm mt-1">إنشاء وإدارة نماذج التقارير للمشروع</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="bg-waves-600 hover:bg-waves-700">
          <Plus className="w-4 h-4 ml-2" />
          نموذج جديد
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-waves-600" />
        </div>
      ) : forms.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">لا توجد نماذج</h3>
            <p className="text-gray-500 text-sm mb-4">أنشئ نموذجاً مخصصاً جديداً أو فعّل النماذج الافتراضية</p>
            <Button onClick={() => setShowCreateForm(true)} className="bg-waves-600 hover:bg-waves-700">
              <Plus className="w-4 h-4 ml-2" />
              إنشاء نموذج
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {forms.map((form) => (
            <Card key={form.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => loadFormForEdit(form)}>
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
                  <span className="text-sm font-bold text-gray-600">{form._count?.submissions || 0} تقرير</span>
                  <Settings2 className="w-4 h-4 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Form Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إنشاء نموذج مخصص جديد</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Form Info */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">معلومات النموذج</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم النموذج (عربي) *</Label>
                  <Input value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} placeholder="مثال: تقرير الفحص اليومي" />
                </div>
                <div className="space-y-2">
                  <Label>اسم النموذج (إنجليزي)</Label>
                  <Input value={newForm.nameEn} onChange={(e) => setNewForm({ ...newForm, nameEn: e.target.value })} placeholder="e.g. Daily Inspection Report" dir="ltr" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea value={newForm.description} onChange={(e) => setNewForm({ ...newForm, description: e.target.value })} placeholder="وصف مختصر للنموذج..." rows={2} />
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">أقسام النموذج</h3>
                <Button variant="outline" size="sm" onClick={addSection}>
                  <Plus className="w-4 h-4 ml-1" />
                  إضافة قسم
                </Button>
              </div>

              {sections.map((section, si) => (
                <Card key={section.id} className="border-2 border-dashed">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <GripVertical className="w-4 h-4 text-gray-300" />
                        <Input
                          value={section.title}
                          onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                          placeholder={`عنوان القسم ${si + 1}`}
                          className="font-medium border-0 shadow-none p-0 h-auto text-base focus-visible:ring-0"
                        />
                      </div>
                      {sections.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => removeSection(section.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {section.fields.map((field, fi) => (
                      <div key={field.id} className="p-3 bg-gray-50 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">حقل {fi + 1}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => removeField(section.id, field.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2 space-y-1">
                            <Label className="text-xs">التسمية (عربي)</Label>
                            <Input
                              value={field.label}
                              onChange={(e) => updateField(section.id, field.id, 'label', e.target.value)}
                              placeholder="تسمية الحقل"
                              className="h-9 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">نوع الحقل</Label>
                            <Select value={field.fieldType} onValueChange={(v) => updateField(section.id, field.id, 'fieldType', v)}>
                              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {FIELD_TYPES.map((ft) => (
                                  <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={field.isRequired}
                              onChange={(e) => updateField(section.id, field.id, 'isRequired', e.target.checked)}
                              className="w-4 h-4 rounded border-gray-300 text-waves-600"
                            />
                            مطلوب
                          </label>
                        </div>
                      </div>
                    ))}

                    <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => addField(section.id)}>
                      <Plus className="w-4 h-4 ml-1" />
                      إضافة حقل
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>إلغاء</Button>
            <Button onClick={handleCreateForm} disabled={creating} className="bg-waves-600 hover:bg-waves-700">
              {creating && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              إنشاء النموذج
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Edit Form Dialog */}
      <Dialog open={showEditForm} onOpenChange={(open) => { setShowEditForm(open); if (!open) setEditingForm(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل النموذج</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">معلومات النموذج</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم النموذج (عربي) *</Label>
                  <Input value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>اسم النموذج (إنجليزي)</Label>
                  <Input value={newForm.nameEn} onChange={(e) => setNewForm({ ...newForm, nameEn: e.target.value })} dir="ltr" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea value={newForm.description} onChange={(e) => setNewForm({ ...newForm, description: e.target.value })} rows={2} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">أقسام النموذج</h3>
                <Button variant="outline" size="sm" onClick={addSection}>
                  <Plus className="w-4 h-4 ml-1" />
                  إضافة قسم
                </Button>
              </div>

              {sections.map((section, si) => (
                <Card key={section.id} className="border-2 border-dashed">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <GripVertical className="w-4 h-4 text-gray-300" />
                        <Input
                          value={section.title}
                          onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                          placeholder={`عنوان القسم ${si + 1}`}
                          className="font-medium border-0 shadow-none p-0 h-auto text-base focus-visible:ring-0"
                        />
                      </div>
                      {sections.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => removeSection(section.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {section.fields.map((field, fi) => (
                      <div key={field.id} className="p-3 bg-gray-50 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">حقل {fi + 1}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-600" onClick={() => removeField(section.id, field.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2 space-y-1">
                            <Label className="text-xs">التسمية (عربي)</Label>
                            <Input value={field.label} onChange={(e) => updateField(section.id, field.id, 'label', e.target.value)} placeholder="تسمية الحقل" className="h-9 text-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">نوع الحقل</Label>
                            <Select value={field.fieldType} onValueChange={(v) => updateField(section.id, field.id, 'fieldType', v)}>
                              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {FIELD_TYPES.map((ft) => (
                                  <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="checkbox" checked={field.isRequired} onChange={(e) => updateField(section.id, field.id, 'isRequired', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-waves-600" />
                            مطلوب
                          </label>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full border-dashed" onClick={() => addField(section.id)}>
                      <Plus className="w-4 h-4 ml-1" />
                      إضافة حقل
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditForm(false)}>إلغاء</Button>
            <Button onClick={handleUpdateForm} disabled={saving} className="bg-waves-600 hover:bg-waves-700">
              {saving && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
