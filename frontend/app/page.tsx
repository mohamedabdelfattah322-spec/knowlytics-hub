'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight, Star, ArrowRight,
  Users, Clock, BookOpen, ChevronDown,
  PlayCircle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { formatPrice } from '@/lib/utils';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import api from '@/lib/api';

interface FeaturedCourse {
  id: string; title: string; description: string; type: string;
  level: string; price: number; thumbnail_url: string;
  duration_hours: number; avg_rating: number; review_count: number;
  enrollment_count: number; instructor_name: string;
}

const FAQ_DATA = [
  { q: { ar: 'هل أحتاج خبرة مسبقة؟', en: 'Do I need prior experience?' }, a: { ar: 'لا! معظم دوراتنا تبدأ من الصفر تمامًا. مصممة لأي شخص يريد الدخول لمجال تحليل البيانات.', en: 'No! Most courses start from absolute zero. Designed for anyone wanting to break into data analytics.' } },
  { q: { ar: 'هل سأحصل على شهادة؟', en: 'Will I get a certificate?' }, a: { ar: 'بالتأكيد! شهادة رقمية معتمدة من Knowlytics Hub عند إتمام كل كورس.', en: 'Absolutely! A verified digital certificate from Knowlytics Hub upon completing each course.' } },
  { q: { ar: 'إلى متى يمكنني الوصول للمحتوى؟', en: 'How long can I access materials?' }, a: { ar: 'وصول مدى الحياة! بمجرد التسجيل، تقدر تراجع الدروس في أي وقت.', en: 'Lifetime access! Once enrolled, revisit lessons anytime at no extra cost.' } },
  { q: { ar: 'ما طرق الدفع المقبولة؟', en: 'What payment methods are accepted?' }, a: { ar: 'نقبل الدفع أونلاين عبر المنصة. كمان ممكن تتواصل معانا على واتساب.', en: 'We accept online payment through the platform. You can also contact us via WhatsApp.' } },
  { q: { ar: 'هل هناك ضمان استرداد؟', en: 'Is there a refund guarantee?' }, a: { ar: 'نعم! ضمان استرداد خلال 14 يوم لو مش راضي — بدون أسئلة.', en: 'Yes! 14-day money-back guarantee if not satisfied — no questions asked.' } },
  { q: { ar: 'هل AI هيلغي محللي البيانات؟', en: 'Will AI replace data analysts?' }, a: { ar: 'لا! AI بيحوّل الدور مش بيلغيه. المحلل اللي بيستخدم AI هيكون أقوى 10 أضعاف.', en: 'No! AI transforms the role, not eliminates it. Analysts using AI are 10x more powerful.' } },
];

