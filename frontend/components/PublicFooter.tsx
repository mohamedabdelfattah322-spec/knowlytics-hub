'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export default function PublicFooter() {
  const { t, isAr } = useLanguage();

  return (
    <footer className="pub-page pt-14 pb-8" style={{ borderTop: '1px solid var(--pub-card-border)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div>
            <Image src="/logo-nav-w.png" alt="Knowlytics Hub" width={130} height={52} className="object-contain mb-4" />
            <p className="text-xs leading-relaxed" className="pub-text-faint">
              {isAr ? 'منصة تحليل البيانات الرائدة في العالم العربي. كورسات عملية من الصفر للاحتراف.' : 'The leading data analysis platform in the Arab world. Practical courses from zero to mastery.'}
            </p>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-4" className="pub-text">{t('landing.footerQuickLinks')}</h4>
            <div className="space-y-2">
              {[
                { href: '/courses', label: isAr ? 'الكورسات' : 'Courses' },
                { href: '/reviews', label: isAr ? 'آراء العملاء' : 'Reviews' },
                { href: '/about', label: isAr ? 'تعرّف على مدربنا' : 'Our Instructor' },
                { href: '/contact', label: isAr ? 'تواصل معنا' : 'Contact' },
              ].map(link => (
                <Link key={link.href} href={link.href} className="block text-sm hover:text-white transition-colors" className="pub-text-faint">{link.label}</Link>
              ))}
              <a href="https://knowlyticshub.com" target="_blank" rel="noreferrer" className="block text-sm hover:text-white transition-colors" style={{ color: '#3b82f6' }}>
                {t('landing.footerMainSite')} ↗
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-4" className="pub-text">{t('landing.footerAbout')}</h4>
            <div className="space-y-2">
              {[t('landing.footerPrivacy'), t('landing.footerTerms'), t('landing.footerRefund')].map(l => (
                <p key={l} className="text-sm" className="pub-text-faint">{l}</p>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-bold text-sm mb-4" className="pub-text">{t('landing.footerContact')}</h4>
            <a href="mailto:Sales@knowlyticshub.com" className="block text-sm mb-3" style={{ color: '#3b82f6' }}>Sales@knowlyticshub.com</a>
            <a href="https://wa.me/201226929392" target="_blank" rel="noreferrer" className="block text-sm mb-5" style={{ color: '#4ade80' }}>+20 122 692 9392</a>
            <div className="flex gap-3">
              {[Facebook, Instagram, Linkedin, Youtube].map((SIcon, i) => (
                <a key={i} href="#" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg flex items-center justify-center hover:scale-110 transition-transform" className="pub-stat">
                  <SIcon className="w-4 h-4" className="pub-text-muted" />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs" className="pub-text-faint">&copy; {new Date().getFullYear()} Knowlytics Hub. {t('landing.footerRights')}.</p>
        </div>
      </div>
    </footer>
  );
}
