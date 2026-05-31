'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Video, Award, ChevronRight, Star, Zap, Shield, ArrowRight,
  GraduationCap, Clock, Globe, Sun, Moon, Languages,
  UserPlus, BookOpen, PlayCircle, BadgeCheck, X, HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';

const featureIcons = [Video, Zap, Shield, Award];
const featureColors = ['blue', 'purple', 'emerald', 'amber'];

// ─── Onboarding Guide Modal ────────────────────────────
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
        {/* Header */}
        <div className="p-6 pb-4 text-center" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)' }}>
          <button onClick={handleClose} className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/20 transition-colors">
            <X className="w-5 h-5" style={{ color: '#ffffff' }} />
          </button>
          <h2 className="text-2xl font-extrabold mb-1" style={{ color: '#ffffff' }}>{t('guide.title')}</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{t('guide.subtitle')}</p>
        </div>

        {/* Steps */}
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

        {/* Footer */}
        <div className="px-6 pb-6 flex flex-col gap-3">
          <button
            onClick={handleClose}
            className="w-full py-3 rounded-xl font-bold text-base transition-all hover:scale-[1.02]"
            style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}
          >
            {t('guide.gotIt')}
          </button>
          <label className="flex items-center justify-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShow}
              onChange={(e) => setDontShow(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-xs" style={{ color: '#9ca3af' }}>{t('guide.dontShowAgain')}</span>
          </label>
        </div>
      </div>
    </div>
  );
}

