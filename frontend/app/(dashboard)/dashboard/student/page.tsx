'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, TrendingUp, Award, Play, ChevronRight, Sparkles } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Enrollment {
  course_id: string; course_title: string; type: string;
  thumbnail_url: string; progress_pct: number; last_lesson_id: string;
}

interface Recommendation {
  id: string; title: string; type: string; thumbnail_url: string;
  level: string; duration_hours: number;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/enrollments/my'),
      api.get('/users/recommendations'),
    ]).then(([e, r]) => {
      setEnrollments(e.data);
      setRecommendations(r.data);
    }).finally(() => setLoading(false));
  }, []);

  const inProgress = enrollments.filter((e) => e.progress_pct > 0 && e.progress_pct < 100);
  const notStarted = enrollments.filter((e) => e.progress_pct === 0);
  const completed = enrollments.filter((e) => e.progress_pct === 100);

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, <span className="text-brand-400">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {inProgress.length > 0
            ? `You have ${inProgress.length} course${inProgress.length > 1 ? 's' : ''} in progress.`
            : 'Ready to start learning?'}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: BookOpen, label: 'Enrolled', value: enrollments.length, color: 'text-blue-400' },
          { icon: TrendingUp, label: 'In Progress', value: inProgress.length, color: 'text-yellow-400' },
          { icon: Award, label: 'Completed', value: completed.length, color: 'text-green-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card text-center">
            <Icon className={cn('w-6 h-6 mx-auto mb-2', color)} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Continue learning */}
      {inProgress.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Play className="w-5 h-5 text-brand-400" /> Continue Learning
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
                    <p className="text-xs text-slate-400">{e.progress_pct}% complete</p>
                  </div>
                </div>
                <Link
                  href={e.last_lesson_id ? `/courses/${e.course_id}/lessons/${e.last_lesson_id}` : `/courses/${e.course_id}`}
                  className="mt-4 btn-primary w-full text-sm flex items-center justify-center gap-2"
                >
                  <Play className="w-3.5 h-3.5" /> Resume
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Not started */}
      {notStarted.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Not Started Yet</h2>
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
      {recommendations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-400" /> Recommended for You
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
          <h3 className="text-white font-semibold mb-2">No courses yet</h3>
          <p className="text-slate-400 text-sm mb-6">Explore our catalog and enroll in your first course.</p>
          <Link href="/courses" className="btn-primary inline-flex items-center gap-2">
            Browse Courses <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
