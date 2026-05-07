'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookOpen, Users, Video, Award, ChevronRight, Star, Zap, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const features = [
  { icon: Video, title: 'Live & Recorded Courses', desc: 'Attend live Zoom sessions or watch recordings at your own pace.' },
  { icon: Zap, title: 'Duolingo-Style Quizzes', desc: 'Instant feedback, scoring, and level assessment after every lesson.' },
  { icon: Shield, title: 'Secure Platform', desc: 'Session monitoring, watermarked video, and device-lock protection.' },
  { icon: Award, title: 'Track Your Progress', desc: 'Visual dashboards showing completion, scores, and recommendations.' },
];

const stats = [
  { value: '10,000+', label: 'Students' },
  { value: '150+', label: 'Courses' },
  { value: '98%', label: 'Satisfaction' },
  { value: '24/7', label: 'Support' },
];

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Auto-redirect logged-in users to their dashboard
  useEffect(() => {
    if (user) {
      router.replace(user.role === 'admin' ? '/dashboard/admin' : '/dashboard/student');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Nav */}
      <nav className="border-b border-dark-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-brand-500" />
            <span className="text-xl font-bold text-white">Knowlytics <span className="text-brand-500">Hub</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-secondary text-sm">Sign In</Link>
            <Link href="/register" className="btn-primary text-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 rounded-full px-4 py-1.5 mb-6">
          <Star className="w-4 h-4 text-brand-400" />
          <span className="text-brand-400 text-sm font-medium">The Smart Way to Learn</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
          Learn Without<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-400">
            Limits
          </span>
        </h1>
        <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Knowlytics Hub combines live instruction, on-demand video, and gamified quizzes
          into one powerful learning experience.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="btn-primary text-base px-8 py-3 inline-flex items-center gap-2">
            Start Learning Free <ChevronRight className="w-4 h-4" />
          </Link>
          <Link href="/courses" className="btn-secondary text-base px-8 py-3">
            Browse Courses
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-dark-700 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-4xl font-bold text-brand-400 mb-1">{s.value}</p>
              <p className="text-slate-400 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center text-white mb-4">Everything You Need to Succeed</h2>
        <p className="text-slate-400 text-center mb-14 max-w-xl mx-auto">
          A complete ecosystem for students and educators, built for the modern learner.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card hover:border-brand-500/50 transition-all duration-300 group">
              <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-500/20 transition-colors">
                <Icon className="w-6 h-6 text-brand-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="bg-gradient-to-r from-brand-600 to-purple-600 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Level Up?</h2>
          <p className="text-white/80 mb-8 text-lg">Join thousands of learners advancing their careers with Knowlytics Hub.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-brand-600 font-bold px-8 py-3 rounded-lg hover:bg-slate-100 transition-colors">
            Create Free Account <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-700 py-8 text-center text-slate-500 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-brand-500" />
          <span className="font-semibold text-slate-400">Knowlytics Hub</span>
        </div>
        © {new Date().getFullYear()} Knowlytics Hub. All rights reserved.
      </footer>
    </div>
  );
}
