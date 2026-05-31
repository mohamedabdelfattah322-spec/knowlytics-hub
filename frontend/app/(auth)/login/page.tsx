'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, BookOpen, Award, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await login(data.email, data.password, remember);
      toast.success('Welcome back!');
      const user = useAuth.getState().user;
      router.push(user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/student');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Login failed';
      if (msg.includes('different location')) {
        toast.error('Security alert: Login from new location detected.', { duration: 5000 });
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left: Branding Panel (darker navy) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#060e1e] flex-col items-center justify-center p-12 overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-md text-center">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-blue-500/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-blue-400/20">
              <BookOpen className="w-10 h-10 text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
            ابدأ رحلتك التعليمية
          </h1>
          <p className="text-blue-300/80 text-lg mb-12 leading-relaxed">
            منصة تعليمية متكاملة لتطوير مهاراتك والحصول على شهادات معتمدة
          </p>

          {/* Features */}
          <div className="space-y-4 text-right">
            <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">دورات متنوعة</h3>
                <p className="text-blue-300/60 text-xs mt-0.5">محتوى تعليمي عالي الجودة في مختلف المجالات</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
                <Award className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">شهادات معتمدة</h3>
                <p className="text-blue-300/60 text-xs mt-0.5">احصل على شهادة إتمام لكل دورة تنهيها</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">تتبّع تقدّمك</h3>
                <p className="text-blue-300/60 text-xs mt-0.5">لوحة تحكم شاملة لمتابعة إنجازاتك</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 text-blue-400/30 text-xs">
          &copy; {new Date().getFullYear()} Knowlytics Hub. All rights reserved.
        </div>
      </div>

      {/* ── Right: Login Form (dark navy) ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-[#0b1426]">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <Image src="/logo-white.png" alt="Knowlytics Hub" width={200} height={60} className="object-contain" priority />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">!مرحباً بعودتك</h2>
            <p className="text-blue-300/60 text-sm">سجّل دخولك للمتابعة</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-blue-100/80 mb-2">البريد الإلكتروني</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-[#1e3555] bg-[#101e36] text-white placeholder-blue-300/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200"
                autoComplete="email"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1.5 font-medium">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-100/80 mb-2">كلمة المرور</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-[#1e3555] bg-[#101e36] text-white placeholder-blue-300/30 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300/40 hover:text-blue-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1.5 font-medium">{errors.password.message}</p>}
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-[#1e3555] bg-[#101e36] text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-blue-200/60">تذكّرني</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 font-medium">
                نسيت كلمة المرور؟
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> جارِ الدخول...</> : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-blue-300/50 text-sm">
              مش عندك حساب؟{' '}
              <Link href="/register" className="text-blue-400 hover:text-blue-300 font-semibold">
                سجّل الآن
              </Link>
            </p>
          </div>

          <div className="mt-8 lg:hidden text-center">
            <p className="text-blue-400/30 text-xs">&copy; {new Date().getFullYear()} Knowlytics Hub</p>
          </div>
        </div>
      </div>
    </div>
  );
}
