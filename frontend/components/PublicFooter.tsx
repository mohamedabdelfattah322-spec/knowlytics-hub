'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useTheme } from '@/hooks/useTheme';

export default function PublicFooter() {
  const { t, isAr } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme !== 'light';

  return (
    <footer className="pub-page pt-14 pb-8" style={{ borderTop: '1px solid var(--pub-card-border)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div>
            <Image src={isDark ? '/logo-nav-w.png' : '/logo-dark.png'} alt="Knowlytics Hub" width={130} height={52} className="object-contain mb-4" />
            <p className="pub-text-faint text-xs leading-relaxed">
              {isAr ? 'منصة تحليل البيانات الرائدة في العالم العربي. كورسات عملية من الصفر للاحتراف.' : 'The leading data analysis platform in the Arab world. Practical courses from zero to mastery.'}
            </p>
          </div>
          <div>
            <h4 className="pub-text font-bold text-sm mb-4">{t('landing.footerQuickLinks')}</h4>
            <div className="space-y-2">
              {[
                { href: '/courses', label: isAr ? 'الكورسات' : 'Courses' },
                { href: '/reviews', label: isAr ? 'آراء العملاء' : 'Reviews' },
                { href: '/about', label: isAr ? 'تعرّف على مدربنا' : 'Our Instructor' },
                { href: '/contact', label: isAr ? 'تواصل معنا' : 'Contact' },
              ].map(link => (
                <Link key={link.href} href={link.href} className="pub-text-faint block text-sm hover:opacity-80 transition-opacity">{link.label}</Link>
              ))}
              <a href="https://knowlyticshub.com" target="_blank" rel="noreferrer" className="pub-accent block text-sm hover:opacity-80 transition-opacity">
                {t('landing.footerMainSite')} ↗
              </a>
            </div>
          </div>
          <div>
            <h4 className="pub-text font-bold text-sm mb-4">{t('landing.footerAbout')}</h4>
            <div className="space-y-2">
              {[t('landing.footerPrivacy'), t('landing.footerTerms'), t('landing.footerRefund')].map(l => (
                <p key={l} className="pub-text-faint text-sm">{l}</p>
              ))}
            </div>
          </div>
          <div>
            <h4 className="pub-text font-bold text-sm mb-4">{t('landing.footerContact')}</h4>
            <a href="mailto:Sales@knowlyticshub.com" className="pub-accent block text-sm mb-3">Sales@knowlyticshub.com</a>
            <a href="https://wa.me/201226929392" target="_blank" rel="noreferrer" className="block text-sm mb-5" style={{ color: '#4ade80' }}>+20 122 692 9392</a>
            <div className="flex gap-3">
              {[Facebook, Instagram, Linkedin, Youtube].map((SIcon, i) => (
                <a key={i} href="#" target="_blank" rel="noreferrer" className="pub-stat w-9 h-9 rounded-lg flex items-center justify-center hover:scale-110 transition-transform">
                  <SIcon className="w-4 h-4 pub-text-muted" />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="pt-6 text-center" style={{ borderTop: '1px solid var(--pub-card-border)' }}>
          <p className="pub-text-faint text-xs">&copy; {new Date().getFullYear()} Knowlytics Hub. {t('landing.footerRights')}.</p>
        </div>
      </div>
    </footer>
  );
}
