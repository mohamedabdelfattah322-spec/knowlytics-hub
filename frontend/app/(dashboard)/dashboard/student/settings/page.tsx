'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Eye, EyeOff, Lock, CheckCircle, User } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface PasswordForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export default function StudentSettingsPage() {
  const { user } = useAuth();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register, handleSubmit, watch, reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>();

  const onSubmit = async (data: PasswordForm) => {
    try {
      await api.put('/auth/change-password', {
        current_password: data.current_password,
        new_password: data.new_password,
      });
      toast.success('تم تغيير كلمة المرور بنجاح ✅');
      setDone(true);
      reset();
      setTimeout(() => setDone(false), 4000);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'فشل تغيير كلمة المرور');
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-white">الإعدادات</h1>
        <p className="text-slate-400 text-sm mt-1">إدارة حسابك وكلمة المرور</p>
      </div>

      {/* Account info */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-brand-400" /> بيانات الحساب
        </h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-dark-700">
            <span className="text-slate-400">الاسم</span>
            <span className="text-white font-medium">{user?.name}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-dark-700">
            <span className="text-slate-400">البريد الإلكتروني</span>
            <span className="text-white">{user?.email}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-slate-400">نوع الحساب</span>
            <span className="text-white capitalize">{user?.student_type || 'online'}</span>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-brand-400" /> تغيير كلمة المرور
        </h2>

        {done && (
          <div className="flex items-center gap-2 text-green-400 text-sm mb-4 bg-green-500/10 p-3 rounded-lg">
            <CheckCircle className="w-4 h-4" /> تم تغيير كلمة المرور بنجاح
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">كلمة المرور الحالية</label>
            <div className="relative">
              <input
                {...register('current_password', { required: 'مطلوب' })}
                type={showCurrent ? 'text' : 'password'}
                placeholder="••••••••"
                className="input pr-10"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.current_password && <p className="text-red-400 text-xs mt-1">{errors.current_password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">كلمة المرور الجديدة</label>
            <div className="relative">
              <input
                {...register('new_password', {
                  required: 'مطلوب',
                  minLength: { value: 6, message: 'على الأقل 6 أحرف' },
                })}
                type={showNew ? 'text' : 'password'}
                placeholder="••••••••"
                className="input pr-10"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.new_password && <p className="text-red-400 text-xs mt-1">{errors.new_password.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">تأكيد كلمة المرور الجديدة</label>
            <input
              {...register('confirm_password', {
                required: 'مطلوب',
                validate: (v) => v === watch('new_password') || 'كلمتا المرور غير متطابقتان',
              })}
              type={showNew ? 'text' : 'password'}
              placeholder="••••••••"
              className="input"
              autoComplete="new-password"
            />
            {errors.confirm_password && <p className="text-red-400 text-xs mt-1">{errors.confirm_password.message}</p>}
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> جارِ الحفظ...</> : 'تغيير كلمة المرور'}
          </button>
        </form>
      </div>
    </div>
  );
}
