'use client';
import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Loader2, Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface FormValues { new_password: string; confirm_password: string; }

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [done, setDone] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>();

  if (!token) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="card text-center max-w-md w-full">
          <p className="text-red-400 mb-4">رابط غير صالح. اطلب رابطاً جديداً.</p>
          <Link href="/forgot-password" className="btn-primary">طلب رابط جديد</Link>
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
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Image src="/logo.png" alt="Knowlytics Hub" width={220} height={70} className="object-contain" priority />
          </div>
        </div>

        <div className="card">
          {done ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-lg font-bold text-white mb-2">تم تغيير كلمة المرور ✅</h2>
              <p className="text-slate-400 text-sm">جارِ التحويل لصفحة تسجيل الدخول...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-brand-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6 text-brand-400" />
                </div>
                <h2 className="text-lg font-bold text-white">تعيين كلمة مرور جديدة</h2>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">كلمة المرور الجديدة</label>
                  <div className="relative">
                    <input
                      {...register('new_password', {
                        required: 'كلمة المرور مطلوبة',
                        minLength: { value: 6, message: 'على الأقل 6 أحرف' },
                      })}
                      type={showPass ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="input pr-10"
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.new_password && <p className="text-red-400 text-xs mt-1">{errors.new_password.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">تأكيد كلمة المرور</label>
                  <input
                    {...register('confirm_password', {
                      required: 'تأكيد كلمة المرور مطلوب',
                      validate: (v) => v === watch('new_password') || 'كلمتا المرور غير متطابقتان',
                    })}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="input"
                    autoComplete="new-password"
                  />
                  {errors.confirm_password && <p className="text-red-400 text-xs mt-1">{errors.confirm_password.message}</p>}
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> جارِ الحفظ...</> : 'حفظ كلمة المرور الجديدة'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
