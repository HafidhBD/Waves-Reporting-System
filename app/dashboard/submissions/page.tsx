'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getStatusColor, getStatusLabel, getFormTypeLabel, formatDateTime } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, ClipboardList, Loader2, FileText, MapPin, Download, Eye,
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
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
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
    fetchSubmissions();
  }, [statusFilter]);

  const filtered = submissions.filter((s) =>
    s.formTemplate.name.includes(search) ||
    s.project.name.includes(search) ||
    s.submittedBy.name.includes(search) ||
    s.project.clientName.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">التقارير المُرسلة</h1>
          <p className="text-gray-500 text-sm mt-1">جميع التقارير الميدانية المُقدمة</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          تصدير Excel
        </Button>
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
            <Card key={sub.id} className="hover:shadow-md transition-shadow">
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
                      <span>{sub._count.files} ملفات</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(sub.status)}`}>
                      {getStatusLabel(sub.status)}
                    </span>
                    <Button variant="ghost" size="icon" className="w-8 h-8">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
