'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import Image from 'next/image';
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
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Image src="/logo.png" alt="Knowlytics Hub" width={220} height={70} className="object-contain" priority />
          </div>
          <p className="text-slate-400">إعادة تعيين كلمة المرور</p>
        </div>

        <div className="card">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">تم إرسال الرابط ✉️</h2>
              <p className="text-slate-400 text-sm mb-6">
                لو الإيميل ده مسجّل عندنا، هيوصلك رابط إعادة تعيين كلمة المرور خلال دقيقة.
                افحص الإنبوكس و فولدر الـ Spam.
              </p>
              <p className="text-xs text-slate-500 mb-6">الرابط صالح لمدة 30 دقيقة فقط.</p>
              <Link href="/login" className="btn-secondary inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" /> رجوع لتسجيل الدخول
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-6 h-6 text-brand-400" />
                </div>
                <h2 className="text-lg font-bold text-white">نسيت كلمة المرور؟</h2>
                <p className="text-slate-400 text-sm mt-1">اكتب بريدك المسجّل وسنرسل لك رابط إعادة التعيين</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">البريد الإلكتروني</label>
                  <input
                    {...register('email', {
                      required: 'البريد مطلوب',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'صيغة بريد غير صحيحة' },
                    })}
                    type="email"
                    placeholder="you@example.com"
                    className="input"
                    autoComplete="email"
                    autoFocus
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> جارِ الإرسال...</> : 'إرسال رابط إعادة التعيين'}
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link href="/login" className="text-slate-400 hover:text-white text-sm inline-flex items-center gap-1.5">
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
