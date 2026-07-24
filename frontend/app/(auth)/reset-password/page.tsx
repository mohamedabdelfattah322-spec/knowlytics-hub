'use client';
export const dynamic = 'force-dynamic';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { Loader2, Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface FormValues { new_password: string; confirm_password: string; }

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0b1426] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-400" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [done, setDone] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>();

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0b1426] flex items-center justify-center px-4">
        <div className="bg-[#101e36] rounded-2xl border border-[#1e3555] p-8 text-center max-w-md w-full">
          <p className="text-red-400 mb-4 font-medium">رابط غير صالح. اطلب رابطاً جديداً.</p>
          <Link href="/forgot-password" className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20">طلب رابط جديد</Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: FormValues) => {
    try {
      await api.post('/auth/reset-password', { token, new_password: data.new_password });
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'حدث خطأ، حاول مرة أخرى');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1426] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo-white.png" alt="Knowlytics Hub" width={200} height={60} className="object-contain" priority />
          </div>
        </div>

        <div className="bg-[#101e36] rounded-2xl border border-[#1e3555] p-8">
          {done ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">تم تغيير كلمة المرور</h2>
              <p className="text-blue-300/60 text-sm">جارِ التحويل لصفحة تسجيل الدخول...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-blue-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7 text-blue-400" />
                </div>
                <h2 className="text-xl font-bold text-white">تعيين كلمة مرور جديدة</h2>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-blue-100/80 mb-2">كلمة المرور الجديدة</label>
                  <div className="relative">
                    <input
                      {...register('new_password', {
                        required: 'كلمة المرور مطلوبة',
                        minLength: { value: 6, message: 'على الأقل 6 أحرف' },
                      })}
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl border border-[#1e3555] bg-[#0b1426] text-white placeholder-blue-300/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 pr-12"
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300/40 hover:text-blue-300 transition-colors">
                      {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.new_password && <p className="text-red-400 text-xs mt-1.5 font-medium">{errors.new_password.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-blue-100/80 mb-2">تأكيد كلمة المرور</label>
                  <input
                    {...register('confirm_password', {
                      required: 'تأكيد كلمة المرور مطلوب',
                      validate: (v) => v === watch('new_password') || 'كلمتا المرور غير متطابقتان',
                    })}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border border-[#1e3555] bg-[#0b1426] text-white placeholder-blue-300/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200"
                    autoComplete="new-password"
                  />
                  {errors.confirm_password && <p className="text-red-400 text-xs mt-1.5 font-medium">{errors.confirm_password.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> جارِ الحفظ...</> : 'حفظ كلمة المرور الجديدة'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
