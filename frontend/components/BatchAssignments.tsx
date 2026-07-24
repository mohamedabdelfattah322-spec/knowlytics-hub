'use client';
import { useEffect, useState, useRef } from 'react';
import { ClipboardList, Upload, Loader2, Check, FileText, Star, Edit2, X, Award, Trophy, Medal } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Assignment {
  id: string; title: string; description: string;
  due_days: number; lesson_title: string; section_title: string;
  submission_id: string | null;
  submission_file: string | null;
  submission_notes: string | null;
  grade: number | null;
  feedback: string | null;
  submitted_at: string | null;
  total_submissions: number;
}

interface LeaderboardRow {
  id: string; name: string; email: string;
  avg_grade: number | null;
  graded_count: number;
  total_submitted: number;
}

export default function BatchAssignments({ batchId }: { batchId: string }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [leaders, setLeaders] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [a, l] = await Promise.all([
        api.get(`/batches/${batchId}/assignments`),
        api.get(`/batches/${batchId}/leaderboard`),
      ]);
      setAssignments(a.data);
      setLeaders(l.data);
      const notes: Record<string, string> = {};
      a.data.forEach((x: Assignment) => { if (x.submission_notes) notes[x.id] = x.submission_notes; });
      setNotesById(notes);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [batchId]);

  const submit = async (id: string, file: File | null) => {
    setSubmittingId(id);
    try {
      const fd = new FormData();
      if (file) fd.append('file', file);
      fd.append('notes', notesById[id] || '');
      await api.post(`/assignments/${id}/submit`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('✅ تم تسليم المهمة');
      await load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'فشل التسليم');
    } finally {
      setSubmittingId(null);
    }
  };

  const myStanding = leaders.findIndex((l) => l.avg_grade !== null) >= 0
    ? leaders.find((l: any) => l.is_me)
    : null;

  const myAvg = assignments.filter((a) => a.grade !== null).length > 0
    ? Math.round(assignments.filter((a) => a.grade !== null).reduce((s, a) => s + (a.grade || 0), 0) / assignments.filter((a) => a.grade !== null).length)
    : null;

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Leaderboard - Top 3 */}
      {leaders.filter((l) => l.avg_grade !== null).length > 0 && (
        <div className="card bg-gradient-to-br from-yellow-500/5 to-purple-500/5 border-yellow-500/20">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" /> Top 3 - الأوائل في الدفعة
          </h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {leaders.filter((l) => l.avg_grade !== null).slice(0, 3).map((l, i) => {
              const colors = [
                { bg: 'from-yellow-500/20 to-yellow-600/10', border: 'border-yellow-500/40', icon: '🥇', text: 'text-yellow-400' },
                { bg: 'from-slate-400/20 to-slate-500/10',   border: 'border-slate-400/40', icon: '🥈', text: 'text-slate-300' },
                { bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/40', icon: '🥉', text: 'text-orange-400' },
              ][i];
              return (
                <div key={l.id} className={cn('rounded-xl p-4 border bg-gradient-to-br', colors.bg, colors.border)}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">{colors.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{l.name}</p>
                      <p className="text-xs text-slate-400">المركز #{i + 1}</p>
                    </div>
                  </div>
                  <div className={cn('text-3xl font-bold', colors.text)}>{l.avg_grade}<span className="text-base text-slate-400">/100</span></div>
                  <p className="text-xs text-slate-400 mt-1">{l.graded_count} تقييم</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My overall standing */}
      {myAvg !== null && (
        <div className="card border-brand-500/30 bg-brand-500/5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">تقييمي العام</p>
                <p className="text-2xl font-bold text-white">{myAvg}<span className="text-sm text-slate-400">/100</span></p>
              </div>
            </div>
            <p className="text-sm text-slate-400">من {assignments.filter((a) => a.grade !== null).length} مهمة مقيّمة</p>
          </div>
        </div>
      )}

      {/* Assignments list */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-purple-400" /> المهام (Assignments)
        </h3>

        {assignments.length === 0 ? (
          <div className="card text-center py-10 text-slate-400">لا توجد مهام بعد</div>
        ) : (
          <div className="space-y-3">
            {assignments.map((a) => {
              const submitted = !!a.submission_id;
              const graded = a.grade !== null;
              return (
                <div key={a.id} className={cn('card transition-all',
                  graded ? 'border-green-500/30 bg-green-500/5' :
                  submitted ? 'border-blue-500/30 bg-blue-500/5' : ''
                )}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <ClipboardList className="w-4 h-4 text-purple-400 flex-shrink-0" />
                        <h4 className="font-semibold text-white">{a.title}</h4>
                      </div>
                      <p className="text-xs text-slate-500">{a.section_title} · {a.lesson_title}</p>
                      {a.description && <p className="text-sm text-slate-300 mt-2">{a.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {graded ? (
                        <div className="bg-green-500/20 text-green-400 px-3 py-1.5 rounded-lg font-bold text-lg border border-green-500/30">
                          {a.grade}/100
                        </div>
                      ) : submitted ? (
                        <span className="badge badge-blue"><Check className="w-3 h-3" /> تم التسليم</span>
                      ) : (
                        <span className="text-xs text-slate-400">{a.due_days} يوم</span>
                      )}
                    </div>
                  </div>

                  {/* Feedback */}
                  {a.feedback && (
                    <div className="bg-dark-700/50 border border-dark-600 rounded-lg p-3 my-3 text-sm text-slate-300">
                      <p className="text-xs text-slate-400 mb-1">📝 ملاحظات المدرس:</p>
                      {a.feedback}
                    </div>
                  )}

                  {/* Submission area */}
                  {!graded && (
                    <div className="mt-3 pt-3 border-t border-dark-700 space-y-2">
                      <textarea
                        value={notesById[a.id] || ''}
                        onChange={(e) => setNotesById((p) => ({ ...p, [a.id]: e.target.value }))}
                        placeholder={submitted ? 'تعديل الملاحظات...' : 'ملاحظات (اختياري)...'}
                        rows={2}
                        className="input text-sm resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <input
                          ref={(el) => { fileInputs.current[a.id] = el; }}
                          type="file"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) submit(a.id, f);
                            e.target.value = '';
                          }}
                        />
                        <button
                          onClick={() => fileInputs.current[a.id]?.click()}
                          disabled={submittingId === a.id}
                          className="btn-primary flex items-center gap-2 text-sm">
                          {submittingId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          {submitted ? 'استبدل الملف' : 'رفع ملف التسليم'}
                        </button>
                        {submitted && (
                          <button onClick={() => submit(a.id, null)}
                            disabled={submittingId === a.id}
                            className="btn-secondary text-sm">
                            حفظ الملاحظات بس
                          </button>
                        )}
                        {submitted && a.submission_file && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> ملف مرفوع
                          </span>
                        )}
                      </div>
                      {a.submitted_at && (
                        <p className="text-xs text-slate-500">
                          آخر تسليم: {format(new Date(a.submitted_at), 'MMM d, HH:mm')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