// ─── Main Landing Page ─────────────────────────────────
export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t, locale, setLocale, dir } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [showGuide, setShowGuide] = useState(false);

  const isDark = theme === 'dark' || theme === 'ocean' || theme === 'emerald' || theme === 'sunset';

  useEffect(() => {
    if (user) {
      router.replace(user.role === 'admin' ? '/dashboard/admin' : '/dashboard/student');
    }
  }, [user, router]);

  // Show guide on first visit (if not dismissed)
  useEffect(() => {
    const dismissed = localStorage.getItem('kh_guide_dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => setShowGuide(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const colors = isDark ? {
    pageBg: '#0a1628',
    navBg: '#0b1426',
    heroBg: '#0f1d32',
    heroText: '#ffffff',
    heroSub: 'rgba(255,255,255,0.7)',
    statValue: '#60a5fa',
    statLabel: 'rgba(255,255,255,0.6)',
    sectionBg: '#111d33',
    sectionTitle: '#ffffff',
    sectionDesc: 'rgba(255,255,255,0.6)',
    cardBg: '#162038',
    cardBorder: 'rgba(255,255,255,0.08)',
    cardTitle: '#ffffff',
    cardDesc: 'rgba(255,255,255,0.6)',
    footerBg: '#0b1426',
    footerBorder: 'rgba(255,255,255,0.08)',
    footerText: 'rgba(255,255,255,0.4)',
    browseBtnBorder: 'rgba(255,255,255,0.25)',
    browseBtnText: '#ffffff',
  } : {
    pageBg: '#ffffff',
    navBg: '#0b1426',
    heroBg: '#ffffff',
    heroText: '#0f172a',
    heroSub: '#64748b',
    statValue: '#1e3a5f',
    statLabel: '#6b7280',
    sectionBg: '#f8fafc',
    sectionTitle: '#0f172a',
    sectionDesc: '#64748b',
    cardBg: '#ffffff',
    cardBorder: '#e5e7eb',
    cardTitle: '#0f172a',
    cardDesc: '#64748b',
    footerBg: '#ffffff',
    footerBorder: '#e5e7eb',
    footerText: '#9ca3af',
    browseBtnBorder: '#d1d5db',
    browseBtnText: '#1e293b',
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
    <div className="min-h-screen" dir={dir} style={{ backgroundColor: colors.pageBg }}>

      {/* ── Guide Modal ── */}
      {showGuide && <GuideModal onClose={() => setShowGuide(false)} t={t} />}

      {/* ── Navbar ── */}
      <nav style={{ backgroundColor: colors.navBg, borderBottom: '1px solid rgba(255,255,255,0.08)' }} className="px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Image src="/logo-white.png" alt="Knowlytics Hub" width={48} height={52} className="object-contain" priority />
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Guide Button */}
            <button
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.8)' }}
              title="Guide"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.8)' }}
              title={locale === 'ar' ? 'Switch to English' : 'Switch to Arabic'}
            >
              <Languages className="w-4 h-4" />
              <span className="hidden sm:inline">{locale === 'ar' ? 'EN' : 'عربي'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.8)' }}
              title={isDark ? 'Light mode' : 'Dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <a href="https://wa.me/201226929392" target="_blank" rel="noreferrer"
               className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium"
               style={{ color: '#4ade80' }}>
              {t('landing.whatsapp')}
            </a>
            <Link href="/login"
                  className="text-sm px-4 sm:px-5 py-2.5 rounded-xl font-semibold transition-all duration-200"
                  style={{ color: '#ffffff', border: '1px solid rgba(255,255,255,0.2)' }}>
              {t('landing.signIn')}
            </Link>
            <Link href="/register"
                  className="text-sm px-4 sm:px-5 py-2.5 rounded-xl font-semibold transition-all duration-200"
                  style={{ backgroundColor: '#3b82f6', color: '#ffffff' }}>
              {t('landing.getStarted')}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ backgroundColor: colors.heroBg }}>
        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-8"
               style={{ backgroundColor: isDark ? 'rgba(37,99,235,0.15)' : '#eff6ff', border: `1px solid ${isDark ? 'rgba(59,130,246,0.3)' : '#bfdbfe'}` }}>
            <Star className="w-4 h-4" style={{ color: '#2563eb' }} />
            <span className="text-sm font-semibold" style={{ color: '#2563eb' }}>{t('landing.badge')}</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight" style={{ color: colors.heroText }}>
            {t('landing.heroTitle1')}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600">
              {t('landing.heroTitle2')}
            </span>
          </h1>

          <p className="text-xl max-w-2xl mx-auto mb-12 leading-relaxed" style={{ color: colors.heroSub }}>
            {t('landing.heroDesc')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register"
                  className="text-base px-8 py-4 rounded-xl font-bold inline-flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02]"
                  style={{ backgroundColor: '#1e3a5f', color: '#ffffff', boxShadow: '0 8px 30px rgba(30,58,95,0.25)' }}>
              {t('landing.startFree')} <ChevronRight className="w-5 h-5" />
            </Link>
            <Link href="/courses"
                  className="text-base px-8 py-4 rounded-xl font-semibold inline-flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.02]"
                  style={{ color: colors.browseBtnText, border: `2px solid ${colors.browseBtnBorder}` }}>
              {t('landing.browseCourses')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section style={{ backgroundColor: colors.heroBg }} className="py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '+10,000', key: 'landing.statStudents' as const },
            { value: '+150', key: 'landing.statCourses' as const },
            { value: '98%', key: 'landing.statSatisfaction' as const },
            { value: '24/7', key: 'landing.statSupport' as const },
          ].map((s) => (
            <div key={s.key} className="text-center">
              <p className="text-4xl md:text-5xl font-extrabold mb-2" style={{ color: colors.statValue }}>{s.value}</p>
              <p className="text-sm font-medium" style={{ color: colors.statLabel }}>{t(s.key)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works (Dark Strip — always dark in both themes) ── */}
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
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 relative"
                     style={{ backgroundColor: `${color}20` }}>
                  <SIcon className="w-7 h-7" style={{ color }} />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: color, color: '#ffffff' }}>{num}</span>
                </div>
                <h3 className="font-bold text-sm mb-1" style={{ color: '#ffffff' }}>{t(titleKey)}</h3>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{t(descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24" style={{ backgroundColor: colors.sectionBg }}>
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-4" style={{ color: colors.sectionTitle }}>
            {t('landing.featuresTitle')}
          </h2>
          <p className="text-center mb-16 max-w-xl mx-auto text-lg" style={{ color: colors.sectionDesc }}>
            {t('landing.featuresDesc')}
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featureIcons.map((Icon, i) => {
              const c = colorMap[featureColors[i]];
              return (
                <div key={i}
                     className="rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group"
                     style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}>
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                       style={{ backgroundColor: c.bg }}>
                    <Icon className="w-7 h-7" style={{ color: c.iconColor }} />
                  </div>
                  <h3 className="font-bold text-lg mb-2" style={{ color: colors.cardTitle }}>{t(featureTitleKeys[i])}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: colors.cardDesc }}>{t(featureDescKeys[i])}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Why Knowlytics (Always Dark) ── */}
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
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                     style={{ backgroundColor: iconBg }}>
                  <WIcon className="w-8 h-8" style={{ color: iconColor }} />
                </div>
                <h3 className="font-bold text-xl mb-3" style={{ color: '#ffffff' }}>{t(titleKey)}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {t(descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ backgroundColor: colors.pageBg }} className="py-24">
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
              <Link href="/register"
                    className="inline-flex items-center gap-2 font-bold px-10 py-4 rounded-xl text-lg transition-all duration-200 hover:scale-[1.03] shadow-xl"
                    style={{ backgroundColor: '#ffffff', color: '#1e3a5f' }}>
                {t('landing.ctaButton')} <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: `1px solid ${colors.footerBorder}`, backgroundColor: colors.footerBg }} className="py-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Image src={isDark ? '/logo-white.png' : '/logo-dark.png'} alt="Knowlytics Hub" width={44} height={48} className="object-contain opacity-80" />
            <p className="text-sm" style={{ color: colors.footerText }}>
              &copy; {new Date().getFullYear()} Knowlytics Hub. All rights reserved.
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
