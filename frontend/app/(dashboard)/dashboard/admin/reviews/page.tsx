'use client';
import { useEffect, useState } from 'react';
import { Star, Eye, EyeOff, Trash2, Loader2, MessageSquare, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface ReviewStats {
  total_reviews: number;
  avg_review_rating: number;
  total_course_feedback: number;
  avg_course_feedback_rating: number;
  total_batch_feedback: number;
  avg_batch_feedback_rating: number;
  five_star: number;
  four_star: number;
  three_star: number;
  low_star: number;
}

interface CourseReview {
  id: string;
  course_id: string;
  user_id: string;
  rating: number;
  comment: string;
  is_visible: boolean;
  created_at: string;
  user_name: string;
  email: string;
  avatar_url: string | null;
  course_title: string;
}

interface FeedbackItem {
  id: string;
  course_id?: string;
  batch_id?: string;
  user_id: string;
  kind: string;
  rating: number;
  expectations: string | null;
  highlights: string | null;
  improvements: string | null;
  recommend: boolean | null;
  created_at: string;
  user_name: string;
  email: string;
  avatar_url: string | null;
  course_title: string;
  batch_name?: string;
}

type Tab = 'reviews' | 'course_feedback' | 'batch_feedback';

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const sz = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5';
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={cn(sz, s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600')} />
      ))}
    </span>
  );
}

function Avatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="w-9 h-9 rounded-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'flex');
        }}
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-xs font-medium text-brand-400">
      {initials}
    </div>
  );
}

function RatingBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 w-14 text-right">{label}</span>
      <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500 w-8 text-left">{count}</span>
    </div>
  );
}

