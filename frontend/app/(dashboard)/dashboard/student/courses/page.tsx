'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Play, Clock, Award } from 'lucide-react';
import api from '@/lib/api';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

interface Enrollment {
  course_id: string; course_title: string; type: string;
  thumbnail_url: string; progress_pct: number; enrolled_at: string;
  completed_at: string | null; instructor_name: string; duration_hours: number;
  last_lesson_id: string | null;
}

export default function MyCoursesPage() {
  const { t } = useLanguage();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed' | 'not-started'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/enrollments/my').then(({ data }) => setEnrollments(data)).finally(() => setLoading(false));
  }, []);

  const filtered = enrollments.filter((e) => {
    if (filter === 'completed') return e.progress_pct === 100;
    if (filter === 'in-progress') return e.progress_pct > 0 && e.progress_pct < 100;
    if (filter === 'not-started') return e.progress_pct === 0;
    return true;
  });

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white">{t('nav.myCourses')}</h1>
        <p className="text-slate-400 text-sm mt-1">{enrollments.length} {t('courses.enrolledCount')}</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'all', label: t('common.all') },
          { key: 'in-progress', label: t('student.inProgress') },
          { key: 'completed', label: t('student.completed') },
          { key: 'not-started', label: t('student.notStarted') },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
              filter === key
                ? 'bg-brand-500 text-white'
                : 'bg-dark-700 text-slate-400 hover:text-white hover:bg-dark-600'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Course grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading
          ? [...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="w-full h-48 bg-dark-700 rounded-lg mb-3" />
              <div className="h-4 bg-dark-700 rounded mb-2" />
              <div className="h-3 bg-dark-700 rounded w-2/3" />
            </div>
          ))
          : filtered.map((e) => (
            <div key={e.course_id} className="card hover:border-brand-500/40 transition-all duration-200 flex flex-col">
              <div className="w-full h-48 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden"
                style={{ background: e.thumbnail_url ? undefined : 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))' }}>
                {e.thumbnail_url ? (
                  <img src={e.thumbnail_url} alt={e.course_title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-14 h-14 text-brand-400" />
                )}
                {e.progress_pct === 100 && (
                  <div className="absolute top-2 right-2"><Award className="w-5 h-5 text-yellow-400" /></div>
                )}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className={cn('badge', e.type === 'live' ? 'badge-purple' : 'badge-blue')}>{e.type}</span>
                {e.progress_pct === 100 && <span className="badge badge-green">{t('student.completed')}</span>}
              </div>
              <h3 className="font-semibold text-white text-sm mb-2 flex-1 line-clamp-2">{e.course_title}</h3>
              <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{e.duration_hours}h</span>
                <span>{e.instructor_name}</span>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{t('progress.progress')}</span>
                  <span className="font-medium text-white">{e.progress_pct}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${e.progress_pct}%` }} />
                </div>
              </div>
              <Link
                href={e.last_lesson_id ? `/courses/${e.course_id}/lessons/${e.last_lesson_id}` : `/courses/${e.course_id}`}
                className="btn-primary w-full text-sm flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5" />
                {e.progress_pct === 0 ? t('student.start') : e.progress_pct === 100 ? t('student.review') : t('student.resume')}
              </Link>
            </div>
          ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="card text-center py-14">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-4">{t('student.noCourses')}</p>
          <Link href="/courses" className="btn-primary text-sm inline-flex">{t('nav.browse')}</Link>
        </div>
      )}
    </div>
  );
}
