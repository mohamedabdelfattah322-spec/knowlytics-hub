'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Video, Play, Calendar, Users, ArrowLeft, Loader2, Radio, ExternalLink, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';
import BatchChat from '@/components/BatchChat';
import BatchAssignments from '@/components/BatchAssignments';
import BatchFeedback from '@/components/BatchFeedback';
import CertificateButton from '@/components/CertificateButton';
import { cn } from '@/lib/utils';

interface Recording {
  id: string; title: string; recording_url: string;
  duration_minutes: number; recorded_at: string;
}

interface Batch {
  id: string; course_id: string; name: string; description: string;
  start_date: string | null; end_date: string | null;
  course_title: string;
  live_url: string | null;
  next_session_at: string | null;
  total_sessions: number;
  recordings_count?: number;
}

export default function StudentBatchPage() {
  const { id } = useParams();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'sessions' | 'assignments' | 'chat'>('sessions');
  const [topThree, setTopThree] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      api.get('/batches/my'),
      api.get(`/batches/${id}/recordings`),
      api.get(`/batches/${id}/leaderboard`),
    ]).then(([myBatches, recs, lb]) => {
      const b = myBatches.data.find((x: any) => x.id === id);
      setBatch(b || null);
      setRecordings(recs.data);
      setTopThree((lb.data || []).filter((l: any) => l.avg_grade !== null).slice(0, 3));
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

      {/* Progress bar — uses max(recordings, lessons-with-video) from API */}
      {batch.total_sessions > 0 && (() => {
        const completed = Math.max(recordings.length, batch.recordings_count || 0);
        return (
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-white">📊 تقدم المحاضرات</h3>
              <span className="text-sm text-brand-400 font-bold">
                {completed} / {batch.total_sessions}
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{
                width: `${Math.min(100, Math.round((completed / batch.total_sessions) * 100))}%`
              }} />
            </div>
            <p className="text-slate-400 text-xs mt-2">
              تم تقديم <strong className="text-white">{completed}</strong> محاضرة من إجمالي <strong className="text-white">{batch.total_sessions}</strong>
              {completed >= batch.total_sessions && ' — اكتمل الكورس 🎉'}
            </p>
          </div>
        );
      })()}

      {/* Live session banner — smart based on scheduled time */}
      {batch.live_url && (() => {
        const now = new Date();
        const scheduled = batch.next_session_at ? new Date(batch.next_session_at) : null;
        const minutesUntil = scheduled ? (scheduled.getTime() - now.getTime()) / 60000 : null;

        // States:
        //   null/no schedule  → permanent "join anytime" (small)
        //   future > 30 min   → "Upcoming: next session at..."
        //   -30 min .. +90 min → "LIVE NOW" big red pulse
        //   past > 90 min     → ended, hide join button, prompt admin to update
        const isLiveNow  = minutesUntil !== null && minutesUntil <= 30 && minutesUntil >= -90;
        const isUpcoming = minutesUntil !== null && minutesUntil > 30;
        const isEnded    = minutesUntil !== null && minutesUntil < -90;

        if (isEnded) {
          return (
            <div className="card border-slate-600 bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-700 text-slate-400 flex items-center justify-center">
                  <Radio className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-300 font-medium">آخر جلسة انتهت</p>
                  <p className="text-xs text-slate-500">
                    📅 {format(scheduled!, 'EEEE d MMM, HH:mm')} — موعد الجلسة الجاية لسه ما اتحددش
                  </p>
                </div>
              </div>
            </div>
          );
        }

        if (isUpcoming) {
          return (
            <div className="card border-blue-500/40 bg-blue-500/5">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">الجلسة الجاية</p>
                    <p className="text-sm text-blue-300">
                      📅 {format(scheduled!, 'EEEE d MMM, HH:mm')}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      بعد {Math.round(minutesUntil! / 60)} ساعة تقريباً
                    </p>
                  </div>
                </div>
                <a href={batch.live_url} target="_blank" rel="noreferrer"
                   className="btn-secondary flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" /> رابط الجلسة (يفتح في موعدها)
                </a>
              </div>
            </div>
          );
        }

        // isLiveNow OR no schedule → show join button
        return (
          <div className="card border-red-500/30 bg-red-500/5">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center relative">
                  <Radio className="w-6 h-6" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {isLiveNow ? '🔴 الجلسة شغالة الآن' : 'جلسة Live'}
                  </p>
                  {scheduled && (
                    <p className="text-xs text-slate-400">
                      📅 {format(scheduled, 'EEEE d MMM, HH:mm')}
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
        );
      })()}

      {/* Top 3 leaderboard — visible always when there are graded submissions */}
      {topThree.length > 0 && (() => {
        const completed = Math.max(recordings.length, batch.recordings_count || 0);
        const isFinal = completed >= batch.total_sessions && batch.total_sessions > 0;
        return (
          <div className={`card bg-gradient-to-br ${isFinal ? 'from-yellow-500/10 via-orange-500/5 to-purple-500/10 border-yellow-500/40' : 'from-yellow-500/5 to-purple-500/5 border-yellow-500/20'}`}>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              {isFinal ? '🏆 النتائج النهائية — Top 3' : '🏆 الترتيب الحالي — Top 3'}
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {topThree.map((l, i) => {
                const colors = [
                  { bg: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/40', icon: '🥇', text: 'text-yellow-400' },
                  { bg: 'from-slate-400/20 to-slate-500/10',   border: 'border-slate-400/40', icon: '🥈', text: 'text-slate-300' },
                  { bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/40', icon: '🥉', text: 'text-orange-400' },
                ][i];
                return (
                  <div key={l.id} className={`rounded-xl p-4 border bg-gradient-to-br ${colors.bg} ${colors.border}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-3xl">{colors.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{l.name}</p>
                        <p className="text-xs text-slate-400">المركز #{i + 1}</p>
                      </div>
                    </div>
                    <div className={`text-2xl font-bold ${colors.text}`}>
                      {l.avg_grade}<span className="text-sm text-slate-400">/100</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{l.graded_count} مهمة مقيّمة</p>
                  </div>
                );
              })}
            </div>
            {isFinal && (
              <div className="mt-4 pt-4 border-t border-yellow-500/20 flex items-center justify-between gap-3 flex-wrap">
                <p className="text-yellow-300 font-medium">🎉 الكورس اكتمل — مبروك!</p>
                <CertificateButton courseId={batch.course_id} batchId={String(id)} />
              </div>
            )}
          </div>
        );
      })()}

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
