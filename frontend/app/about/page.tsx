'use client';
import { useEffect, useState } from 'react';
import { GraduationCap, Users, Star, Briefcase, Loader2, Linkedin, Youtube, BookOpen, X } from 'lucide-react';
import Link from 'next/link';
import PublicNavbar, { usePublicTheme } from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import { useLanguage } from '@/hooks/useLanguage';
import api from '@/lib/api';

interface Instructor {
  id: string; name: string; name_ar: string; title: string; title_ar: string;
  bio: string; bio_ar: string; photo_url: string; experience_years: number;
  trainees_count: number; rating: number; specialties: string[];
  linkedin_url: string; youtube_url: string; course_count: number;
  courses?: { id: string; title: string; type: string; price: number }[];
}

const PROJECTS = [
  { title: { ar: 'لوحة الإيرادات', en: 'Revenue Dashboard' }, student: 'Fatma Ibrahim', image: '/student-work/Sales Dashboard.jpeg', tools: 'Power BI' },
  { title: { ar: 'لوحة أداء المبيعات', en: 'Sales Performance' }, student: 'Mazen Sabry', image: '/student-work/Sales2.jpeg', tools: 'Power BI' },
  { title: { ar: 'لوحة HR', en: 'HR Dashboard' }, student: '', image: '/student-work/HR Dashboard.jpeg', tools: 'Power BI' },
  { title: { ar: 'تحليل التجارة الإلكترونية', en: 'E-Commerce Analytics' }, student: 'Fatma Ibrahim', image: '/student-work/E-commerce.jpeg', tools: 'Power BI' },
  { title: { ar: 'لوحة القوى العاملة', en: 'Workforce Dashboard' }, student: '', image: '/student-work/HR Dashboard2.jpeg', tools: 'Power BI' },
  { title: { ar: 'تقرير مبيعات المقهى', en: 'Coffee Shop Report' }, student: '', image: '/student-work/Food and Beverage.jpeg', tools: 'Power BI' },
];

