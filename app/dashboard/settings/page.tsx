'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Building2, Palette, Shield, Bell, Plug, Save,
} from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState('منصة ويفز للتقارير');
  const [companyNameEn, setCompanyNameEn] = useState('Waves Reporting Platform');
  const [primaryColor, setPrimaryColor] = useState('#2573eb');

  const handleSave = () => {
    toast({ title: 'تم الحفظ', description: 'تم حفظ الإعدادات بنجاح' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">الإعدادات</h1>
        <p className="text-gray-500 text-sm mt-1">إعدادات النظام والتخصيص</p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="bg-white border w-full justify-start overflow-x-auto flex-nowrap">
          <TabsTrigger value="company" className="gap-2"><Building2 className="w-4 h-4" />الشركة</TabsTrigger>
          <TabsTrigger value="branding" className="gap-2"><Palette className="w-4 h-4" />العلامة التجارية</TabsTrigger>
          <TabsTrigger value="permissions" className="gap-2"><Shield className="w-4 h-4" />الصلاحيات</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="w-4 h-4" />الإشعارات</TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2"><Plug className="w-4 h-4" />التكاملات</TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>معلومات الشركة</CardTitle>
              <CardDescription>تخصيص اسم الشركة والمعلومات الأساسية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اسم الشركة (عربي)</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>اسم الشركة (إنجليزي)</Label>
                  <Input value={companyNameEn} onChange={(e) => setCompanyNameEn(e.target.value)} dir="ltr" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>الشعار</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <p className="text-sm text-gray-500">اسحب الشعار هنا أو اضغط للرفع</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, SVG - حد أقصى 2 ميجابايت</p>
                </div>
              </div>
              <Button onClick={handleSave} className="bg-waves-600 hover:bg-waves-700">
                <Save className="w-4 h-4 ml-2" />
                حفظ التغييرات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>العلامة التجارية</CardTitle>
              <CardDescription>تخصيص الألوان والمظهر</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>اللون الأساسي</Label>
                <div className="flex items-center gap-3">
                  <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-12 h-12 rounded-lg border cursor-pointer" />
                  <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-32" dir="ltr" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['#2573eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2'].map((color) => (
                  <button key={color} onClick={() => setPrimaryColor(color)}
                    className={`h-12 rounded-lg border-2 transition-all ${primaryColor === color ? 'border-gray-900 scale-105' : 'border-transparent'}`}
                    style={{ backgroundColor: color }} />
                ))}
              </div>
              <Button onClick={handleSave} className="bg-waves-600 hover:bg-waves-700">
                <Save className="w-4 h-4 ml-2" />
                حفظ التغييرات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الصلاحيات</CardTitle>
              <CardDescription>إدارة أدوار المستخدمين وصلاحياتهم</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { role: 'مدير النظام', desc: 'وصول كامل لجميع الميزات والإعدادات', permissions: 'كامل' },
                  { role: 'مدير', desc: 'إدارة المشاريع والمستخدمين والتقارير', permissions: 'إدارة' },
                  { role: 'مدير مشروع', desc: 'إدارة المشاريع المعينة وإنشاء النماذج', permissions: 'مشروع' },
                  { role: 'مشرف ميداني', desc: 'تقديم التقارير والوصول للمشاريع المعينة', permissions: 'ميداني' },
                  { role: 'مشاهد / عميل', desc: 'عرض التقارير والتحليلات فقط', permissions: 'عرض' },
                ].map((r) => (
                  <div key={r.role} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <h4 className="font-medium text-gray-900">{r.role}</h4>
                      <p className="text-sm text-gray-500">{r.desc}</p>
                    </div>
                    <span className="text-xs bg-waves-50 text-waves-700 px-3 py-1 rounded-full font-medium">{r.permissions}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الإشعارات</CardTitle>
              <CardDescription>إدارة إشعارات النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center">
                <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <h3 className="font-medium text-gray-900 mb-1">قريباً</h3>
                <p className="text-sm text-gray-500">سيتم إضافة إعدادات الإشعارات في التحديث القادم</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>التكاملات</CardTitle>
              <CardDescription>ربط المنصة مع خدمات خارجية</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center">
                <Plug className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <h3 className="font-medium text-gray-900 mb-1">قريباً</h3>
                <p className="text-sm text-gray-500">سيتم إضافة التكاملات مع خدمات خارجية في التحديث القادم</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
