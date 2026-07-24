'use client';
import { useEffect, useState } from 'react';
import { Star, Loader2, Send, MessageCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface FeedbackForm {
  rating: number;
  expectations: string;
  highlights: string;
  improvements: string;
  recommend: boolean | null;
}

interface ExistingFeedback {
  kind: 'first' | 'last';
  rating: number | null;
  expectations: string | null;
  highlights: string | null;
  improvements: string | null;
  recommend: boolean | null;
}

export default function CourseFeedback({
  courseId, kind,
}: {
  courseId: string;
  kind: 'first' | 'last';
}) {
  const [open, setOpen] = useState(false);
  const [existing, setExisting] = useState<ExistingFeedback | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState<FeedbackForm>({
    rating: 0, expectations: '', highlights: '', improvements: '', recommend: null,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get(`/courses/${courseId}/my-feedback`)
      .then(({ data }) => {
        const found = data.find((f: ExistingFeedback) => f.kind === kind);
        if (found) {
          setExisting(found);
          setForm({
            rating: found.rating || 0,
            expectations: found.expectations || '',
            highlights: found.highlights || '',
            improvements: found.improvements || '',
            recommend: found.recommend,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [courseId, kind]);

  const submit = async () => {
    if (form.rating === 0) { toast.error('اختار تقييم بالنجوم'); return; }
    setSubmitting(true);
    try {
      await api.post(`/courses/${courseId}/feedback`, { kind, ...form });
      toast.success('🙏 شكراً لرأيك!');
      setExisting({ kind, ...form });
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'فشل الإرسال');
    }
    finally { setSubmitting(false); }
  };

  if (!loaded) return null;

  // Already submitted → small badge with edit option
  if (existing && !open) {
    return (
      <div className="card border-green-500/30 bg-green-500/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/15 text-green-400 flex items-center justify-center">
            <Check className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium text-sm">
              {kind === 'first' ? 'فيدباك بداية الكورس' : 'فيدباك نهاية الكورس'} ✓
            </p>
            <p className="text-xs text-slate-400">شكراً، تم استلام رأيك</p>
          </div>
          <button onClick={() => setOpen(true)} className="text-xs text-brand-400 hover:underline">تعديل</button>
        </div>
      </div>
    );
  }

  if (!open) {
    return (
      <div className={cn('card', kind === 'first' ? 'border-blue-500/40 bg-blue-500/5' : 'border-yellow-500/40 bg-yellow-500/5')}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center',
              kind === 'first' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400'
            )}>
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-white font-medium">
                {kind === 'first' ? '👋 رأيك يهمنا — فيدباك بداية الكورس' : '🎓 قيّم تجربتك مع الكورس'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {kind === 'first' ? 'دقيقتين فقط لمشاركة توقعاتك' : 'ساعدنا نطور الكورسات الجاية'}
              </p>
            </div>
          </div>
          <button onClick={() => setOpen(true)} className={cn('text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors',
            kind === 'first' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-yellow-500 hover:bg-yellow-600'
          )}>
            ابدأ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card space-y-4 border-brand-500/30">
      <h3 className="text-lg font-bold text-white">
        {kind === 'first' ? '👋 فيدباك بداية الكورس' : '🎓 فيدباك نهاية الكورس'}
      </h3>

      <div>
        <label className="block text-sm text-slate-300 mb-2">تقييمك العام (من 5)</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setForm({ ...form, rating: n })}
              className={cn('p-2 rounded transition-all',
                form.rating >= n ? 'text-yellow-400' : 'text-slate-600 hover:text-slate-400'
              )}>
              <Star className="w-7 h-7" fill={form.rating >= n ? 'currentColor' : 'none'} />
            </button>
          ))}
        </div>
      </div>

      {kind === 'first' ? (
        <div>
          <label className="block text-sm text-slate-300 mb-1.5">إيه توقعاتك من الكورس؟ وإيه اللي عايز تتعلمه؟</label>
          <textarea value={form.expectations}
            onChange={(e) => setForm({ ...form, expectations: e.target.value })}
            rows={3} className="input resize-none"
            placeholder="عايز أتعلم..." />
        </div>
      ) : (
        <>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">إيه أكتر حاجة استفدت منها؟</label>
            <textarea value={form.highlights}
              onChange={(e) => setForm({ ...form, highlights: e.target.value })}
              rows={3} className="input resize-none"
              placeholder="استفدت من..." />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">هل تنصح أصحابك بالكورس؟</label>
            <div className="flex gap-2">
              {[
                { v: true,  label: '👍 نعم، أنصح به' },
                { v: false, label: '👎 لا' },
              ].map(({ v, label }) => (
                <button key={String(v)} onClick={() => setForm({ ...form, recommend: v })}
                  className={cn('flex-1 px-4 py-2 rounded-lg border text-sm transition-all',
                    form.recommend === v
                      ? 'bg-brand-500/20 border-brand-500/50 text-brand-300'
                      : 'border-dark-600 text-slate-400 hover:border-brand-500/30'
                  )}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div>
        <label className="block text-sm text-slate-300 mb-1.5">اقتراحات للتحسين (اختياري)</label>
        <textarea value={form.improvements}
          onChange={(e) => setForm({ ...form, improvements: e.target.value })}
          rows={2} className="input resize-none"
          placeholder="ممكن تتحسن..." />
      </div>

      <div className="flex gap-2">
        <button onClick={submit} disabled={submitting}
          className="btn-primary flex items-center gap-2">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          إرسال
        </button>
        <button onClick={() => setOpen(false)} className="btn-secondary">إلغاء</button>
      </div>
    </div>
  );
}
