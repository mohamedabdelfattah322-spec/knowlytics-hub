'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import ThemeLogo from '@/components/ThemeLogo';
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
      // Redirect based on role (fetchMe is called inside login)
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
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <ThemeLogo width={220} height={70} priority />
          </div>
          <p className="text-slate-400">Sign in to continue learning</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="input"
                autoComplete="email"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-dark-600 bg-dark-700 text-brand-500 focus:ring-brand-500"
                />
                <span className="text-sm text-slate-400">تذكّرني</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-brand-400 hover:text-brand-300">
                نسيت كلمة المرور؟
              </Link>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> جارِ الدخول...</> : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              مش عندك حساب؟{' '}
              <Link href="/register" className="text-brand-400 hover:text-brand-300 font-medium">
                سجّل الآن
              </Link>
            </p>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-dark-700 rounded-lg border border-dark-600">
            <p className="text-xs text-slate-400 font-medium mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-xs text-slate-400">
              <p>👑 Admin: <span className="text-slate-300">admin@knowlytics.com</span></p>
              <p>🎓 Student: <span className="text-slate-300">sara@example.com</span></p>
              <p>🔑 Password: <span className="text-slate-300">Password123!</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
