'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { Loader2, ArrowLeft, CheckCircle, KeyRound } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-[#0b1426] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo-white.png" alt="Knowlytics Hub" width={200} height={60} className="object-contain" priority />
          </div>
        </div>

        <div className="bg-[#101e36] rounded-2xl border border-[#1e3555] p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">تم إرسال الرابط</h2>
              <p className="text-blue-300/60 text-sm mb-6 leading-relaxed">
                لو الإيميل ده مسجّل عندنا، هيوصلك رابط إعادة تعيين كلمة المرور خلال دقيقة.
                افحص الإنبوكس و فولدر الـ Spam.
              </p>
              <p className="text-xs text-blue-300/40 mb-6">الرابط صالح لمدة 30 دقيقة فقط.</p>
              <Link href="/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#182c4a] hover:bg-[#213d63] text-white rounded-xl font-medium text-sm transition-colors border border-[#1e3555]">
                <ArrowLeft className="w-4 h-4" /> رجوع لتسجيل الدخول
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-blue-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-7 h-7 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">نسيت كلمة المرور؟</h2>
                <p className="text-blue-300/60 text-sm mt-2">اكتب بريدك المسجّل وسنرسل لك رابط إعادة التعيين</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-blue-100/80 mb-2">البريد الإلكتروني</label>
                  <input
                    {...register('email', {
                      required: 'البريد مطلوب',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'صيغة بريد غير صحيحة' },
                    })}
                    type="email"
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-[#1e3555] bg-[#0b1426] text-white placeholder-blue-300/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200"
                    autoComplete="email"
                    autoFocus
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1.5 font-medium">{errors.email.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> جارِ الإرسال...</> : 'إرسال رابط إعادة التعيين'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-blue-300/50 hover:text-blue-300 text-sm inline-flex items-center gap-1.5 transition-colors">
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
