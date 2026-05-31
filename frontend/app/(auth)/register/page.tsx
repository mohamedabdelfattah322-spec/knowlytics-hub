'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Sparkles, Shield, Clock, GraduationCap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { saveToken } from '@/lib/auth';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
});
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();
  const [showPass, setShowPass] = useState(false);
  const [refCode, setRefCode] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) setRefCode(ref);
  }, [searchParams]);

  const onSubmit = async (data: FormValues) => {
    try {
      const { data: res } = await api.post('/auth/register', {
        ...data,
        role: 'student',
        student_type: 'online',
      });
      saveToken(res.token);
      setUser(res.user);

      if (refCode) {
        api.post('/referrals/apply', { referral_code: refCode }).catch(() => {});
      }

      toast.success('تم إنشاء الحساب! مرحباً بك في Knowlytics Hub');
      router.push('/dashboard/student');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left: Branding Panel (darker navy) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#060e1e] flex-col items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-10 right-20 w-80 h-80 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-400 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-md text-center">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-blue-500/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-blue-400/20">
              <Sparkles className="w-10 h-10 text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
            انضم إلينا اليوم
          </h1>
          <p className="text-white text-lg mb-12 leading-relaxed">
            أنشئ حسابك وابدأ التعلّم مع آلاف الطلاب حول العالم
          </p>

          <div className="flex flex-col gap-5 text-right w-full">
            <div className="flex items-center gap-4 bg-white/10 rounded-xl p-5 border border-white/10">
              <div className="w-12 h-12 bg-blue-500/25 rounded-xl flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">تعلّم بالسرعة التي تناسبك</h3>
                <p className="text-white/80 text-sm mt-1">وصول غير محدود للدورات المسجّلة</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/10 rounded-xl p-5 border border-white/10">
              <div className="w-12 h-12 bg-emerald-500/25 rounded-xl flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">حساب آمن ومحمي</h3>
                <p className="text-white/80 text-sm mt-1">تشفير كامل وإشعارات أمان فورية</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/10 rounded-xl p-5 border border-white/10">
              <div className="w-12 h-12 bg-amber-500/25 rounded-xl flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-base">دعم فني على مدار الساعة</h3>
                <p className="text-white/80 text-sm mt-1">فريق متخصص لمساعدتك في أي وقت</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 text-blue-400/30 text-xs">
          &copy; {new Date().getFullYear()} Knowlytics Hub. All rights reserved.
        </div>
      </div>

      {/* ── Right: Register Form (white) ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image src="/logo-dark.png" alt="Knowlytics Hub" width={200} height={60} className="object-contain" priority />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">إنشاء حساب جديد</h2>
            <p className="text-gray-500 text-sm">ابدأ رحلتك التعليمية اليوم</p>
          </div>

          {refCode && (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-3 mb-5 text-center">
              <p className="text-emerald-700 text-sm font-medium">🎁 لديك كود إحالة! ستحصل على خصم على أول عملية شراء</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">الاسم بالكامل</label>
              <input
                {...register('name')}
                type="text"
                placeholder="مثال: محمد أحمد"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">البريد الإلكتروني</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">كلمة المرور</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="8 أحرف على الأقل، حرف كبير، رقم"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all duration-200 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5 font-medium">{errors.password.message}</p>}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
              💡 الكورسات المسجلة تُشترى مباشرة بعد إنشاء الحساب. الكورسات المباشرة (Live) يقوم الأدمن بتسجيلك فيها بعد التواصل.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> جارِ إنشاء الحساب...</> : 'إنشاء حساب'}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-500 text-sm">
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">سجّل دخول</Link>
          </p>

          <div className="mt-8 lg:hidden text-center">
            <p className="text-gray-400 text-xs">&copy; {new Date().getFullYear()} Knowlytics Hub</p>
          </div>
        </div>
      </div>
    </div>
  );
}
