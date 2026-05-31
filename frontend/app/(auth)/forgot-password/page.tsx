'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Loader2, Mail, ArrowLeft, CheckCircle, KeyRound } from 'lucide-react';
import ThemeLogo from '@/components/ThemeLogo';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface FormValues { email: string; }

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setSent(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'حدث خطأ، حاول مرة أخرى');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ThemeLogo width={200} height={60} priority />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-gray-100 p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">تم إرسال الرابط</h2>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                لو الإيميل ده مسجّل عندنا، هيوصلك رابط إعادة تعيين كلمة المرور خلال دقيقة.
                افحص الإنبوكس و فولدر الـ Spam.
              </p>
              <p className="text-xs text-gray-400 mb-6">الرابط صالح لمدة 30 دقيقة فقط.</p>
              <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-colors">
                <ArrowLeft className="w-4 h-4" /> رجوع لتسجيل الدخول
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">نسيت كلمة المرور؟</h2>
                <p className="text-gray-500 text-sm mt-2">اكتب بريدك المسجّل وسنرسل لك رابط إعادة التعيين</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">البريد الإلكتروني</label>
                  <input
                    {...register('email', {
                      required: 'البريد مطلوب',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'صيغة بريد غير صحيحة' },
                    })}
                    type="email"
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200"
                    autoComplete="email"
                    autoFocus
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> جارِ الإرسال...</> : 'إرسال رابط إعادة التعيين'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-gray-500 hover:text-blue-600 text-sm inline-flex items-center gap-1.5 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> رجوع لتسجيل الدخول
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
