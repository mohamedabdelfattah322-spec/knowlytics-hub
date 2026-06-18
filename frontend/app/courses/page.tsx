'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, BookOpen, Clock, Users, Filter, Star, Package, Infinity, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { formatPrice, levelColor, cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import PageGuide, { GuideButton, type GuideStep } from '@/components/ui/PageGuide';

const coursesGuide: GuideStep[] = [
  {
    titleAr: 'كتالوج الكورسات', titleEn: 'Course Catalog',
    descAr: 'هنا بتلاقي كل الكورسات المتاحة. تقدر تبحث وتفلتر وتلاقي اللي يناسبك.', descEn: 'Find all available courses here. Search, filter, and find what suits you.',
  },
  {
    target: '[data-guide="search"]',
    titleAr: 'البحث', titleEn: 'Search',
    descAr: 'ابحث عن أي كورس بالاسم أو الوصف.', descEn: 'Search for any course by name or description.',
  },
  {
    target: '[data-guide="filters"]',
    titleAr: 'الفلاتر', titleEn: 'Filters',
    descAr: 'فلتر حسب النوع (أونلاين/لايف)، القسم، أو رتّب حسب السعر أو التقييم.', descEn: 'Filter by type (Online/Live), category, or sort by price or rating.',
  },
  {
    target: '[data-guide="course-grid"]',
    titleAr: 'الكورسات', titleEn: 'Courses',
    descAr: 'اضغط على أي كورس عشان تشوف التفاصيل والسعر وتسجّل فيه.', descEn: 'Click any course to see details, pricing, and enroll.',
  },
];

interface Course {
  id: string; title: string; description: string; type: string;
  level: string; price: number; thumbnail_url: string;
  duration_hours: number; enrollment_count: string; instructor_name: string;
  avg_rating: number; review_count: number; category_name: string; category_name_ar: string;
}

interface Category {
  id: string; name: string; name_ar: string; slug: string; icon: string; course_count: number;
}

interface Bundle {
  id: string; name: string; description: string;
  price: number; original_price: number | null;
  duration_days: number; thumbnail_url: string | null;
  course_count: number;
}