export default function AdminReviewsPage() {
  const [data, setData] = useState<{
    stats: ReviewStats;
    course_reviews: CourseReview[];
    course_feedback: FeedbackItem[];
    batch_feedback: FeedbackItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('reviews');
  const [ratingFilter, setRatingFilter] = useState(0);

  const load = () => {
    setLoading(true);
    api.get('/admin/reviews')
      .then(({ data }) => setData(data))
      .catch(() => toast.error('فشل تحميل التقييمات'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleVisibility = async (id: string) => {
    try {
      await api.patch(`/admin/reviews/${id}/visibility`);
      load();
    } catch { toast.error('فشل'); }
  };

  const deleteReview = async (id: string) => {
    if (!confirm('حذف التقييم نهائيًا؟')) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      toast.success('تم الحذف');
      load();
    } catch { toast.error('فشل الحذف'); }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (!data) return null;

  const { stats, course_reviews, course_feedback, batch_feedback } = data;
  const totalFeedback = (stats.total_course_feedback || 0) + (stats.total_batch_feedback || 0);
  const allRatings = [...course_feedback, ...batch_feedback].map((f) => f.rating);
  const avgAll = allRatings.length > 0
    ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
    : '0';

  const filteredReviews = ratingFilter > 0
    ? course_reviews.filter((r) => r.rating === ratingFilter)
    : course_reviews;

  const alertItems = [...course_feedback, ...batch_feedback].filter((f) => f.rating <= 3);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'reviews',        label: 'تقييمات الكورسات',  count: stats.total_reviews },
    { key: 'course_feedback', label: 'فيدباك الكورسات',  count: stats.total_course_feedback },
    { key: 'batch_feedback',  label: 'فيدباك البatches',  count: stats.total_batch_feedback },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-brand-400" /> آراء وتقييمات المتدربين
        </h1>
        <p className="text-slate-400 text-sm mt-1">تحليل شامل لكل آراء وتوقعات المتدربين</p>
      </div>

      {/* Alert: low ratings */}
      {alertItems.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-medium text-sm">
              {alertItems.length} متدرب أعطى تقييم 3 نجوم أو أقل — يحتاج متابعة
            </p>
            <div className="mt-1 space-y-0.5">
              {alertItems.map((item) => (
                <p key={item.id} className="text-red-400/80 text-xs">
                  • <span className="font-medium">{item.user_name}</span> ({item.email}) — {item.course_title}
                  {item.expectations && `: "${item.expectations.slice(0, 80)}..."`}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-slate-400 text-xs mb-1">إجمالي التقييمات</p>
          <p className="text-2xl font-bold text-white">{stats.total_reviews + totalFeedback}</p>
          <p className="text-slate-500 text-xs mt-0.5">{stats.total_reviews} نجوم · {totalFeedback} فيدباك</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-xs mb-1">متوسط التقييمات</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold text-amber-400">{avgAll}</p>
            <Stars rating={Math.round(parseFloat(avgAll))} size="lg" />
          </div>
        </div>
        <div className="card">
          <p className="text-slate-400 text-xs mb-1">5 نجوم</p>
          <p className="text-2xl font-bold text-green-400">{stats.five_star}</p>
          <p className="text-slate-500 text-xs mt-0.5">
            {stats.total_reviews > 0 ? Math.round((stats.five_star / stats.total_reviews) * 100) : 0}% من التقييمات
          </p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-xs mb-1">يحتاج متابعة (≤3)</p>
          <p className={cn('text-2xl font-bold', alertItems.length > 0 ? 'text-red-400' : 'text-slate-400')}>
            {alertItems.length}
          </p>
          <p className="text-slate-500 text-xs mt-0.5">تقييمات منخفضة</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Rating distribution */}
        <div className="card">
          <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-400" /> توزيع التقييمات
          </h2>
          <div className="space-y-2.5">
            <RatingBar label="5 ★" count={stats.five_star} total={stats.total_reviews} color="bg-green-500" />
            <RatingBar label="4 ★" count={stats.four_star} total={stats.total_reviews} color="bg-amber-400" />
            <RatingBar label="3 ★" count={stats.three_star} total={stats.total_reviews} color="bg-orange-400" />
            <RatingBar label="≤2 ★" count={stats.low_star} total={stats.total_reviews} color="bg-red-500" />
          </div>
          <div className="mt-4 pt-3 border-t border-dark-700 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-brand-400 font-medium text-sm">{parseFloat(String(stats.avg_review_rating)).toFixed(1)}</p>
              <p className="text-slate-500 text-xs">تقييمات</p>
            </div>
            <div>
              <p className="text-brand-400 font-medium text-sm">{parseFloat(String(stats.avg_course_feedback_rating)).toFixed(1)}</p>
              <p className="text-slate-500 text-xs">فيدباك كورس</p>
            </div>
            <div>
              <p className="text-brand-400 font-medium text-sm">{parseFloat(String(stats.avg_batch_feedback_rating)).toFixed(1)}</p>
              <p className="text-slate-500 text-xs">فيدباك batch</p>
            </div>
          </div>
        </div>

        {/* Topics wanted */}
        <div className="card lg:col-span-2">
          <h2 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-400" /> ما يريد المتدربون تعلمه
          </h2>
          <div className="space-y-2">
            {[...course_feedback, ...batch_feedback]
              .filter((f) => f.expectations)
              .map((f) => (
                <div key={f.id} className="flex items-start gap-3 p-3 bg-dark-700/50 rounded-lg">
                  <Avatar name={f.user_name} avatarUrl={f.avatar_url} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-white">{f.user_name}</span>
                      <Stars rating={f.rating} />
                      <span className={cn(
                        'text-xs px-1.5 py-0.5 rounded',
                        f.batch_id ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                      )}>
                        {f.batch_id ? 'Batch' : 'Course'}
                      </span>
                      {f.rating <= 3 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">
                          يحتاج متابعة
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">"{f.expectations}"</p>
                    <p className="text-slate-500 text-xs mt-1">{f.course_title}</p>
                  </div>
                </div>
              ))}
            {[...course_feedback, ...batch_feedback].filter((f) => f.expectations).length === 0 && (
              <p className="text-slate-500 text-sm text-center py-6">لا توجد توقعات مكتوبة بعد</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800 p-1 rounded-xl border border-dark-700">
        {tabs.map(({ key, label, count }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center',
              tab === key ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white hover:bg-dark-700'
            )}>
            {label}
            <span className={cn('text-xs px-1.5 py-0.5 rounded-full', tab === key ? 'bg-white/20' : 'bg-dark-600')}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab: course reviews */}
      {tab === 'reviews' && (
        <div className="card">
          {/* Rating filter */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-slate-400 text-sm">فلتر:</span>
            {[0, 5, 4, 3, 2, 1].map((r) => (
              <button key={r} onClick={() => setRatingFilter(r)}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs transition-all',
                  ratingFilter === r ? 'bg-brand-500 text-white' : 'bg-dark-700 text-slate-400 hover:text-white'
                )}>
                {r === 0 ? 'الكل' : `${r} ★`}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredReviews.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-8">لا توجد تقييمات</p>
            )}
            {filteredReviews.map((review) => (
              <div key={review.id} className={cn(
                'flex items-start gap-3 p-4 rounded-xl border transition-all',
                review.is_visible
                  ? 'bg-dark-700/30 border-dark-700'
                  : 'bg-dark-800/50 border-dark-700/50 opacity-60'
              )}>
                <Avatar name={review.user_name} avatarUrl={review.avatar_url} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-white">{review.user_name}</span>
                        <Stars rating={review.rating} />
                        {!review.is_visible && (
                          <span className="text-xs bg-slate-500/20 text-slate-400 px-1.5 py-0.5 rounded">مخفي</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{review.email} · {review.course_title}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => toggleVisibility(review.id)}
                        title={review.is_visible ? 'إخفاء' : 'إظهار'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-dark-600 transition-all">
                        {review.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button onClick={() => deleteReview(review.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {review.comment ? (
                    <p className="text-slate-300 text-sm mt-2 leading-relaxed">"{review.comment}"</p>
                  ) : (
                    <p className="text-slate-600 text-xs mt-1 italic">بدون تعليق مكتوب</p>
                  )}
                  <p className="text-slate-600 text-xs mt-1">
                    {new Date(review.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: course feedback */}
      {tab === 'course_feedback' && (
        <div className="card space-y-3">
          {course_feedback.length === 0 && <p className="text-slate-500 text-sm text-center py-8">لا توجد فيدباك</p>}
          {course_feedback.map((f) => (
            <div key={f.id} className={cn(
              'p-4 rounded-xl border',
              f.rating <= 3 ? 'border-red-500/30 bg-red-500/5' : 'border-dark-700 bg-dark-700/30'
            )}>
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={f.user_name} avatarUrl={f.avatar_url} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{f.user_name}</span>
                    <Stars rating={f.rating} />
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded capitalize">{f.kind}</span>
                    {f.rating <= 3 && <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">يحتاج متابعة</span>}
                  </div>
                  <p className="text-xs text-slate-500">{f.email} · {f.course_title}</p>
                </div>
              </div>
              <div className="grid gap-2">
                {f.expectations && (
                  <div className="bg-dark-800 rounded-lg p-2.5">
                    <p className="text-xs text-slate-500 mb-0.5">التوقعات</p>
                    <p className="text-sm text-slate-300">"{f.expectations}"</p>
                  </div>
                )}
                {f.highlights && (
                  <div className="bg-dark-800 rounded-lg p-2.5">
                    <p className="text-xs text-slate-500 mb-0.5">أعجبه</p>
                    <p className="text-sm text-slate-300">"{f.highlights}"</p>
                  </div>
                )}
                {f.improvements && (
                  <div className="bg-dark-800 rounded-lg p-2.5">
                    <p className="text-xs text-slate-500 mb-0.5">اقتراحات التحسين</p>
                    <p className="text-sm text-slate-300">"{f.improvements}"</p>
                  </div>
                )}
                {f.recommend !== null && (
                  <p className="text-xs text-slate-400">
                    ينصح بالكورس: <span className={f.recommend ? 'text-green-400' : 'text-red-400'}>{f.recommend ? 'نعم' : 'لا'}</span>
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: batch feedback */}
      {tab === 'batch_feedback' && (
        <div className="card space-y-3">
          {batch_feedback.length === 0 && <p className="text-slate-500 text-sm text-center py-8">لا توجد فيدباك</p>}
          {batch_feedback.map((f) => (
            <div key={f.id} className={cn(
              'p-4 rounded-xl border',
              f.rating <= 3 ? 'border-red-500/30 bg-red-500/5' : 'border-dark-700 bg-dark-700/30'
            )}>
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={f.user_name} avatarUrl={f.avatar_url} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{f.user_name}</span>
                    <Stars rating={f.rating} />
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded capitalize">{f.kind}</span>
                    {f.rating <= 3 && <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">يحتاج متابعة</span>}
                  </div>
                  <p className="text-xs text-slate-500">{f.email} · {f.batch_name || f.course_title}</p>
                </div>
              </div>
              <div className="grid gap-2">
                {f.expectations && (
                  <div className="bg-dark-800 rounded-lg p-2.5">
                    <p className="text-xs text-slate-500 mb-0.5">التوقعات</p>
                    <p className="text-sm text-slate-300">"{f.expectations}"</p>
                  </div>
                )}
                {f.highlights && (
                  <div className="bg-dark-800 rounded-lg p-2.5">
                    <p className="text-xs text-slate-500 mb-0.5">أعجبه</p>
                    <p className="text-sm text-slate-300">"{f.highlights}"</p>
                  </div>
                )}
                {f.improvements && (
                  <div className="bg-dark-800 rounded-lg p-2.5">
                    <p className="text-xs text-slate-500 mb-0.5">اقتراحات التحسين</p>
                    <p className="text-sm text-slate-300">"{f.improvements}"</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
