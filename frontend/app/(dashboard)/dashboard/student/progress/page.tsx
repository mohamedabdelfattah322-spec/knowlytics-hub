'use client';
import { useEffect, useState } from 'react';
import { BarChart2, Award, Clock, CheckCircle } from 'lucide-react';
import api from '@/lib/api';
import { scoreLevel, cn } from '@/lib/utils';

interface ProgressItem {
  course_id: string; course_title: string; type: string;
  progress_pct: number; enrolled_at: string; completed_at: string | null;
  quiz_attempts: string; best_score: string | null;
}

const LevelBadge = ({ pct }: { pct: number | null }) => {
  if (!pct) return <span className="badge badge-yellow">No quiz yet</span>;
  const level = scoreLevel(pct);
  const cls = level === 'Advanced' ? 'badge-green' : level === 'Intermediate' ? 'badge-yellow' : 'badge-red';
  return <span className={cn('badge', cls)}>{level}</span>;
};

export default function ProgressPage() {
  const [progress, setProgress] = useState<ProgressItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/progress').then(({ data }) => setProgress(data)).finally(() => setLoading(false));
  }, []);

  const avgProgress = progress.length
    ? Math.round(progress.reduce((acc, p) => acc + p.progress_pct, 0) / progress.length)
    : 0;

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white">My Progress</h1>
        <p className="text-slate-400 text-sm mt-1">Track your learning journey across all courses</p>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: BarChart2, label: 'Avg Progress', value: `${avgProgress}%`, color: 'text-brand-400' },
          { icon: CheckCircle, label: 'Completed', value: progress.filter((p) => p.completed_at).length, color: 'text-green-400' },
          { icon: Clock, label: 'In Progress', value: progress.filter((p) => !p.completed_at && p.progress_pct > 0).length, color: 'text-yellow-400' },
          { icon: Award, label: 'Quiz Attempts', value: progress.reduce((a, p) => a + parseInt(p.quiz_attempts || '0'), 0), color: 'text-purple-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card text-center">
            <Icon className={cn('w-6 h-6 mx-auto mb-2', color)} />
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Progress table */}
      <div className="space-y-3">
        {loading
          ? [...Array(3)].map((_, i) => <div key={i} className="card h-20 animate-pulse bg-dark-700" />)
          : progress.map((p) => (
            <div key={p.course_id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <p className="font-semibold text-white">{p.course_title}</p>
                    <span className={cn('badge', p.type === 'live' ? 'badge-purple' : 'badge-blue')}>{p.type}</span>
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Course Progress</span>
                        <span className="font-medium text-white">{p.progress_pct}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${p.progress_pct}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>{p.quiz_attempts} quiz attempt{parseInt(p.quiz_attempts) !== 1 ? 's' : ''}</span>
                    {p.best_score && <span>Best score: <span className="text-white font-medium">{p.best_score}%</span></span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <LevelBadge pct={p.best_score ? parseFloat(p.best_score) : null} />
                  {p.completed_at && <span className="badge badge-green">✓ Completed</span>}
                </div>
              </div>
            </div>
          ))}
        {!loading && progress.length === 0 && (
          <div className="card text-center py-12">
            <BarChart2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No progress data yet. Enroll in a course to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
