'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Video, Play, Calendar, Users, ArrowLeft, Loader2, Radio, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
import BatchChat from '@/components/BatchChat';
import BatchAssignments from '@/components/BatchAssignments';
import BatchFeedback from '@/components/BatchFeedback';
import { cn } from '@/lib/utils';

interface Recording {
  id: string; title: string; recording_url: string;
  duration_minutes: number; recorded_at: string;
}

interface Batch {
  id: string; name: string; description: string;
  start_date: string | null; end_date: string | null;
  course_title: string;
  live_url: string | null;
  next_session_at: string | null;
  total_sessions: number;
}

export default function StudentBatchPage() {
  const { id } = useParams();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'sessions' | 'assignments' | 'chat'>('sessions');

  useEffect(() => {
    Promise.all([
      api.get('/batches/my'),
      api.get(`/batches/${id}/recordings`),
    ]).then(([myBatches, recs]) => {
      const b = myBatches.data.find((x: any) => x.id === id);
      setBatch(b || null);
      setRecordings(recs.data);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>;
  if (!batch) return <div className="card text-center py-12 text-slate-400">الدفعة غير موجودة أو ليس لديك صلاحية</div>;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <Link href="/dashboard/student" className="text-slate-400 hover:text-white text-sm flex items-center gap-1 mb-3">
          <ArrowLeft className="w-4 h-4" /> الرئيسية
        </Link>
        <div className="card">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-400 text-sm">{batch.course_title}</p>
              <h1 className="text-2xl font-bold text-white mt-0.5">{batch.name}</h1>
              {batch.description && <p className="text-slate-300 text-sm mt-2">{batch.description}</p>}
              {batch.start_date && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-3">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {format(new Date(batch.start_date), 'MMM d, yyyy')}
                    {batch.end_date && ` → ${format(new Date(batch.end_date), 'MMM d, yyyy')}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {batch.total_sessions > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-white">📊 تقدم المحاضرات</h3>
            <span className="text-sm text-brand-400 font-bold">
              {recordings.length} / {batch.total_sessions}
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{
              width: `${Math.min(100, Math.round((recordings.length / batch.total_sessions) * 100))}%`
            }} />
          </div>
          <p className="text-slate-400 text-xs mt-2">
            تم رفع <strong className="text-white">{recordings.length}</strong> محاضرة من إجمالي <strong className="text-white">{batch.total_sessions}</strong>
            {recordings.length >= batch.total_sessions && ' — اكتمل الكورس 🎉'}
          </p>
        </div>
      )}

      {/* Live session banner */}
      {batch.live_url && (
        <div className="card border-red-500/30 bg-red-500/5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center relative">
                <Radio className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              </div>
              <div>
                <p className="font-semibold text-white">جلسة Live متاحة</p>
                {batch.next_session_at && (
                  <p className="text-xs text-slate-400">
                    📅 {format(new Date(batch.next_session_at), 'EEEE d MMM, HH:mm')}
                  </p>
                )}
              </div>
            </div>
            <a href={batch.live_url} target="_blank" rel="noreferrer"
               className="btn-primary flex items-center gap-2 bg-red-500 hover:bg-red-600 border-red-500">
              <Radio className="w-4 h-4" /> انضم للايف الآن
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Feedback prompts (auto-shown at first/last session) */}
      <BatchFeedback batchId={String(id)} kind="first"
        totalSessions={batch.total_sessions} recordingsCount={recordings.length} />
      <BatchFeedback batchId={String(id)} kind="last"
        totalSessions={batch.total_sessions} recordingsCount={recordings.length} />

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800 border border-dark-700 rounded-xl p-1 w-fit">
        {([
          { key: 'sessions', label: '🎬 المحاضرات' },
          { key: 'assignments', label: '📝 المهام والتقييم' },
          { key: 'chat', label: '💬 الشات' },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === key ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
            )}>
            {label}
          </button>
        ))}
      </div>

      {/* Sessions tab */}
      {tab === 'sessions' && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-400" /> تسجيلات المحاضرات
          </h2>
          {recordings.length === 0 ? (
            <div className="card text-center py-10 text-slate-400">لا توجد تسجيلات بعد</div>
          ) : (
            <div className="space-y-2">
              {recordings.map((r) => (
                <a key={r.id} href={r.recording_url} target="_blank" rel="noreferrer"
                   className="card flex items-center gap-3 hover:border-purple-500/40 transition-all">
                  <div className="w-10 h-10 bg-purple-500/15 text-purple-400 rounded-lg flex items-center justify-center">
                    <Play className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{r.title}</p>
                    <p className="text-xs text-slate-400">
                      {r.recorded_at && format(new Date(r.recorded_at), 'MMM d, yyyy · HH:mm')}
                      {r.duration_minutes && ` · ${r.duration_minutes} دقيقة`}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignments tab */}
      {tab === 'assignments' && <BatchAssignments batchId={String(id)} />}

      {/* Chat tab */}
      {tab === 'chat' && (
        <div className="max-w-3xl">
          <BatchChat batchId={String(id)} />
        </div>
      )}
    </div>
  );
}
