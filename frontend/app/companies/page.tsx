'use client';
import { Building2 } from 'lucide-react';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import { useLanguage } from '@/hooks/useLanguage';

const COMPANIES = [
  { name: 'Saint-Gobain', logo: '/company-logos/Saint-Gobain.png', industry: { ar: 'تصنيع', en: 'Manufacturing' }, country: { ar: 'فرنسا / مصر', en: 'France / Egypt' } },
  { name: 'Cinnabon', logo: '/company-logos/Cinnabon.png', industry: { ar: 'أغذية ومشروبات', en: 'F&B' }, country: { ar: 'مصر', en: 'Egypt' } },
  { name: 'AFRAS', logo: '/company-logos/AFRAS KSA.jfif', industry: { ar: 'استشارات', en: 'Consulting' }, country: { ar: 'السعودية', en: 'KSA' } },
  { name: 'Alyoum', logo: '/company-logos/Alyoum.png', industry: { ar: 'إعلام', en: 'Media' }, country: { ar: 'السعودية', en: 'KSA' } },
  { name: 'EFS', logo: '/company-logos/EFS.jfif', industry: { ar: 'إدارة مرافق', en: 'Facilities' }, country: { ar: 'مصر', en: 'Egypt' } },
  { name: 'Asfour Crystal', logo: '/company-logos/Asfour.jfif', industry: { ar: 'كريستال', en: 'Crystal' }, country: { ar: 'مصر', en: 'Egypt' } },
  { name: 'Apleona', logo: '/company-logos/Apleona.png', industry: { ar: 'عقارات', en: 'Real Estate' }, country: { ar: 'مصر', en: 'Egypt' } },
  { name: 'Symphony Development', logo: '/company-logos/Symphony Development.webp', industry: { ar: 'عقارات', en: 'Real Estate' }, country: { ar: 'مصر', en: 'Egypt' } },
];

export default function CompaniesPage() {
  const { t, isAr, dir } = useLanguage();

  return (
    <div className="min-h-screen" dir={dir} style={{ backgroundColor: '#0a1628' }}>
      <PublicNavbar />

      {/* Header */}
      <section className="py-16 text-center" style={{ backgroundColor: '#0f1d32' }}>
        <div className="max-w-4xl mx-auto px-6">
          <Building2 className="w-12 h-12 mx-auto mb-4" style={{ color: '#3b82f6' }} />
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ color: '#ffffff' }}>
            {t('landing.companiesTitle')}
          </h1>
          <p className="text-lg" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {t('landing.companiesDesc')}
          </p>
        </div>
      </section>

      {/* Companies Grid */}
      <section className="py-16" style={{ backgroundColor: '#0a1628' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {COMPANIES.map((c) => (
              <div key={c.name} className="rounded-2xl p-6 flex flex-col items-center gap-4 hover:scale-[1.03] transition-transform"
                   style={{ backgroundColor: '#162038', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-20 h-20 rounded-xl flex items-center justify-center p-3" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                  <img src={c.logo} alt={c.name} className="w-full h-full object-contain" style={{ filter: 'brightness(0) invert(0.85)' }} />
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-base mb-1" style={{ color: '#ffffff' }}>{c.name}</h3>
                  <p className="text-xs mb-0.5" style={{ color: '#60a5fa' }}>{isAr ? c.industry.ar : c.industry.en}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{isAr ? c.country.ar : c.country.en}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center rounded-2xl p-10" style={{ backgroundColor: '#162038', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 className="text-xl font-bold mb-3" style={{ color: '#fff' }}>
              {isAr ? 'عايز تدريب مؤسسي لشركتك؟' : 'Need corporate training for your company?'}
            </h3>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {isAr ? 'نقدم برامج تدريب مخصصة تناسب احتياجات فريقك' : 'We offer customized training programs tailored to your team\'s needs'}
            </p>
            <a href="https://wa.me/201226929392" target="_blank" rel="noreferrer"
               className="inline-flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm hover:scale-[1.02] transition-transform"
               style={{ backgroundColor: '#4ade80', color: '#0a1628' }}>
              {isAr ? 'تواصل معنا عبر واتساب' : 'Contact us via WhatsApp'}
            </a>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