export default function AboutPage() {
  const { t, isAr, dir } = useLanguage();
  const { c } = usePublicTheme();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    api.get('/instructors').then(({ data }) => setInstructors(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" dir={dir} style={{ backgroundColor: c.pageBg }}>
      <PublicNavbar />

      {lightbox && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 cursor-pointer" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} onClick={() => setLightbox(null)}>
          <button className="absolute top-4 right-4 p-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}><X className="w-6 h-6" style={{ color: '#fff' }} /></button>
          <img src={lightbox} alt="" className="max-w-full max-h-[85vh] rounded-xl object-contain" />
        </div>
      )}

      {/* Header */}
      <section className="py-16 text-center" style={{ backgroundColor: c.heroBg }}>
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ color: c.text }}>
            {isAr ? 'تعرّف على مدربينا' : 'Meet Our Instructors'}
          </h1>
          <p className="text-lg" style={{ color: c.textMuted }}>
            {isAr ? 'خبراء متخصصون في تحليل البيانات وعلوم الحاسوب' : 'Experts specialized in data analysis and computer science'}
          </p>
        </div>
      </section>

      {/* Instructors */}
      <section className="py-16" style={{ backgroundColor: c.sectionAltBg }}>
        <div className="max-w-6xl mx-auto px-6">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: c.accent }} /></div>
          ) : instructors.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-32 h-32 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ background: `linear-gradient(135deg, #1e3a5f, ${c.accent})` }}>
                <GraduationCap className="w-16 h-16" style={{ color: 'rgba(255,255,255,0.3)' }} />
              </div>
              <h2 className="text-2xl font-extrabold mb-2" style={{ color: c.text }}>{t('landing.founderName')}</h2>
              <p className="text-sm mb-4" style={{ color: c.accent }}>{t('landing.founderRole')}</p>
              <p className="text-sm max-w-xl mx-auto leading-relaxed" style={{ color: c.textMuted }}>{t('landing.founderStory')}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {instructors.map(inst => (
                <div key={inst.id} className="rounded-2xl p-6 md:p-8" style={{ backgroundColor: c.cardBg, border: `1px solid ${c.cardBorder}` }}>
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    {/* Photo */}
                    {inst.photo_url ? (
                      <img src={inst.photo_url} alt={inst.name} className="w-32 h-32 rounded-2xl object-cover shrink-0" />
                    ) : (
                      <div className="w-32 h-32 rounded-2xl shrink-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, #1e3a5f, ${c.accent})` }}>
                        <GraduationCap className="w-16 h-16" style={{ color: 'rgba(255,255,255,0.3)' }} />
                      </div>
                    )}

                    <div className="flex-1 text-center md:text-start">
                      <h2 className="text-2xl font-extrabold mb-1" style={{ color: c.text }}>
                        {isAr ? (inst.name_ar || inst.name) : inst.name}
                      </h2>
                      <p className="text-sm font-medium mb-4" style={{ color: c.accent }}>
                        {isAr ? (inst.title_ar || inst.title) : inst.title}
                      </p>

                      {/* Stats */}
                      <div className="flex flex-wrap gap-3 mb-4 justify-center md:justify-start">
                        {inst.experience_years > 0 && (
                          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: c.accentBg, color: c.accentLight, border: `1px solid ${c.accentBorder}` }}>
                            <Briefcase className="w-3 h-3" /> {inst.experience_years}+ {isAr ? 'سنة خبرة' : 'years'}
                          </span>
                        )}
                        {inst.trainees_count > 0 && (
                          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: c.accentBg, color: c.accentLight, border: `1px solid ${c.accentBorder}` }}>
                            <Users className="w-3 h-3" /> {inst.trainees_count.toLocaleString()}+ {isAr ? 'متدرب' : 'trainees'}
                          </span>
                        )}
                        <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: c.accentBg, color: c.accentLight, border: `1px solid ${c.accentBorder}` }}>
                          <Star className="w-3 h-3" /> {inst.rating}
                        </span>
                        {inst.course_count > 0 && (
                          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: c.accentBg, color: c.accentLight, border: `1px solid ${c.accentBorder}` }}>
                            <BookOpen className="w-3 h-3" /> {inst.course_count} {isAr ? 'كورس' : 'courses'}
                          </span>
                        )}
                      </div>

                      {/* Bio */}
                      <p className="text-sm leading-relaxed mb-4" style={{ color: c.textMuted }}>
                        {isAr ? (inst.bio_ar || inst.bio) : inst.bio}
                      </p>

                      {/* Specialties */}
                      {(inst.specialties || []).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {inst.specialties.map((s, i) => (
                            <span key={i} className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: c.accentBg, color: c.accentLight }}>
                              {s}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Social links */}
                      <div className="flex gap-3 justify-center md:justify-start">
                        {inst.linkedin_url && (
                          <a href={inst.linkedin_url} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg flex items-center justify-center hover:scale-110 transition-transform" style={{ backgroundColor: c.accentBg }}>
                            <Linkedin className="w-4 h-4" style={{ color: c.accentLight }} />
                          </a>
                        )}
                        {inst.youtube_url && (
                          <a href={inst.youtube_url} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg flex items-center justify-center hover:scale-110 transition-transform" style={{ backgroundColor: c.accentBg }}>
                            <Youtube className="w-4 h-4" style={{ color: c.accentLight }} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Student Projects */}
      <section className="py-20" style={{ backgroundColor: c.sectionBg }}>
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-3" style={{ color: c.text }}>{t('landing.projectsTitle')}</h2>
          <p className="text-center mb-12" style={{ color: c.textMuted }}>{t('landing.projectsDesc')}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PROJECTS.map((p, i) => (
              <div key={i} className="rounded-2xl overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform group"
                   style={{ backgroundColor: c.cardBg, border: `1px solid ${c.cardBorder}` }}
                   onClick={() => setLightbox(p.image)}>
                <div className="w-full h-48 overflow-hidden">
                  <img src={p.image} alt={isAr ? p.title.ar : p.title.en} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-sm mb-1" style={{ color: c.text }}>{isAr ? p.title.ar : p.title.en}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: c.textFaint }}>{p.student || (isAr ? 'طالب Knowlytics' : 'Knowlytics Student')}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: c.accentBg, color: c.accentLight }}>{p.tools}</span>
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