export default function CoursesPage() {
  const { user } = useAuth();
  const { t, isAr } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [loading, setLoading] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    api.get('/categories').then(({ data }) => setCategories(data)).catch(() => {});
    api.get('/bundles').then(({ data }) => setBundles(data)).catch(() => {});
    if (user) {
      api.get('/enrollments/my').then(({ data }) => {
        const ids = new Set<string>((data || []).map((e: any) => String(e.course_id)));
        setEnrolledIds(ids);
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    api.get('/courses', { params: { search, type: typeFilter || undefined, category: categoryFilter || undefined, sort: sortBy || undefined, limit: 50 } })
      .then(({ data }) => {
        const filtered = typeFilter === 'live'
          ? data.courses
          : (data.courses || []).filter((c: Course) => c.type !== 'live');
        setCourses(filtered);
      })
      .finally(() => setLoading(false));
  }, [search, typeFilter, categoryFilter, sortBy]);

  return (
    <div className="min-h-screen bg-dark-900">
      <PageGuide pageId="courses-catalog" steps={coursesGuide} forceOpen={guideOpen} onClose={() => setGuideOpen(false)} />
      <GuideButton onClick={() => setGuideOpen(true)} />
      <PublicNavbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">{t('courses.catalog')}</h1>
          <p className="text-slate-400">{t('courses.catalogDesc')}</p>
        </div>

        {/* ── Bundles horizontal strip ── */}
        {bundles.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Package className="w-5 h-5 text-brand-400" />
              <h2 className="text-lg font-bold text-white">الباقات الشاملة</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400">وفّر أكتر</span>
            </div>
            {/* Horizontal scroll on mobile, grid on desktop */}
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-dark-600">
              {bundles.map(b => {
                const pct = b.original_price && b.original_price > b.price
                  ? Math.round((b.original_price - b.price) / b.original_price * 100) : null;
                return (
                  <Link key={b.id} href={`/bundles/${b.id}`}
                    className="card hover:border-brand-500/50 transition-all duration-200 group flex-shrink-0 w-72 flex flex-col relative overflow-hidden">
                    {pct && (
                      <span className="absolute top-2 right-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        خصم {pct}%
                      </span>
                    )}
                    {b.thumbnail_url ? (
                      <div className="w-full h-32 rounded-lg mb-3 overflow-hidden bg-dark-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={b.thumbnail_url} alt={b.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    ) : (
                      <div className="w-full h-32 rounded-lg mb-3 bg-gradient-to-br from-brand-500/20 to-purple-500/20 flex items-center justify-center">
                        <Package className="w-10 h-10 text-brand-400" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="badge badge-blue flex items-center gap-1 text-xs"><Package className="w-3 h-3" /> باقة</span>
                      {b.duration_days === 0
                        ? <span className="text-xs text-purple-400 flex items-center gap-1"><Infinity className="w-3 h-3" /> مدى الحياة</span>
                        : <span className="text-xs text-slate-400">{b.duration_days} يوم</span>}
                    </div>
                    <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2 group-hover:text-brand-300 transition-colors">{b.name}</h3>
                    <div className="flex items-center justify-between pt-2 border-t border-dark-700 mt-auto">
                      <div>
                        {b.original_price && b.original_price > b.price && (
                          <p className="text-slate-500 line-through text-xs">{formatPrice(b.original_price)}</p>
                        )}
                        <p className="text-brand-400 font-bold text-sm">{formatPrice(b.price)}</p>
                      </div>
                      <span className="text-xs text-slate-400">
                        {b.course_count === 0 ? 'كل الكورسات' : `${b.course_count} كورس`}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1" data-guide="search">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
          </div>
          <div className="flex items-center gap-2 flex-wrap" data-guide="filters">
            <Filter className="w-4 h-4 text-slate-400" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input w-auto">
              <option value="">{t('courses.allTypes')}</option>
              <option value="online">{t('courses.online')}</option>
              <option value="hybrid">{t('courses.hybrid')}</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input w-auto">
              <option value="">{t('courses.allCategories')}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {isAr ? (cat.name_ar || cat.name) : cat.name} ({cat.course_count})</option>
              ))}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input w-auto">
              <option value="">{t('courses.newest')}</option>
              <option value="popular">{t('courses.popular')}</option>
              <option value="rating">{t('courses.topRated')}</option>
              <option value="price_low">{t('courses.priceLow')}</option>
              <option value="price_high">{t('courses.priceHigh')}</option>
            </select>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" data-guide="course-grid">
          {loading
            ? [...Array(8)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="w-full h-36 bg-dark-700 rounded-lg mb-3" />
                <div className="h-4 bg-dark-700 rounded mb-2" />
                <div className="h-3 bg-dark-700 rounded w-2/3" />
              </div>
            ))
            : courses.map((c) => {
              const enrolled = enrolledIds.has(c.id);
              return (
                <Link key={c.id} href={`/courses/${c.id}`}
                  className={cn(
                    'card hover:border-brand-500/50 transition-all duration-200 group flex flex-col relative',
                    enrolled && 'border-green-500/30'
                  )}>
                  {/* Enrolled badge */}
                  {enrolled && (
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-green-500/90 text-white text-xs font-bold px-2 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" /> تم الاشتراك
                    </div>
                  )}
                  {/* Thumbnail */}
                  <div className="w-full h-36 rounded-lg mb-4 flex items-center justify-center overflow-hidden"
                    style={{ background: c.thumbnail_url ? undefined : 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))' }}>
                    {c.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="w-10 h-10 text-brand-400" />
                    )}
                  </div>
                  {/* Badges */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn('badge', c.type === 'live' ? 'badge-purple' : 'badge-blue')}>{c.type}</span>
                    <span className={levelColor(c.level)}>{c.level}</span>
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2 group-hover:text-brand-300 transition-colors">{c.title}</h3>
                  <p className="text-slate-400 text-xs line-clamp-2 mb-3 flex-1">{c.description}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.duration_hours}h</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.enrollment_count}</span>
                  </div>
                  {c.avg_rating > 0 && (
                    <div className="flex items-center gap-1 mb-3 text-xs">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span className="text-yellow-400">{parseFloat(String(c.avg_rating)).toFixed(1)}</span>
                      <span className="text-slate-500">({c.review_count})</span>
                      {(c.category_name || c.category_name_ar) && (
                        <span className="text-slate-600 mr-2">• {isAr ? (c.category_name_ar || c.category_name) : c.category_name}</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-dark-700">
                    {enrolled
                      ? <span className="text-green-400 text-sm font-medium flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> تم الاشتراك</span>
                      : <span className="text-white font-bold">{formatPrice(c.price)}</span>
                    }
                    <span className="text-xs text-slate-400">{c.instructor_name}</span>
                  </div>
                </Link>
              );
            })}
        </div>

        {!loading && courses.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">{t('courses.noCourses')}</p>
          </div>
        )}
      </div>
      <PublicFooter />
    </div>
  );
}
