'use client';
import { useState, useEffect } from 'react';
import { Star, MessageSquare, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface Review {
  id: string;
  user_name: string;
  avatar_url: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function ReviewSection({ courseId }: { courseId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [distribution, setDistribution] = useState<{ rating: number; count: number }[]>([]);
  const [myReview, setMyReview] = useState<{ rating: number; comment: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/courses/${courseId}/reviews`);
      setReviews(data.reviews);
      setTotal(data.total);
      setDistribution(data.distribution);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const fetchMyReview = async () => {
    if (!user) return;
    try {
      const { data } = await api.get(`/courses/${courseId}/reviews/mine`);
      if (data) {
        setMyReview(data);
        setRating(data.rating);
        setComment(data.comment || '');
      }
    } catch { /* silent */ }
  };

  useEffect(() => { fetchReviews(); fetchMyReview(); }, [courseId]);

  const submit = async () => {
    if (!rating) { toast.error('اختر تقييم'); return; }
    setSubmitting(true);
    try {
      await api.post(`/courses/${courseId}/reviews`, { rating, comment });
      toast.success(myReview ? 'تم تعديل التقييم' : 'شكراً لتقييمك!');
      fetchReviews();
      fetchMyReview();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'فشل إرسال التقييم');
    }
    setSubmitting(false);
  };

  const avgRating = total > 0
    ? (distribution.reduce((sum, d) => sum + d.rating * d.count, 0) / total).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-brand-400" /> التقييمات والمراجعات
      </h2>

      {/* Rating summary */}
      <div className="flex gap-8 items-start">
        <div className="text-center">
          <p className="text-4xl font-bold text-white">{avgRating}</p>
          <div className="flex gap-0.5 justify-center my-1">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={`w-4 h-4 ${s <= Math.round(parseFloat(avgRating)) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
            ))}
          </div>
          <p className="text-slate-500 text-sm">{total} تقييم</p>
        </div>
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map(s => {
            const count = distribution.find(d => d.rating === s)?.count || 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={s} className="flex items-center gap-2 text-sm">
                <span className="text-slate-400 w-3">{s}</span>
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <div className="flex-1 bg-dark-700 rounded-full h-2">
                  <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-slate-500 w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write review form */}
      {user && (
        <div className="card border border-dark-600">
          <h3 className="text-white font-medium mb-3">{myReview ? 'تعديل تقييمك' : 'أضف تقييمك'}</h3>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setRating(s)}>
                <Star className={`w-6 h-6 ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'} hover:text-yellow-400`} />
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            placeholder="اكتب رأيك عن الكورس..." className="input w-full" rows={3} />
          <button onClick={submit} disabled={submitting || !rating} className="btn-primary mt-2 text-sm">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (myReview ? 'تعديل التقييم' : 'إرسال التقييم')}
          </button>
        </div>
      )}

      {/* Reviews list */}
      {loading ? (
        <Loader2 className="w-6 h-6 animate-spin text-brand-400 mx-auto" />
      ) : reviews.length === 0 ? (
        <p className="text-slate-500 text-center py-4">لا توجد تقييمات بعد</p>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="card">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-bold">
                  {r.user_name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{r.user_name}</p>
                  <p className="text-slate-500 text-xs">{new Date(r.created_at).toLocaleDateString('ar-EG')}</p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
                  ))}
                </div>
              </div>
              {r.comment && <p className="text-slate-300 text-sm">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
