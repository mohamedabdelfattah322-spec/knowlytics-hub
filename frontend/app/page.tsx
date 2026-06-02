'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Video, Award, ChevronRight, Star, Zap, Shield, ArrowRight,
  GraduationCap, Clock, Globe, Sun, Moon, Languages,
  UserPlus, BookOpen, PlayCircle, BadgeCheck, X, HelpCircle,
  Users, Quote, Mail, Facebook, Instagram, Linkedin, Youtube,
  CheckCircle2, Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';
import { formatPrice } from '@/lib/utils';
import api from '@/lib/api';

const featureIcons = [Video, Zap, Shield, Award];
const featureColors = ['blue', 'purple', 'emerald', 'amber'];

/* ─── Types ──────────────────────────────────────────── */
interface FeaturedCourse {
  id: string; title: string; description: string; type: string;
  level: string; price: number; thumbnail_url: string;
  duration_hours: number; avg_rating: number; review_count: number;
  enrollment_count: number; instructor_name: string;
}
interface Review {
  rating: number; comment: string; created_at: string;
  user_name: string; avatar_url: string | null;
  course_title: string;
}

/* ─── Onboarding Guide Modal ──────────────────────────── */
function GuideModal({ onClose, t }: { onClose: () => void; t: (k: any) => string }) {
  const [dontShow, setDontShow] = useState(false);
  const handleClose = () => {
    if (dontShow) localStorage.setItem('kh_guide_dismissed', 'true');
    onClose();
  };
  const steps = [
    { icon: UserPlus, titleKey: 'guide.step1Title', descKey: 'guide.step1Desc', color: '#3b82f6' },
    { icon: BookOpen, titleKey: 'guide.step2Title', descKey: 'guide.step2Desc', color: '#8b5cf6' },
    { icon: PlayCircle, titleKey: 'guide.step3Title', descKey: 'guide.step3Desc', color: '#10b981' },
    { icon: BadgeCheck, titleKey: 'guide.step4Title', descKey: 'guide.step4Desc', color: '#f59e0b' },
  ] as const;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
        <div className="p-6 pb-4 text-center" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)' }}>
          <button onClick={handleClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/20 transition-colors">
            <X className="w-5 h-5" style={{ color: '#ffffff' }} />
          </button>
          <h2 className="text-2xl font-extrabold mb-1" style={{ color: '#ffffff' }}>{t('guide.title')}</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{t('guide.subtitle')}</p>
        </div>
        <div className="p-6 space-y-4">
          {steps.map(({ icon: SIcon, titleKey, descKey, color }) => (
            <div key={titleKey} className="flex items-start gap-4 p-3 rounded-xl" style={{ backgroundColor: '#f8fafc' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                <SIcon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <h4 className="font-bold text-sm" style={{ color: '#0f172a' }}>{t(titleKey)}</h4>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{t(descKey)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 pb-6 flex flex-col gap-3">
          <button onClick={handleClose} className="w-full py-3 rounded-xl font-bold text-base transition-all hover:scale-[1.02]" style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}>
            {t('guide.gotIt')}
          </button>
          <label className="flex items-center justify-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={dontShow} onChange={(e) => setDontShow(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
            <span className="text-xs" style={{ color: '#9ca3af' }}>{t('guide.dontShowAgain')}</span>
          </label>
        </div>
      </div>
    </div>
  );
}

/* ─── Lead Capture Popup ──────────────────────────────── */
function LeadPopup({ onClose, t }: { onClose: () => void; t: (k: any) => string }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/newsletter/subscribe', { email }).catch(() => {});
      setSent(true);
      localStorage.setItem('kh_lead_captured', 'true');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-1 rounded-lg hover:bg-gray-100 transition-colors">
          <X className="w-5 h-5" style={{ color: '#64748b' }} />
        </button>

        <div className="p-8 text-center" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
            <Sparkles className="w-8 h-8" style={{ color: '#ffffff' }} />
          </div>
          <h3 className="text-2xl font-extrabold mb-2" style={{ color: '#ffffff' }}>{t('landing.popupTitle')}</h3>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{t('landing.popupDesc')}</p>
        </div>

        <div className="p-6">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: '#10b981' }} />
              <p className="font-bold text-lg" style={{ color: '#0f172a' }}>{t('landing.popupSuccess')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder={t('landing.popupEmail')}
                className="w-full px-4 py-3 rounded-xl text-sm border"
                style={{ borderColor: '#e2e8f0', color: '#0f172a' }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <button
                onClick={handleSubmit} disabled={loading || !email}
                className="w-full py-3 rounded-xl font-bold text-base transition-all hover:scale-[1.02] disabled:opacity-50"
                style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
              >
                {loading ? '...' : t('landing.popupButton')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Star Rating Component ───────────────────────────── */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className="w-4 h-4" style={{ color: i <= rating ? '#f59e0b' : '#d1d5db', fill: i <= rating ? '#f59e0b' : 'none' }} />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t, locale, setLocale, dir } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [showGuide, setShowGuide] = useState(false);
  const [showLeadPopup, setShowLeadPopup] = useState(false);
  const [stats, setStats] = useState({ students: 0, courses: 0, satisfaction: 0 });
  const [courses, setCourses] = useState<FeaturedCourse[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const isDark = theme === 'dark' || theme === 'ocean' || theme === 'emerald' || theme === 'sunset';

  useEffect(() => {
    if (user) {
      router.replace(user.role === 'admin' ? '/dashboard/admin' : '/dashboard/student');
    }
  }, [user, router]);

  // Fetch all public data
  useEffect(() => {
    api.get('/public/stats').then(({ data }) => setStats(data)).catch(() => {});
    api.get('/public/featured-courses').then(({ data }) => setCourses(data)).catch(() => {});
    api.get('/public/reviews').then(({ data }) => setReviews(data)).catch(() => {});
  }, []);

  // Show guide on first visit
  useEffect(() => {
    const dismissed = localStorage.getItem('kh_guide_dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => setShowGuide(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Show lead popup after 15s (if not already captured)
  useEffect(() => {
    const captured = localStorage.getItem('kh_lead_captured');
    if (!captured) {
      const timer = setTimeout(() => setShowLeadPopup(true), 15000);
      return () => clearTimeout(timer);
    }
  }, []);

  /* ─── Color palette ─── */
  const c = isDark ? {
    pageBg: '#0a1628', navBg: '#0b1426',
    heroBg: '#0f1d32', heroText: '#ffffff', heroSub: 'rgba(255,255,255,0.7)',
    statValue: '#60a5fa', statLabel: 'rgba(255,255,255,0.6)',
    sectionBg: '#111d33', sectionAltBg: '#0d1829',
    sectionTitle: '#ffffff', sectionDesc: 'rgba(255,255,255,0.6)',
    cardBg: '#162038', cardBorder: 'rgba(255,255,255,0.08)',
    cardTitle: '#ffffff', cardDesc: 'rgba(255,255,255,0.6)',
    footerBg: '#0b1426', footerBorder: 'rgba(255,255,255,0.08)', footerText: 'rgba(255,255,255,0.4)',
    browseBtnBorder: 'rgba(255,255,255,0.25)', browseBtnText: '#ffffff',
    inputBg: '#162038', inputBorder: 'rgba(255,255,255,0.12)', inputText: '#ffffff',
  } : {
    pageBg: '#ffffff', navBg: '#0b1426',
    heroBg: '#ffffff', heroText: '#0f172a', heroSub: '#64748b',
    statValue: '#1e3a5f', statLabel: '#6b7280',
    sectionBg: '#f8fafc', sectionAltBg: '#ffffff',
    sectionTitle: '#0f172a', sectionDesc: '#64748b',
    cardBg: '#ffffff', cardBorder: '#e5e7eb',
    cardTitle: '#0f172a', cardDesc: '#64748b',
    footerBg: '#0b1426', footerBorder: 'rgba(255,255,255,0.08)', footerText: 'rgba(255,255,255,0.4)',
    browseBtnBorder: '#d1d5db', browseBtnText: '#1e293b',
    inputBg: '#ffffff', inputBorder: '#e2e8f0', inputText: '#0f172a',
  };

  const colorMap: Record<string, { bg: string; iconColor: string }> = {
    blue:    { bg: isDark ? 'rgba(37,99,235,0.15)' : '#eff6ff', iconColor: '#2563eb' },
    purple:  { bg: isDark ? 'rgba(124,58,237,0.15)' : '#f5f3ff', iconColor: '#7c3aed' },
    emerald: { bg: isDark ? 'rgba(5,150,105,0.15)' : '#ecfdf5', iconColor: '#059669' },
    amber:   { bg: isDark ? 'rgba(217,119,6,0.15)' : '#fffbeb', iconColor: '#d97706' },
  };

  const featureTitleKeys = ['landing.feat1Title', 'landing.feat2Title', 'landing.feat3Title', 'landing.feat4Title'] as const;
  const featureDescKeys = ['landing.feat1Desc', 'landing.feat2Desc', 'landing.feat3Desc', 'landing.feat4Desc'] as const;

  return (
    <div className="min-h-screen" dir={dir} style={{ backgroundColor: c.pageBg }}>

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} t={t} />}
      {showLeadPopup && <LeadPopup onClose={() => { setShowLeadPopup(false); localStorage.setItem('kh_lead_captured', 'true'); }} t={t} />}

      {/* ══════════════════ NAVBAR ══════════════════ */}
      <nav style={{ backgroundColor: c.navBg, borderBottom: '1px solid rgba(255,255,255,0.08)' }} className="px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Image src="/logo-nav-w.png" alt="Knowlytics Hub" width={140} height={56} className="object-contain" priority />
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={() => setShowGuide(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.8)' }} title="Guide">
              <HelpCircle className="w-4 h-4" />
            </button>
            <button onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.8)' }}>
              <Languages className="w-4 h-4" />
              <span className="hidden sm:inline">{locale === 'ar' ? 'EN' : 'عربي'}</span>
            </button>
            <button onClick={() => setTheme(isDark ? 'light' : 'dark')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <a href="https://wa.me/201226929392" target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: '#4ade80' }}>
              {t('landing.whatsapp')}
            </a>
            <Link href="/login" className="text-sm px-4 sm:px-5 py-2.5 rounded-xl font-semibold transition-all duration-200" style={{ color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }}>
              {t('landing.signIn')}
            </Link>
            <Link href="/register" className="text-sm px-4 sm:px-5 py-2.5 rounded-xl font-semibold transition-all duration-200" style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}>
              {t('landing.getStarted')}
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════ HERO ══════════════════ */}
      <section className="relative overflow-hidden" style={{ backgroundColor: c.heroBg }}>
        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-8"
               style={{ backgroundColor: isDark ? 'rgba(37,99,235,0.15)' : '#eff6ff', border: `1px solid ${isDark ? 'rgba(59,130,246,0.3)' : '#bfdbfe'}` }}>
            <Star className="w-4 h-4" style={{ color: '#2563eb' }} />
            <span className="text-sm font-semibold" style={{ color: '#2563eb' }}>{t('landing.badge')}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight" style={{ color: c.heroText }}>
            {t('landing.heroTitle1')}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600">
              {t('landing.heroTitle2')}
            </span>
          </h1>
          <p className="text-xl max-w-2xl mx-auto mb-12 leading-relaxed" style={{ color: c.heroSub }}>
            {t('landing.heroDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="text-base px-8 py-4 rounded-xl font-bold inline-flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02]"
                  style={{ backgroundColor: '#1e3a5f', color: '#ffffff', boxShadow: '0 8px 30px rgba(30,58,95,0.25)' }}>
              {t('landing.startFree')} <ChevronRight className="w-5 h-5" />
            </Link>
            <Link href="/courses" className="text-base px-8 py-4 rounded-xl font-semibold inline-flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02]"
                  style={{ color: c.browseBtnText, border: `2px solid ${c.browseBtnBorder}` }}>
              {t('landing.browseCourses')}
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════ STATS ══════════════════ */}
      <section style={{ backgroundColor: c.heroBg }} className="py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: stats.students > 0 ? `+${stats.students.toLocaleString()}` : '—', key: 'landing.statStudents' as const },
            { value: stats.courses > 0 ? `${stats.courses}` : '—', key: 'landing.statCourses' as const },
            { value: Number(stats.satisfaction) > 0 ? `${stats.satisfaction}/5` : '—', key: 'landing.statSatisfaction' as const },
            { value: '24/7', key: 'landing.statSupport' as const },
          ].map((s) => (
            <div key={s.key} className="text-center">
              <p className="text-4xl md:text-5xl font-extrabold mb-2" style={{ color: c.statValue }}>{s.value}</p>
              <p className="text-sm font-medium" style={{ color: c.statLabel }}>{t(s.key)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════ FEATURED COURSES ══════════════════ */}
      {courses.length > 0 && (
        <section className="py-24" style={{ backgroundColor: c.sectionBg }}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold mb-3" style={{ color: c.sectionTitle }}>
                  {t('landing.coursesTitle')}
                </h2>
                <p className="text-lg" style={{ color: c.sectionDesc }}>{t('landing.coursesDesc')}</p>
              </div>
              <Link href="/courses" className="hidden md:inline-flex items-center gap-1 text-sm font-semibold transition-colors hover:opacity-80" style={{ color: '#3b82f6' }}>
                {t('landing.viewAll')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`}
                      className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02] group flex flex-col"
                      style={{ backgroundColor: c.cardBg, border: `1px solid ${c.cardBorder}` }}>
                  {/* Thumbnail */}
                  <div className="w-full h-44 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 50%, #7c3aed 100%)' }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-12 h-12" style={{ color: 'rgba(255,255,255,0.3)' }} />
                    </div>
                    {/* Type badge */}
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold"
                         style={{ backgroundColor: course.type === 'live' ? '#7c3aed' : '#2563eb', color: '#ffffff' }}>
                      {course.type === 'live' ? 'LIVE' : 'ONLINE'}
                    </div>
                    {/* Price badge */}
                    <div className="absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-bold"
                         style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#ffffff' }}>
                      {formatPrice(course.price)}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-base mb-2 line-clamp-2 group-hover:opacity-80 transition-opacity" style={{ color: c.cardTitle }}>
                      {course.title}
                    </h3>
                    <p className="text-sm line-clamp-2 mb-4 flex-1" style={{ color: c.cardDesc }}>
                      {course.description}
                    </p>

                    <div className="flex items-center justify-between text-xs mb-3" style={{ color: c.cardDesc }}>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {course.duration_hours} {t('landing.hours')}</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {course.enrollment_count} {t('landing.students')}</span>
                      {course.avg_rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5" style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                          {parseFloat(String(course.avg_rating)).toFixed(1)}
                        </span>
                      )}
                    </div>

                    <div className="pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${c.cardBorder}` }}>
                      <span className="text-xs" style={{ color: c.cardDesc }}>{course.instructor_name}</span>
                      <span className="text-sm font-bold px-4 py-1.5 rounded-lg transition-colors"
                            style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}>
                        {t('landing.enrollNow')}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-8 text-center md:hidden">
              <Link href="/courses" className="inline-flex items-center gap-1 text-sm font-semibold" style={{ color: '#3b82f6' }}>
                {t('landing.viewAll')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════ HOW IT WORKS (Always Dark) ══════════════════ */}
      <section className="py-16 relative overflow-hidden" style={{ backgroundColor: '#0b1426' }}>
        <div className="absolute inset-0 opacity-[0.05]">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-12" style={{ color: '#ffffff' }}>
            {t('landing.howTitle')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: UserPlus, titleKey: 'landing.howStep1Title' as const, descKey: 'landing.howStep1Desc' as const, num: '1', color: '#3b82f6' },
              { icon: BookOpen, titleKey: 'landing.howStep2Title' as const, descKey: 'landing.howStep2Desc' as const, num: '2', color: '#8b5cf6' },
              { icon: PlayCircle, titleKey: 'landing.howStep3Title' as const, descKey: 'landing.howStep3Desc' as const, num: '3', color: '#10b981' },
              { icon: BadgeCheck, titleKey: 'landing.howStep4Title' as const, descKey: 'landing.howStep4Desc' as const, num: '4', color: '#f59e0b' },
            ].map(({ icon: SIcon, titleKey, descKey, num, color }) => (
              <div key={titleKey} className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 relative" style={{ backgroundColor: `${color}20` }}>
                  <SIcon className="w-7 h-7" style={{ color }} />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: color, color: '#ffffff' }}>{num}</span>
                </div>
                <h3 className="font-bold text-sm mb-1" style={{ color: '#ffffff' }}>{t(titleKey)}</h3>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURES ══════════════════ */}
      <section className="py-24" style={{ backgroundColor: c.sectionAltBg }}>
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4" style={{ color: c.sectionTitle }}>
            {t('landing.featuresTitle')}
          </h2>
          <p className="text-center mb-16 max-w-xl mx-auto text-lg" style={{ color: c.sectionDesc }}>
            {t('landing.featuresDesc')}
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureIcons.map((Icon, i) => {
              const cm = colorMap[featureColors[i]];
              return (
                <div key={i} className="rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group"
                     style={{ backgroundColor: c.cardBg, border: `1px solid ${c.cardBorder}` }}>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110" style={{ backgroundColor: cm.bg }}>
                    <Icon className="w-7 h-7" style={{ color: cm.iconColor }} />
                  </div>
                  <h3 className="font-bold text-lg mb-2" style={{ color: c.cardTitle }}>{t(featureTitleKeys[i])}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: c.cardDesc }}>{t(featureDescKeys[i])}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════ REVIEWS / TESTIMONIALS ══════════════════ */}
      {reviews.length > 0 && (
        <section className="py-24" style={{ backgroundColor: c.sectionBg }}>
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4" style={{ color: c.sectionTitle }}>
              {t('landing.reviewsTitle')}
            </h2>
            <p className="text-center mb-16 text-lg" style={{ color: c.sectionDesc }}>
              {t('landing.reviewsDesc')}
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.slice(0, 6).map((review, i) => (
                <div key={i} className="rounded-2xl p-6 transition-all duration-300 hover:shadow-lg"
                     style={{ backgroundColor: c.cardBg, border: `1px solid ${c.cardBorder}` }}>
                  <Quote className="w-8 h-8 mb-4 opacity-20" style={{ color: '#3b82f6' }} />
                  <p className="text-sm leading-relaxed mb-5" style={{ color: c.cardDesc }}>
                    &ldquo;{review.comment}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                         style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.2)' : '#eff6ff', color: '#2563eb' }}>
                      {review.user_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: c.cardTitle }}>{review.user_name}</p>
                      <p className="text-xs truncate" style={{ color: c.cardDesc }}>{review.course_title}</p>
                    </div>
                    <Stars rating={review.rating} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════ WHY KNOWLYTICS (Always Dark) ══════════════════ */}
      <section className="py-24 relative overflow-hidden" style={{ backgroundColor: '#060e1e' }}>
        <div className="absolute inset-0 opacity-[0.06]">
          <div className="absolute top-10 right-20 w-80 h-80 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-16" style={{ color: '#ffffff' }}>
            {t('landing.whyTitle')}
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {[
              { icon: GraduationCap, titleKey: 'landing.why1Title' as const, descKey: 'landing.why1Desc' as const, iconColor: '#60a5fa', iconBg: 'rgba(59,130,246,0.15)' },
              { icon: Globe, titleKey: 'landing.why2Title' as const, descKey: 'landing.why2Desc' as const, iconColor: '#34d399', iconBg: 'rgba(16,185,129,0.15)' },
              { icon: Clock, titleKey: 'landing.why3Title' as const, descKey: 'landing.why3Desc' as const, iconColor: '#a78bfa', iconBg: 'rgba(139,92,246,0.15)' },
            ].map(({ icon: WIcon, titleKey, descKey, iconColor, iconBg }) => (
              <div key={titleKey} className="text-center px-4">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: iconBg }}>
                  <WIcon className="w-8 h-8" style={{ color: iconColor }} />
                </div>
                <h3 className="font-bold text-xl mb-3" style={{ color: '#ffffff' }}>{t(titleKey)}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ FOUNDER STORY ══════════════════ */}
      <section className="py-24" style={{ backgroundColor: c.sectionAltBg }}>
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-16" style={{ color: c.sectionTitle }}>
            {t('landing.founderTitle')}
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-12">
            {/* Founder image placeholder */}
            <div className="w-48 h-48 md:w-64 md:h-64 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
                 style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)' }}>
              <GraduationCap className="w-20 h-20" style={{ color: 'rgba(255,255,255,0.3)' }} />
            </div>
            <div className="text-center md:text-start flex-1">
              <h3 className="text-2xl font-extrabold mb-1" style={{ color: c.sectionTitle }}>
                {t('landing.founderName')}
              </h3>
              <p className="text-sm font-medium mb-6" style={{ color: '#3b82f6' }}>
                {t('landing.founderRole')}
              </p>
              <p className="text-base leading-relaxed mb-6" style={{ color: c.sectionDesc }}>
                {t('landing.founderStory')}
              </p>
              <blockquote className="relative px-6 py-4 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
                <Quote className="w-5 h-5 mb-2" style={{ color: '#3b82f6' }} />
                <p className="text-sm font-medium italic" style={{ color: c.sectionTitle }}>
                  &ldquo;{t('landing.founderQuote')}&rdquo;
                </p>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ CTA ══════════════════ */}
      <section style={{ backgroundColor: c.pageBg }} className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
               style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 50%, #7c3aed 100%)' }}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: '#ffffff' }}>
                {t('landing.ctaTitle')}
              </h2>
              <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {t('landing.ctaDesc')}
              </p>
              <Link href="/register" className="inline-flex items-center gap-2 font-bold px-10 py-4 rounded-xl text-lg transition-all duration-200 hover:scale-[1.03] shadow-xl"
                    style={{ backgroundColor: '#ffffff', color: '#1e3a5f' }}>
                {t('landing.ctaButton')} <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ FOOTER (Enhanced — Always Dark) ══════════════════ */}
      <footer style={{ backgroundColor: '#0b1426', borderTop: '1px solid rgba(255,255,255,0.08)' }} className="pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Col 1: Logo + desc */}
            <div className="md:col-span-1">
              <Image src="/logo-nav-w.png" alt="Knowlytics Hub" width={140} height={56} className="object-contain mb-4" />
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {t('landing.heroDesc')}
              </p>
            </div>

            {/* Col 2: Quick Links */}
            <div>
              <h4 className="font-bold text-sm mb-4" style={{ color: '#ffffff' }}>{t('landing.footerQuickLinks')}</h4>
              <div className="space-y-2">
                {[
                  { href: '/courses', label: t('nav.courses') },
                  { href: '/register', label: t('auth.signUp') },
                  { href: '/login', label: t('auth.signIn') },
                ].map(link => (
                  <Link key={link.href} href={link.href} className="block text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Col 3: Legal */}
            <div>
              <h4 className="font-bold text-sm mb-4" style={{ color: '#ffffff' }}>{t('landing.footerAbout')}</h4>
              <div className="space-y-2">
                {[
                  { label: t('landing.footerPrivacy') },
                  { label: t('landing.footerTerms') },
                  { label: t('landing.footerRefund') },
                ].map(item => (
                  <p key={item.label} className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {item.label}
                  </p>
                ))}
              </div>
            </div>

            {/* Col 4: Contact + Social */}
            <div>
              <h4 className="font-bold text-sm mb-4" style={{ color: '#ffffff' }}>{t('landing.footerContact')}</h4>
              <a href="mailto:Sales@knowlyticshub.com" className="block text-sm mb-4 transition-colors hover:text-white" style={{ color: '#3b82f6' }}>
                Sales@knowlyticshub.com
              </a>
              <a href="https://wa.me/201226929392" target="_blank" rel="noreferrer" className="block text-sm mb-6 transition-colors" style={{ color: '#4ade80' }}>
                +20 122 692 9392
              </a>
              <h4 className="font-bold text-sm mb-3" style={{ color: '#ffffff' }}>{t('landing.footerSocial')}</h4>
              <div className="flex gap-3">
                {[
                  { icon: Facebook, href: '#' },
                  { icon: Instagram, href: '#' },
                  { icon: Linkedin, href: '#' },
                  { icon: Youtube, href: '#' },
                ].map(({ icon: SIcon, href }, i) => (
                  <a key={i} href={href} target="_blank" rel="noreferrer"
                     className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                     style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <SIcon className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.6)' }} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
              &copy; {new Date().getFullYear()} Knowlytics Hub. {t('landing.footerRights')}.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