function FAQItem({ q, a, isOpen, toggle }: { q: string; a: string; isOpen: boolean; toggle: () => void }) {
  return (
    <div className="pub-card rounded-xl overflow-hidden">
      <button onClick={toggle} className="w-full flex items-center justify-between p-5 text-start">
        <span className="pub-text font-semibold text-sm">{q}</span>
        <ChevronDown className="w-5 h-5 shrink-0 transition-transform pub-accent" style={{ transform: isOpen ? 'rotate(180deg)' : '' }} />
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-0">
          <p className="pub-text-muted text-sm leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { t, dir, isAr } = useLanguage();
  const [stats, setStats] = useState({ students: 0, courses: 0, satisfaction: 0 });
  const [courses, setCourses] = useState<FeaturedCourse[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => { if (user) router.replace(user.role === 'admin' ? '/dashboard/admin' : '/dashboard/student'); }, [user, router]);

  useEffect(() => {
    api.get('/public/stats').then(({ data }) => setStats(data)).catch(() => {});
    api.get('/public/featured-courses').then(({ data }) => setCourses(data)).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen pub-page" dir={dir}>
      <PublicNavbar />

      {/* HERO */}
      <section className="pub-hero relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.08]">
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-80 h-80 bg-purple-500 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-20 text-center">
          <div className="pub-badge inline-flex items-center gap-2 rounded-full px-5 py-2 mb-8">
            <Star className="w-4 h-4 pub-accent" />
            <span className="text-sm font-semibold pub-accent">{t('landing.badge')}</span>
          </div>
          <h1 className="pub-text text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            {t('landing.heroTitle1')}<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400">
              {t('landing.heroTitle2')}
            </span>
          </h1>
          <p className="pub-text-sub text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('landing.heroDesc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="pub-btn-primary text-base px-8 py-4 rounded-xl font-bold inline-flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
              {t('landing.startFree')} <ChevronRight className="w-5 h-5" />
            </Link>
            <Link href="/courses" className="pub-btn-outline text-base px-8 py-4 rounded-xl font-semibold inline-flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform">
              {t('landing.browseCourses')}
            </Link>
          </div>
        </div>
      </section>

      {/* VIDEO + STATS */}
      <section className="pub-section-alt py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-8 items-center">
            <div className="lg:col-span-3 pub-card rounded-2xl overflow-hidden shadow-2xl">
              <div className="aspect-video">
                <iframe src="https://www.youtube.com/embed/xRp7_p7shhk" title="Knowlytics Hub"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen className="w-full h-full" />
              </div>
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 gap-6">
              {[
                { value: '7,000+', label: isAr ? 'متدرب' : 'Trainees', icon: Users },
                { value: stats.courses > 0 ? `${stats.courses}+` : '9+', label: isAr ? 'كورس' : 'Courses', icon: BookOpen },
                { value: '100K+', label: isAr ? 'مشترك يوتيوب' : 'YouTube Subs', icon: PlayCircle },
                { value: '5.0', label: isAr ? 'تقييم' : 'Rating', icon: Star },
              ].map((s, i) => (
                <div key={i} className="pub-stat text-center p-5 rounded-2xl">
                  <s.icon className="w-6 h-6 mx-auto mb-2 pub-accent" />
                  <p className="pub-accent-light text-2xl md:text-3xl font-extrabold mb-1">{s.value}</p>
                  <p className="pub-text-muted text-xs font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* COURSES */}
      {courses.length > 0 && (
        <section className="pub-section py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="pub-text text-3xl md:text-4xl font-extrabold mb-2">{t('landing.coursesTitle')}</h2>
                <p className="pub-text-muted text-base">{t('landing.coursesDesc')}</p>
              </div>
              <Link href="/courses" className="hidden md:inline-flex items-center gap-1 text-sm font-semibold pub-accent">
                {t('landing.viewAll')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Link key={course.id} href={`/courses/${course.id}`} className="pub-card rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform group flex flex-col">
                  <div className="w-full h-44 relative" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 50%, #7c3aed 100%)' }}>
                    <div className="absolute inset-0 flex items-center justify-center"><BookOpen className="w-12 h-12" style={{ color: 'rgba(255,255,255,0.2)' }} /></div>
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: course.type === 'live' ? '#7c3aed' : '#2563eb' }}>
                      {course.type === 'live' ? 'LIVE' : 'ONLINE'}
                    </span>
                    <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-bold text-white" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      {formatPrice(course.price)}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="pub-text font-bold text-base mb-2 line-clamp-2">{course.title}</h3>
                    <p className="pub-text-muted text-sm line-clamp-2 mb-4 flex-1">{course.description}</p>
                    <div className="pub-text-faint flex items-center justify-between text-xs mb-3">
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {course.duration_hours}h</span>
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {course.enrollment_count}</span>
                      {course.avg_rating > 0 && <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />{parseFloat(String(course.avg_rating)).toFixed(1)}</span>}
                    </div>
                    <div className="pub-card-divider pt-3 flex items-center justify-between">
                      <span className="pub-text-faint text-xs">{course.instructor_name}</span>
                      <span className="pub-btn-primary text-sm font-bold px-4 py-1.5 rounded-lg">{t('landing.enrollNow')}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center md:hidden">
              <Link href="/courses" className="inline-flex items-center gap-1 text-sm font-semibold pub-accent">{t('landing.viewAll')} <ArrowRight className="w-4 h-4" /></Link>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-20 relative overflow-hidden" style={{ backgroundColor: 'var(--pub-page-bg)' }}>
        <div className="relative max-w-3xl mx-auto px-6">
          <h2 className="pub-text text-3xl md:text-4xl font-extrabold text-center mb-3">{t('landing.faqTitle')}</h2>
          <p className="pub-text-muted text-center mb-10 text-base">{t('landing.faqDesc')}</p>
          <div className="space-y-3">
            {FAQ_DATA.map((faq, i) => (
              <FAQItem key={i} q={isAr ? faq.q.ar : faq.q.en} a={isAr ? faq.a.ar : faq.a.en}
                       isOpen={openFaq === i} toggle={() => setOpenFaq(openFaq === i ? null : i)} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20" style={{ backgroundColor: 'var(--pub-page-bg)' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-3xl p-10 md:p-16 text-center relative overflow-hidden"
               style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 50%, #7c3aed 100%)' }}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-white">{t('landing.ctaTitle')}</h2>
              <p className="text-lg mb-8 max-w-xl mx-auto text-white/85">{t('landing.ctaDesc')}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register" className="inline-flex items-center justify-center gap-2 font-bold px-10 py-4 rounded-xl text-lg hover:scale-[1.03] transition-transform shadow-xl bg-white text-[#1e3a5f]">
                  {t('landing.ctaButton')} <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="https://wa.me/201226929392" target="_blank" rel="noreferrer"
                   className="inline-flex items-center justify-center gap-2 font-bold px-10 py-4 rounded-xl text-lg hover:scale-[1.03] transition-transform text-white border border-white/30 bg-white/15">
                  {t('landing.whatsapp')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
