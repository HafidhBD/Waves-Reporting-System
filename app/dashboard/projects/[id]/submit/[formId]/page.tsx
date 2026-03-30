'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2, ArrowRight, ArrowLeft, MapPin, Camera, Check,
  Send, Save, ChevronLeft,
} from 'lucide-react';

interface FormData {
  id: string;
  name: string;
  sections: Array<{
    id: string;
    title: string;
    fields: Array<{
      id: string;
      label: string;
      labelEn: string | null;
      fieldType: string;
      isRequired: boolean;
      placeholder: string | null;
      helpText: string | null;
    }>;
  }>;
}

export default function SubmitFormPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await fetch(`/api/forms/${params.formId}`);
        if (res.ok) {
          const data = await res.json();
          setForm(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (params.formId) fetchForm();
  }, [params.formId]);

  const setAnswer = (fieldId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const captureGPS = () => {
    if (!navigator.geolocation) {
      toast({ title: 'خطأ', description: 'المتصفح لا يدعم تحديد الموقع', variant: 'destructive' });
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
        toast({ title: 'تم', description: 'تم التقاط الموقع الجغرافي بنجاح' });
      },
      (err) => {
        setGpsLoading(false);
        toast({ title: 'خطأ', description: 'فشل في تحديد الموقع. تأكد من تفعيل خدمات الموقع', variant: 'destructive' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!form) return;

    if (!isDraft) {
      for (const section of form.sections) {
        for (const field of section.fields) {
          if (field.isRequired && !answers[field.id]) {
            toast({ title: 'خطأ', description: `الحقل "${field.label}" مطلوب`, variant: 'destructive' });
            return;
          }
        }
      }
    }

    setSubmitting(true);
    try {
      const answersArray = Object.entries(answers).map(([fieldId, value]) => ({ fieldId, value }));
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formTemplateId: params.formId,
          projectId: params.id,
          answers: answersArray,
          status: isDraft ? 'DRAFT' : 'SUBMITTED',
          latitude: gpsLocation?.lat,
          longitude: gpsLocation?.lng,
        }),
      });

      if (res.ok) {
        toast({ title: isDraft ? 'تم الحفظ' : 'تم الإرسال', description: isDraft ? 'تم حفظ المسودة بنجاح' : 'تم إرسال التقرير بنجاح' });
        router.push(`/dashboard/projects/${params.id}`);
      } else {
        const err = await res.json();
        toast({ title: 'خطأ', description: err.error || 'حدث خطأ', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ غير متوقع', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field: FormData['sections'][0]['fields'][0]) => {
    const value = answers[field.id] || '';

    switch (field.fieldType) {
      case 'SHORT_TEXT':
        return <Input value={value} onChange={(e) => setAnswer(field.id, e.target.value)} placeholder={field.placeholder || ''} className="h-12 text-base" />;
      case 'LONG_TEXT':
        return <Textarea value={value} onChange={(e) => setAnswer(field.id, e.target.value)} placeholder={field.placeholder || ''} rows={4} className="text-base" />;
      case 'NUMBER':
        return <Input type="number" value={value} onChange={(e) => setAnswer(field.id, e.target.value)} placeholder={field.placeholder || ''} className="h-12 text-base" dir="ltr" />;
      case 'DATE':
        return <Input type="date" value={value} onChange={(e) => setAnswer(field.id, e.target.value)} className="h-12 text-base" />;
      case 'TIME':
        return <Input type="time" value={value} onChange={(e) => setAnswer(field.id, e.target.value)} className="h-12 text-base" dir="ltr" />;
      case 'DATETIME':
        return <Input type="datetime-local" value={value} onChange={(e) => setAnswer(field.id, e.target.value)} className="h-12 text-base" />;
      case 'YES_NO':
        return (
          <div className="flex gap-3">
            <button onClick={() => setAnswer(field.id, 'yes')} className={`flex-1 h-12 rounded-lg border-2 text-base font-medium transition-all ${value === 'yes' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 hover:border-gray-300'}`}>
              نعم
            </button>
            <button onClick={() => setAnswer(field.id, 'no')} className={`flex-1 h-12 rounded-lg border-2 text-base font-medium transition-all ${value === 'no' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 hover:border-gray-300'}`}>
              لا
            </button>
            <button onClick={() => setAnswer(field.id, 'na')} className={`flex-1 h-12 rounded-lg border-2 text-base font-medium transition-all ${value === 'na' ? 'border-gray-500 bg-gray-50 text-gray-700' : 'border-gray-200 hover:border-gray-300'}`}>
              غ/م
            </button>
          </div>
        );
      case 'RATING':
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setAnswer(field.id, String(n))} className={`w-12 h-12 rounded-lg border-2 text-lg font-bold transition-all ${Number(value) >= n ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-gray-200 hover:border-gray-300'}`}>
                {n}
              </button>
            ))}
          </div>
        );
      case 'GPS_LOCATION':
        return (
          <div className="space-y-2">
            <Button type="button" variant="outline" onClick={captureGPS} disabled={gpsLoading} className="w-full h-12 text-base">
              {gpsLoading ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <MapPin className="w-5 h-5 ml-2" />}
              {gpsLocation ? 'تم التقاط الموقع' : 'التقاط الموقع الجغرافي'}
            </Button>
            {gpsLocation && <p className="text-xs text-gray-400 text-center" dir="ltr">{gpsLocation.lat.toFixed(6)}, {gpsLocation.lng.toFixed(6)}</p>}
          </div>
        );
      case 'IMAGE_UPLOAD':
      case 'MULTIPLE_IMAGES':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-waves-400 hover:bg-waves-50 transition-colors">
                <Camera className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500">التقاط صورة</span>
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setAnswer(field.id, e.target.files?.[0]?.name || '')} />
              </label>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-waves-400 hover:bg-waves-50 transition-colors">
                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
                <span className="text-xs text-gray-500">اختيار من المعرض</span>
                <input type="file" accept="image/*" className="hidden" multiple={field.fieldType === 'MULTIPLE_IMAGES'} onChange={(e) => { const names = Array.from(e.target.files || []).map(f => f.name).join(', '); setAnswer(field.id, names); }} />
              </label>
            </div>
            {answers[field.id] && <p className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded">✓ {answers[field.id]}</p>}
          </div>
        );
      case 'SIGNATURE':
        return null;
      case 'SECTION_HEADER':
        return null;
      case 'READONLY_INFO':
        return <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">{field.helpText || field.placeholder || ''}</p>;
      default:
        return <Input value={value} onChange={(e) => setAnswer(field.id, e.target.value)} placeholder={field.placeholder || ''} className="h-12 text-base" />;
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-waves-600" /></div>;
  }

  if (!form) {
    return (
      <div className="text-center py-20">
        <h3 className="text-lg font-medium text-gray-900">النموذج غير موجود</h3>
        <Link href={`/dashboard/projects/${params.id}`}><Button variant="outline" className="mt-4">العودة للمشروع</Button></Link>
      </div>
    );
  }

  const currentSectionData = form.sections[currentSection];
  const totalSections = form.sections.length;
  const progress = ((currentSection + 1) / totalSections) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{form.name}</h1>
          <p className="text-sm text-gray-500">القسم {currentSection + 1} من {totalSections}</p>
        </div>
        <Link href={`/dashboard/projects/${params.id}`}>
          <Button variant="ghost" size="sm"><ChevronLeft className="w-4 h-4" /></Button>
        </Link>
      </div>

      {/* Progress */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-waves-600 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Section */}
      {currentSectionData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{currentSectionData.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {currentSectionData.fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label className="text-base font-medium">
                  {field.label}
                  {field.isRequired && <span className="text-red-500 mr-1">*</span>}
                </Label>
                {field.helpText && <p className="text-xs text-gray-400">{field.helpText}</p>}
                {renderField(field)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2 pb-8">
        <Button variant="outline" onClick={() => setCurrentSection(Math.max(0, currentSection - 1))} disabled={currentSection === 0} className="h-12 px-6">
          <ArrowRight className="w-4 h-4 ml-2" />
          السابق
        </Button>

        {currentSection < totalSections - 1 ? (
          <Button onClick={() => setCurrentSection(currentSection + 1)} className="h-12 px-6 bg-waves-600 hover:bg-waves-700">
            التالي
            <ArrowLeft className="w-4 h-4 mr-2" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSubmit(true)} disabled={submitting} className="h-12">
              <Save className="w-4 h-4 ml-2" />
              حفظ مسودة
            </Button>
            <Button onClick={() => handleSubmit(false)} disabled={submitting} className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Send className="w-4 h-4 ml-2" />}
              إرسال التقرير
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
