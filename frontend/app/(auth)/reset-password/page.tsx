'use client';
export const dynamic = 'force-dynamic';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Loader2, Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import ThemeLogo from '@/components/ThemeLogo';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface FormValues { new_password: string; confirm_password: string; }

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-gray-100 p-8 text-center max-w-md w-full">
          <p className="text-red-500 mb-4 font-medium">رابط غير صالح. اطلب رابطاً جديداً.</p>
          <Link href="/forgot-password" className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25">طلب رابط جديد</Link>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ThemeLogo width={200} height={60} priority />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 border border-gray-100 p-8">
          {done ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">تم تغيير كلمة المرور</h2>
              <p className="text-gray-500 text-sm">جارِ التحويل لصفحة تسجيل الدخول...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-7 h-7 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">تعيين كلمة مرور جديدة</h2>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">كلمة المرور الجديدة</label>
                  <div className="relative">
                    <input
                      {...register('new_password', {
                        required: 'كلمة المرور مطلوبة',
                        minLength: { value: 6, message: 'على الأقل 6 أحرف' },
                      })}
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 pr-12"
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.new_password && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.new_password.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">تأكيد كلمة المرور</label>
                  <input
                    {...register('confirm_password', {
                      required: 'تأكيد كلمة المرور مطلوب',
                      validate: (v) => v === watch('new_password') || 'كلمتا المرور غير متطابقتان',
                    })}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200"
                    autoComplete="new-password"
                  />
                  {errors.confirm_password && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.confirm_password.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
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
