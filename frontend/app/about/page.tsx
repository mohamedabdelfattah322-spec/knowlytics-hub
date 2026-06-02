'use client';
import { useState } from 'react';
import { GraduationCap, Users, PlayCircle, Building2, Star, X, Quote } from 'lucide-react';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import { useLanguage } from '@/hooks/useLanguage';

const COMPANIES = [
  { name: 'Saint-Gobain', logo: '/company-logos/Saint-Gobain.png', info: 'Manufacturing — France/Egypt' },
  { name: 'Cinnabon', logo: '/company-logos/Cinnabon.png', info: 'F&B — Egypt' },
  { name: 'AFRAS', logo: '/company-logos/AFRAS KSA.jfif', info: 'Consulting — KSA' },
  { name: 'Alyoum', logo: '/company-logos/Alyoum.png', info: 'Media — KSA' },
  { name: 'EFS', logo: '/company-logos/EFS.jfif', info: 'Facilities — Egypt' },
  { name: 'Asfour', logo: '/company-logos/Asfour.jfif', info: 'Crystal — Egypt' },
  { name: 'Apleona', logo: '/company-logos/Apleona.png', info: 'Real Estate — Egypt' },
  { name: 'Symphony', logo: '/company-logos/Symphony Development.webp', info: 'Real Estate — Egypt' },
];

const PROJECTS = [
  { title: { ar: 'لوحة الإيرادات', en: 'Revenue Dashboard' }, student: 'Fatma Ibrahim', image: '/student-work/Sales Dashboard.jpeg', tools: 'Power BI' },
  { title: { ar: 'لوحة أداء المبيعات', en: 'Sales Performance' }, student: 'Mazen Sabry', image: '/student-work/Sales2.jpeg', tools: 'Power BI' },
  { title: { ar: 'لوحة HR', en: 'HR Dashboard' }, student: '', image: '/student-work/HR Dashboard.jpeg', tools: 'Power BI' },
  { title: { ar: 'تحليل التجارة الإلكترونية', en: 'E-Commerce Analytics' }, student: 'Fatma Ibrahim', image: '/student-work/E-commerce.jpeg', tools: 'Power BI' },
  { title: { ar: 'لوحة القوى العاملة', en: 'Workforce Dashboard' }, student: '', image: '/student-work/HR Dashboard2.jpeg', tools: 'Power BI' },
  { title: { ar: 'تقرير مبيعات المقهى', en: 'Coffee Shop Report' }, student: '', image: '/student-work/Food and Beverage.jpeg', tools: 'Power BI' },
  { title: { ar: 'لوحة التدريب والتكاليف', en: 'HR Training & Cost' }, student: '', image: '/student-work/HR Dashboard 5.jpeg', tools: 'Power BI' },
  { title: { ar: 'تحليل ديموغرافي', en: 'Demographics Analysis' }, student: 'Fatma Ibrahim', image: '/student-work/Demographic Dashboard.jpeg', tools: 'Power BI' },
  { title: { ar: 'لوحة صحة الموظفين', en: 'Employee Health' }, student: '', image: '/student-work/HR.jpeg', tools: 'Power BI' },
];

export default function AboutPage() {
  const { t, isAr, dir } = useLanguage();
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <div className="min-h-screen" dir={dir} style={{ backgroundColor: '#0a1628' }}>
      <PublicNavbar />

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 cursor-pointer" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 p-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}><X className="w-6 h-6" style={{ color: '#fff' }} /></button>
          <img src={lightbox} alt="" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
        </div>
      )}

      {/* Instructor Header */}
      <section className="py-20" style={{ backgroundColor: '#0f1d32' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="w-48 h-48 md:w-56 md:h-56 rounded-2xl shrink-0 overflow-hidden" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)' }}>
              <div className="w-full h-full flex items-center justify-center">
                <GraduationCap className="w-20 h-20" style={{ color: 'rgba(255,255,255,0.25)' }} />
              </div>
            </div>
            <div className="text-center md:text-start flex-1">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-2" style={{ color: '#ffffff' }}>{t('landing.founderName')}</h1>
              <p className="text-base font-medium mb-6" style={{ color: '#3b82f6' }}>{t('landing.founderRole')}</p>

              <div className="flex flex-wrap gap-3 mb-6 justify-center md:justify-start">
                {[
                  { icon: Users, label: t('landing.founderTrainees') },
                  { icon: PlayCircle, label: t('landing.founderYoutube') },
                  { icon: Building2, label: t('landing.founderCompanies') },
                  { icon: Star, label: t('landing.founderRating') },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                       style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <s.icon className="w-3.5 h-3.5" /> {s.label}
                  </div>
                ))}
              </div>

              <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.6)' }}>{t('landing.founderStory')}</p>
              <blockquote className="px-5 py-4 rounded-xl" style={{ backgroundColor: 'rgba(59,130,246,0.08)', borderLeft: '3px solid #3b82f6' }}>
                <p className="text-sm font-medium italic" style={{ color: 'rgba(255,255,255,0.8)' }}>&ldquo;{t('landing.founderQuote')}&rdquo;</p>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      {/* Companies Trained */}
      <section className="py-16" style={{ backgroundColor: '#0b1426' }}>
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-center mb-3" style={{ color: '#ffffff' }}>{t('landing.companiesTitle')}</h2>
          <p className="text-center mb-10 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{t('landing.companiesDesc')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {COMPANIES.map((c) => (
              <div key={c.name} className="rounded-xl p-5 flex flex-col items-center gap-3 hover:scale-105 transition-transform"
                   style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-16 h-16 flex items-center justify-center">
                  <img src={c.logo} alt={c.name} className="w-full h-full object-contain" style={{ filter: 'brightness(0) invert(0.8)' }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold" style={{ color: '#ffffff' }}>{c.name}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{c.info}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Student Projects */}
      <section className="py-20" style={{ backgroundColor: '#111d33' }}>
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-3" style={{ color: '#ffffff' }}>{t('landing.projectsTitle')}</h2>
          <p className="text-center mb-12" style={{ color: 'rgba(255,255,255,0.5)' }}>{t('landing.projectsDesc')}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PROJECTS.map((p, i) => (
              <div key={i} className="rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform group"
                   style={{ backgroundColor: '#162038', border: '1px solid rgba(255,255,255,0.08)' }}
                   onClick={() => setLightbox(p.image)}>
                <div className="w-full h-48 overflow-hidden">
                  <img src={p.image} alt={isAr ? p.title.ar : p.title.en} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-sm mb-1" style={{ color: '#ffffff' }}>{isAr ? p.title.ar : p.title.en}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{p.student || (isAr ? 'طالب Knowlytics' : 'Knowlytics Student')}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>{p.tools}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
