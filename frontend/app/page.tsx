'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Video, Award, ChevronRight, Star, Zap, Shield, ArrowRight, GraduationCap, Clock, Globe } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const features = [
  { icon: Video, title: 'دورات مباشرة ومسجّلة', desc: 'احضر حصص Zoom مباشرة أو شاهد التسجيلات في أي وقت يناسبك.', color: 'blue' },
  { icon: Zap, title: 'اختبارات تفاعلية', desc: 'تقييم فوري ونتائج لحظية بعد كل درس بأسلوب ممتع.', color: 'purple' },
  { icon: Shield, title: 'منصة آمنة ومحمية', desc: 'مراقبة الجلسات، حماية الفيديو، وقفل الأجهزة.', color: 'emerald' },
  { icon: Award, title: 'تتبّع تقدّمك', desc: 'لوحة تحكم بصرية تعرض الإنجازات والنتائج والتوصيات.', color: 'amber' },
];

const stats = [
  { value: '+10,000', label: 'طالب' },
  { value: '+150', label: 'دورة' },
  { value: '98%', label: 'رضا الطلاب' },
  { value: '24/7', label: 'دعم فني' },
];

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace(user.role === 'admin' ? '/dashboard/admin' : '/dashboard/student');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>

      {/* ── Navbar (Dark Navy) ── */}
      <nav style={{ backgroundColor: '#060e1e', borderBottom: '1px solid rgba(255,255,255,0.08)' }} className="px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Image src="/logo-white.png" alt="Knowlytics Hub" width={170} height={48} className="object-contain" priority />
          <div className="flex items-center gap-3">
            <a href="https://wa.me/201226929392" target="_blank" rel="noreferrer"
               className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium"
               style={{ color: '#4ade80' }}>
              💬 واتساب
            </a>
            <Link href="/login"
                  className="text-sm px-5 py-2.5 rounded-xl font-semibold transition-all duration-200"
                  style={{ color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }}>
              Sign In
            </Link>
            <Link href="/register"
                  className="text-sm px-5 py-2.5 rounded-xl font-semibold transition-all duration-200"
                  style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero (White) ── */}
      <section className="relative overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-8"
               style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
            <Star className="w-4 h-4" style={{ color: '#2563eb' }} />
            <span className="text-sm font-semibold" style={{ color: '#2563eb' }}>The Smart Way to Learn</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight" style={{ color: '#0f172a' }}>
            Learn Without<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600">
              Limits
            </span>
          </h1>

          <p className="text-xl max-w-2xl mx-auto mb-12 leading-relaxed" style={{ color: '#64748b' }}>
            Knowlytics Hub combines live instruction, on-demand video, and gamified quizzes
            into one powerful learning experience.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register"
                  className="text-base px-8 py-4 rounded-xl font-bold inline-flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02]"
                  style={{ backgroundColor: '#1e3a5f', color: '#ffffff', boxShadow: '0 8px 30px rgba(30,58,95,0.25)' }}>
              Start Learning Free <ChevronRight className="w-5 h-5" />
            </Link>
            <Link href="/courses"
                  className="text-base px-8 py-4 rounded-xl font-semibold inline-flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02]"
                  style={{ color: '#1e293b', border: '2px solid #d1d5db' }}>
              Browse Courses
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats (White) ── */}
      <section style={{ backgroundColor: '#ffffff' }} className="py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-4xl md:text-5xl font-extrabold mb-2" style={{ color: '#1e3a5f' }}>{s.value}</p>
              <p className="text-sm font-medium" style={{ color: '#6b7280' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features (Light Gray) ── */}
      <section className="py-24" style={{ backgroundColor: '#f8fafc' }}>
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4" style={{ color: '#0f172a' }}>
            كل ما تحتاجه للنجاح
          </h2>
          <p className="text-center mb-16 max-w-xl mx-auto text-lg" style={{ color: '#64748b' }}>
            منظومة تعليمية متكاملة للطلاب والمعلمين، مصممة للمتعلّم العصري.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => {
              const colors: Record<string, { bg: string; iconColor: string; border: string }> = {
                blue:    { bg: '#eff6ff', iconColor: '#2563eb', border: '#bfdbfe' },
                purple:  { bg: '#f5f3ff', iconColor: '#7c3aed', border: '#ddd6fe' },
                emerald: { bg: '#ecfdf5', iconColor: '#059669', border: '#a7f3d0' },
                amber:   { bg: '#fffbeb', iconColor: '#d97706', border: '#fde68a' },
              };
              const c = colors[color];
              return (
                <div key={title}
                     className="rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group"
                     style={{ backgroundColor: '#ffffff', border: `1px solid #e5e7eb` }}>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                       style={{ backgroundColor: c.bg }}>
                    <Icon className="w-7 h-7" style={{ color: c.iconColor }} />
                  </div>
                  <h3 className="font-bold text-lg mb-2" style={{ color: '#0f172a' }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Why Knowlytics (Dark Navy) ── */}
      <section className="py-24 relative overflow-hidden" style={{ backgroundColor: '#0b1426' }}>
        <div className="absolute inset-0 opacity-[0.06]">
          <div className="absolute top-10 right-20 w-80 h-80 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-400 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-16" style={{ color: '#ffffff' }}>
            ليه تختار Knowlytics Hub؟
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            <div className="text-center px-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                   style={{ backgroundColor: 'rgba(59,130,246,0.15)' }}>
                <GraduationCap className="w-8 h-8" style={{ color: '#60a5fa' }} />
              </div>
              <h3 className="font-bold text-xl mb-3" style={{ color: '#ffffff' }}>تعلّم بالسرعة اللي تناسبك</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                وصول غير محدود للدورات المسجّلة. اتعلّم في أي وقت ومن أي مكان.
              </p>
            </div>
            <div className="text-center px-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                   style={{ backgroundColor: 'rgba(16,185,129,0.15)' }}>
                <Globe className="w-8 h-8" style={{ color: '#34d399' }} />
              </div>
              <h3 className="font-bold text-xl mb-3" style={{ color: '#ffffff' }}>محتوى عالمي بجودة عالية</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                دورات من أفضل المدربين في مجالات متنوعة مع شهادات معتمدة.
              </p>
            </div>
            <div className="text-center px-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                   style={{ backgroundColor: 'rgba(139,92,246,0.15)' }}>
                <Clock className="w-8 h-8" style={{ color: '#a78bfa' }} />
              </div>
              <h3 className="font-bold text-xl mb-3" style={{ color: '#ffffff' }}>دعم فني على مدار الساعة</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                فريق متخصص لمساعدتك في أي وقت. مش هتحس إنك لوحدك أبداً.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA (Gradient) ── */}
      <section style={{ backgroundColor: '#ffffff' }} className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
               style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 50%, #7c3aed 100%)' }}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: '#ffffff' }}>
                جاهز تبدأ رحلتك؟
              </h2>
              <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.85)' }}>
                انضم لآلاف الطلاب اللي بيطوّروا مهاراتهم مع Knowlytics Hub.
              </p>
              <Link href="/register"
                    className="inline-flex items-center gap-2 font-bold px-10 py-4 rounded-xl text-lg transition-all duration-200 hover:scale-[1.03] shadow-xl"
                    style={{ backgroundColor: '#ffffff', color: '#1e3a5f' }}>
                أنشئ حساب مجاني <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer (White) ── */}
      <footer style={{ borderTop: '1px solid #e5e7eb', backgroundColor: '#ffffff' }} className="py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Image src="/logo-dark.png" alt="Knowlytics Hub" width={140} height={38} className="object-contain opacity-80" />
            <p className="text-sm" style={{ color: '#9ca3af' }}>
              © {new Date().getFullYear()} Knowlytics Hub. All rights reserved.
            </p>
            <a href="mailto:Sales@knowlyticshub.com"
               className="text-sm font-medium transition-colors"
               style={{ color: '#3b82f6' }}>
              Sales@knowlyticshub.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
