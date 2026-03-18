'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Waves, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-waves-50 via-white to-waves-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-waves-600 text-white mb-4 shadow-lg">
            <Waves className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">استعادة كلمة المرور</h1>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {sent ? 'تم الإرسال' : 'نسيت كلمة المرور؟'}
            </CardTitle>
            <CardDescription>
              {sent
                ? 'تحقق من بريدك الإلكتروني للحصول على رابط إعادة تعيين كلمة المرور'
                : 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center py-4">
                <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500 mb-4" />
                <p className="text-sm text-gray-600 mb-6">
                  إذا كان البريد الإلكتروني مسجلاً في النظام، ستتلقى رسالة تحتوي على رابط إعادة تعيين كلمة المرور.
                </p>
                <Link href="/login">
                  <Button className="bg-waves-600 hover:bg-waves-700">
                    <ArrowRight className="w-4 h-4 ml-2" />
                    العودة لتسجيل الدخول
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 text-base"
                    dir="ltr"
                  />
                </div>
                <Button type="submit" className="w-full h-12 text-base bg-waves-600 hover:bg-waves-700" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin ml-2" />
                      جاري الإرسال...
                    </>
                  ) : (
                    'إرسال رابط الاستعادة'
                  )}
                </Button>
                <div className="text-center">
                  <Link href="/login" className="text-sm text-waves-600 hover:underline">
                    العودة لتسجيل الدخول
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
