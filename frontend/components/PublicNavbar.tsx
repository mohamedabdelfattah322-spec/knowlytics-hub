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

export default function PublicNavbar() {
  const { user } = useAuth();
  const { t, locale, setLocale, isAr } = useLanguage();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const isDark = theme !== 'light';

  return (
    <nav className="pub-nav px-6 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="shrink-0">
          <Image src={isDark ? '/logo-nav-w.png' : '/logo-dark.png'} alt="Knowlytics Hub" width={130} height={52} className="object-contain" priority />
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(link => {
            const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'pub-accent pub-badge' : 'pub-text-muted hover:opacity-80'}`}>
                {isAr ? link.labelAr : link.labelEn}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="pub-text-muted flex items-center px-2.5 py-2 rounded-lg text-sm font-medium hover:opacity-80">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
            className="pub-text-muted flex items-center gap-1 px-2.5 py-2 rounded-lg text-sm font-medium hover:opacity-80">
            <Languages className="w-4 h-4" />
            <span className="hidden sm:inline">{locale === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          <a href="https://wa.me/201226929392" target="_blank" rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-lg" style={{ color: '#4ade80' }}>
            {t('landing.whatsapp')}
          </a>

          {user ? (
            <Link href={user.role === 'admin' ? '/dashboard/admin' : '/dashboard/student'}
              className="pub-btn-primary text-sm px-4 py-2 rounded-xl font-semibold">
              {t('nav.dashboard')}
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex text-sm px-4 py-2 rounded-xl font-semibold pub-text-muted pub-btn-outline">
                {t('landing.signIn')}
              </Link>
              <Link href="/register" className="pub-btn-primary text-sm px-4 py-2 rounded-xl font-semibold">
                {t('landing.getStarted')}
              </Link>
            </>
          )}

          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 rounded-lg pub-text-muted hover:opacity-80">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden mt-3 pb-3" style={{ borderTop: '1px solid var(--pub-card-border)' }}>
          <div className="flex flex-col gap-1 pt-3">
            {NAV_LINKS.map(link => {
              const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'pub-accent pub-badge' : 'pub-text-muted'}`}>
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
