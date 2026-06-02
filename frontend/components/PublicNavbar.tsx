'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Languages, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

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
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav style={{ backgroundColor: '#0b1426', borderBottom: '1px solid rgba(255,255,255,0.08)' }} className="px-6 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Image src="/logo-nav-w.png" alt="Knowlytics Hub" width={130} height={52} className="object-contain" priority />
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(link => {
            const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: isActive ? '#3b82f6' : 'rgba(255,255,255,0.7)', backgroundColor: isActive ? 'rgba(59,130,246,0.1)' : 'transparent' }}>
                {isAr ? link.labelAr : link.labelEn}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <button onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-sm font-medium hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.7)' }}>
            <Languages className="w-4 h-4" />
            <span className="hidden sm:inline">{locale === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          <a href="https://wa.me/201226929392" target="_blank" rel="noreferrer"
            className="hidden md:inline-flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10"
            style={{ color: '#4ade80' }}>
            {t('landing.whatsapp')}
          </a>

          {user ? (
            <Link href={user.role === 'admin' ? '/dashboard/admin' : '/dashboard/student'}
              className="text-sm px-4 py-2 rounded-xl font-semibold" style={{ backgroundColor: '#3b82f6', color: '#fff' }}>
              {t('nav.dashboard')}
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex text-sm px-4 py-2 rounded-xl font-semibold"
                style={{ color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                {t('landing.signIn')}
              </Link>
              <Link href="/register" className="text-sm px-4 py-2 rounded-xl font-semibold"
                style={{ backgroundColor: '#3b82f6', color: '#fff' }}>
                {t('landing.getStarted')}
              </Link>
            </>
          )}

          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden p-2 rounded-lg hover:bg-white/10">
            {menuOpen ? <X className="w-5 h-5" style={{ color: '#fff' }} /> : <Menu className="w-5 h-5" style={{ color: '#fff' }} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden mt-3 pb-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex flex-col gap-1 pt-3">
            {NAV_LINKS.map(link => {
              const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-medium"
                  style={{ color: isActive ? '#3b82f6' : 'rgba(255,255,255,0.7)', backgroundColor: isActive ? 'rgba(59,130,246,0.1)' : 'transparent' }}>
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
