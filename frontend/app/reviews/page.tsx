'use client';
import { useEffect, useState } from 'react';
import { Star, Quote, Loader2 } from 'lucide-react';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import { useLanguage } from '@/hooks/useLanguage';
import api from '@/lib/api';

interface Review {
  rating: number; comment: string; created_at: string;
  user_name: string; avatar_url: string | null; course_title: string;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className="w-4 h-4" style={{ color: i <= rating ? '#f59e0b' : '#334155', fill: i <= rating ? '#f59e0b' : 'none' }} />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const { t, isAr, dir } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/public/reviews').then(({ data }) => setReviews(data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" dir={dir} style={{ backgroundColor: '#0a1628' }}>
      <PublicNavbar />

      {/* Header */}
      <section className="py-16 text-center" style={{ backgroundColor: '#0f1d32' }}>
        <div className="max-w-4xl mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ color: '#ffffff' }}>
            {t('landing.reviewsTitle')}
          </h1>
          <p className="text-lg" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {t('landing.reviewsDesc')}
          </p>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-16" style={{ backgroundColor: '#0a1628' }}>
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3b82f6' }} />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-20">
              <Star className="w-12 h-12 mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.2)' }} />
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                {isAr ? 'لا توجد تقييمات بعد' : 'No reviews yet'}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review, i) => (
                <div key={i} className="rounded-2xl p-6 hover:scale-[1.01] transition-transform"
                     style={{ backgroundColor: '#162038', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Quote className="w-7 h-7 mb-3 opacity-20" style={{ color: '#3b82f6' }} />
                  <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    &ldquo;{review.comment}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                         style={{ backgroundColor: 'rgba(59,130,246,0.2)', color: '#60a5fa' }}>
                      {review.user_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: '#ffffff' }}>{review.user_name}</p>
                      <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{review.course_title}</p>
                    </div>
                    <Stars rating={review.rating} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
