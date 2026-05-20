'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, TrendingUp, Award, Play, ChevronRight, Sparkles, Users, MessageSquare, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

interface Enrollment {
  course_id: string; course_title: string; type: string;
  thumbnail_url: string; progress_pct: number; last_lesson_id: string;
}

interface Recommendation {
  id: string; title: string; type: string; thumbnail_url: string;
  level: string; duration_hours: number;
}

interface Batch {
  id: string; name: string; description: string;
  start_date: string | null; end_date: string | null;
  course_title: string; course_type: string;
  total_sessions: number;
  recordings_count?: number;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/enrollments/my'),
      api.get('/users/recommendations'),
      api.get('/batches/my'),
    ]).then(([e, r, b]) => {
      setEnrollments(e.data);
      setRecommendations(r.data);
      setBatches(b.data);
    }).finally(() => setLoading(false));
  }, []);

  const inProgress = enrollments.filter((e) => e.progress_pct > 0 && e.progress_pct < 100);
  const notStarted = enrollments.filter((e) => e.progress_pct === 0);
  const completed = enrollments.filter((e) => e.progress_pct === 100);

  const isLive = user?.student_type === 'live';

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {t('student.welcome')} <span className="text-brand-400">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {isLive
              ? (batches.length > 0 ? `${batches.length} ${t('student.hasActiveBatches')}` : t('student.waitAdmin'))
              : (inProgress.length > 0 ? `${inProgress.length} ${t('student.hasInProgress')}` : t('student.exploreStart'))
            }
          </p>
        </div>
        <span className={cn('badge text-xs', isLive ? 'badge-purple' : 'badge-blue')}>
          {isLive ? `🔴 ${t('student.liveStudent')}` : `💻 ${t('student.onlineStudent')}`}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: BookOpen, label: t('student.enrolled'), value: enrollments.length, color: 'text-blue-400' },
          { icon: TrendingUp, label: t('student.inProgress'), value: inProgress.length, color: 'text-yellow-400' },
          { icon: Award, label: t('student.completed'), value: completed.length, color: 'text-green-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card text-center">
            <Icon className={cn('w-6 h-6 mx-auto mb-2', color)} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* My Batches */}
      {batches.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" /> {t('student.myBatches')}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {batches.map((b) => {
              const total = b.total_sessions || 0;
              const done = b.recordings_count || 0;
              const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
              return (
                <Link key={b.id} href={`/dashboard/student/batches/${b.id}`}
                  className="card hover:border-purple-500/40 transition-all duration-200 group">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400">{b.course_title}</p>
                      <p className="font-semibold text-white truncate">{b.name}</p>
                      {b.start_date && (
                        <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(b.start_date), 'MMM d, yyyy')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-purple-400 text-xs">
                      <MessageSquare className="w-3.5 h-3.5" /> {t('student.chat')}
                    </div>
                  </div>
                  {total > 0 && (
                    <div className="mt-3 pt-3 border-t border-dark-700">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-400">{t('student.lectures')}</span>
                        <span className="text-white font-medium">{done} / {total}</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Continue learning */}
      {inProgress.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-brand-400" /> {t('student.continueLearning')}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {inProgress.map((e) => (
              <div key={e.course_id} className="card hover:border-brand-500/40 transition-all duration-200 group">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-dark-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-7 h-7 text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{e.course_title}</p>
                    <div className="progress-bar mt-2 mb-1">
                      <div className="progress-fill" style={{ width: `${e.progress_pct}%` }} />
                    </div>
                    <p className="text-xs text-slate-400">{e.progress_pct}% {t('student.complete')}</p>
                  </div>
                </div>
                <Link
                  href={e.last_lesson_id ? `/courses/${e.course_id}/lessons/${e.last_lesson_id}` : `/courses/${e.course_id}`}
                  className="mt-4 btn-primary w-full text-sm flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5" /> {t('student.resume')}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Not started */}
      {notStarted.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">{t('student.notStarted')}</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {notStarted.map((e) => (
              <Link key={e.course_id} href={`/courses/${e.course_id}`} className="card hover:border-brand-500/40 transition-all duration-200 group flex items-center gap-3">
                <div className="w-10 h-10 bg-dark-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-slate-400 group-hover:text-brand-400 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-200 truncate text-sm">{e.course_title}</p>
                  <p className="text-xs text-slate-500 capitalize">{e.type}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {!isLive && recommendations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" /> {t('student.recommended')}
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {recommendations.map((r) => (
              <Link key={r.id} href={`/courses/${r.id}`} className="card hover:border-brand-500/40 transition-all duration-200 group">
                <div className="w-full h-24 bg-gradient-to-br from-brand-500/20 to-purple-500/20 rounded-lg mb-3 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-brand-400" />
                </div>
                <p className="font-semibold text-slate-200 text-sm mb-1 line-clamp-2">{r.title}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-400 capitalize">{r.level}</span>
                  <span className="text-xs text-slate-500">{r.duration_hours}h</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {enrollments.length === 0 && !loading && (
        <div className="card text-center py-16">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">{t('student.noCourses')}</h3>
          <p className="text-slate-400 text-sm mb-6">{t('student.noCoursesDesc')}</p>
          <Link href="/courses" className="btn-primary inline-flex items-center gap-2">
            {t('nav.browse')} <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
