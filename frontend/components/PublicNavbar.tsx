'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Languages, Menu, X, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';

const NAV_LINKS = [
  { href: '/', labelAr: 'الرئيسية', labelEn: 'Home' },
  { href: '/courses', labelAr: 'الكورسات', labelEn: 'Courses' },
  { href: '/companies', labelAr: 'شركات تم تدريبها', labelEn: 'Companies Trained' },
  { href: '/reviews', labelAr: 'آراء العملاء', labelEn: 'Reviews' },
  { href: '/about', labelAr: 'تعرّف على مدربنا', labelEn: 'Our Instructor' },
  { href: '/contact', labelAr: 'تواصل معنا', labelEn: 'Contact' },
];

export function usePublicTheme() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark' || theme === 'ocean' || theme === 'emerald' || theme === 'sunset';
  const toggle = () => setTheme(isDark ? 'light' : 'dark');

  const c = isDark ? {
    pageBg: '#0a1628', navBg: '#0b1426', navBorder: 'rgba(255,255,255,0.08)',
    heroBg: '#0f1d32', sectionBg: '#111d33', sectionAltBg: '#0b1426', darkStripBg: '#060e1e',
    cardBg: '#162038', cardBorder: 'rgba(255,255,255,0.08)',
    text: '#ffffff', textSub: 'rgba(255,255,255,0.7)', textMuted: 'rgba(255,255,255,0.5)', textFaint: 'rgba(255,255,255,0.4)',
    accent: '#3b82f6', accentLight: '#60a5fa', accentBg: 'rgba(59,130,246,0.1)', accentBorder: 'rgba(59,130,246,0.2)',
    inputBg: '#0f1d32', inputBorder: 'rgba(255,255,255,0.1)',
    logoSrc: '/logo-nav-w.png',
    linkColor: 'rgba(255,255,255,0.7)', linkActive: '#3b82f6', linkActiveBg: 'rgba(59,130,246,0.1)',
    btnOutline: 'rgba(255,255,255,0.2)', btnOutlineText: '#ffffff',
    mobileHover: 'rgba(255,255,255,0.1)',
    menuIcon: '#ffffff',
    avatarBg: 'rgba(59,130,246,0.2)',
    statCardBg: 'rgba(255,255,255,0.03)', statCardBorder: 'rgba(255,255,255,0.06)',
    imgFilter: 'brightness(0) invert(0.8)',
  } : {
    pageBg: '#ffffff', navBg: '#ffffff', navBorder: '#e5e7eb',
    heroBg: '#f8fafc', sectionBg: '#f1f5f9', sectionAltBg: '#ffffff', darkStripBg: '#0b1426',
    cardBg: '#ffffff', cardBorder: '#e5e7eb',
    text: '#0f172a', textSub: '#475569', textMuted: '#64748b', textFaint: '#94a3b8',
    accent: '#2563eb', accentLight: '#2563eb', accentBg: '#eff6ff', accentBorder: '#bfdbfe',
    inputBg: '#ffffff', inputBorder: '#e2e8f0',
    logoSrc: '/logo-dark.png',
    linkColor: '#475569', linkActive: '#2563eb', linkActiveBg: '#eff6ff',
    btnOutline: '#d1d5db', btnOutlineText: '#1e293b',
    mobileHover: 'rgba(0,0,0,0.05)',
    menuIcon: '#1e293b',
    avatarBg: '#eff6ff',
    statCardBg: '#f8fafc', statCardBorder: '#e5e7eb',
    imgFilter: 'none',
  };

  return { isDark, toggle, c };
}

export default function PublicNavbar() {
  const { user } = useAuth();
  const { t, locale, setLocale, isAr } = useLanguage();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { isDark, toggle, c } = usePublicTheme();

  return (
    <nav style={{ backgroundColor: c.navBg, borderBottom: `1px solid ${c.navBorder}` }} className="px-6 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="shrink-0">
          <Image src={c.logoSrc} alt="Knowlytics Hub" width={130} height={52} className="object-contain" priority />
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(link => {
            const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: isActive ? c.linkActive : c.linkColor, backgroundColor: isActive ? c.linkActiveBg : 'transparent' }}>
                {isAr ? link.labelAr : link.labelEn}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button onClick={toggle}
            className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: c.linkColor }}
            title={isDark ? 'Light mode' : 'Dark mode'}>
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: c.linkColor }}>
            <Languages className="w-4 h-4" />
            <span className="hidden sm:inline">{locale === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          <a href="https://wa.me/201226929392" target="_blank" rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-lg"
            style={{ color: '#4ade80' }}>
            {t('landing.whatsapp')}
          </a>

          {user ? (
            <Link href={user.role === 'admin' ? '/dashboard/admin' : '/dashboard/student'}
              className="text-sm px-4 py-2 rounded-xl font-semibold" style={{ backgroundColor: c.accent, color: '#fff' }}>
              {t('nav.dashboard')}
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex text-sm px-4 py-2 rounded-xl font-semibold"
                style={{ color: c.btnOutlineText, border: `1px solid ${c.btnOutline}` }}>
                {t('landing.signIn')}
              </Link>
              <Link href="/register" className="text-sm px-4 py-2 rounded-xl font-semibold"
                style={{ backgroundColor: c.accent, color: '#fff' }}>
                {t('landing.getStarted')}
              </Link>
            </>
          )}

          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 rounded-lg">
            {menuOpen ? <X className="w-5 h-5" style={{ color: c.menuIcon }} /> : <Menu className="w-5 h-5" style={{ color: c.menuIcon }} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden mt-3 pb-3 border-t" style={{ borderColor: c.navBorder }}>
          <div className="flex flex-col gap-1 pt-3">
            {NAV_LINKS.map(link => {
              const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium"
                  style={{ color: isActive ? c.linkActive : c.linkColor, backgroundColor: isActive ? c.linkActiveBg : 'transparent' }}>
                  {isAr ? link.labelAr : link.labelEn}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
