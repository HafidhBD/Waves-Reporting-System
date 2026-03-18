'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getRoleLabel, formatDateTime } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, Search, Users, Loader2, Mail, Phone, Shield, Calendar,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  phone: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  _count: { submissions: number; projectAccess: number };
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'VIEWER', phone: '',
  });

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter((u) =>
    u.name.includes(search) || u.email.includes(search) || getRoleLabel(u.role).includes(search)
  );

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) {
      toast({ title: 'خطأ', description: 'جميع الحقول المطلوبة يجب تعبئتها', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({ title: 'تم بنجاح', description: 'تم إنشاء المستخدم بنجاح' });
        setShowCreate(false);
        setForm({ name: '', email: '', password: '', role: 'VIEWER', phone: '' });
        fetchUsers();
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

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-700',
    ADMIN: 'bg-purple-100 text-purple-700',
    PROJECT_MANAGER: 'bg-blue-100 text-blue-700',
    FIELD_SUPERVISOR: 'bg-emerald-100 text-emerald-700',
    VIEWER: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المستخدمون</h1>
          <p className="text-gray-500 text-sm mt-1">إدارة المستخدمين والصلاحيات</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-waves-600 hover:bg-waves-700">
          <Plus className="w-4 h-4 ml-2" />
          مستخدم جديد
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="بحث بالاسم أو البريد..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 h-11" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-waves-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center ${user.isActive ? 'bg-waves-100' : 'bg-gray-100'}`}>
                      <span className={`text-sm font-bold ${user.isActive ? 'text-waves-700' : 'text-gray-400'}`}>
                        {user.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{user.name}</h3>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role] || roleColors.VIEWER}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`} title={user.isActive ? 'نشط' : 'معطل'} />
                </div>

                <div className="space-y-1.5 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" />
                    <span className="truncate" dir="ltr">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" />
                      <span dir="ltr">{user.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>آخر دخول: {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'لم يسجل دخول'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs text-gray-400">
                  <span>{user._count.projectAccess} مشاريع</span>
                  <span>{user._count.submissions} تقارير</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة مستخدم جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>الاسم الكامل *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="الاسم الكامل" />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>كلمة المرور *</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="كلمة المرور" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>الدور</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">مدير النظام</SelectItem>
                  <SelectItem value="ADMIN">مدير</SelectItem>
                  <SelectItem value="PROJECT_MANAGER">مدير مشروع</SelectItem>
                  <SelectItem value="FIELD_SUPERVISOR">مشرف ميداني</SelectItem>
                  <SelectItem value="VIEWER">مشاهد</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+966..." dir="ltr" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>إلغاء</Button>
            <Button onClick={handleCreate} disabled={creating} className="bg-waves-600 hover:bg-waves-700">
              {creating ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
              إضافة المستخدم
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
