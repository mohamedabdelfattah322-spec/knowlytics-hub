'use client';
import { useEffect, useState } from 'react';
import { Loader2, FileText, Star, Save, Download, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Student { id: string; name: string; email: string; }
interface Assignment { id: string; title: string; }
interface Submission {
  id: string; assignment_id: string; user_id: string;
  file_key: string | null; notes: string | null;
  grade: number | null; feedback: string | null;
  submitted_at: string;
}

interface OverviewData {
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
}

interface LeaderRow {
  id: string; name: string;
  avg_grade: number | null;
  graded_count: number;
  total_submitted: number;
}

export default function BatchSubmissions({ batchId }: { batchId: string }) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [leaders, setLeaders] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editGrade, setEditGrade] = useState('');
  const [editFeedback, setEditFeedback] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [o, l] = await Promise.all([
        api.get(`/batches/${batchId}/submissions-overview`),
        api.get(`/batches/${batchId}/leaderboard`),
      ]);
      setData(o.data);
      setLeaders(l.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [batchId]);

  const startEdit = (sub: Submission) => {
    setEditing(sub.id);
    setEditGrade(sub.grade !== null ? String(sub.grade) : '');
    setEditFeedback(sub.feedback || '');
  };

  const saveGrade = async () => {
    if (!editing) return;
    try {
      await api.patch(`/assignments/submissions/${editing}/grade`, {
        grade: editGrade ? Number(editGrade) : null,
        feedback: editFeedback || null,
      });
      toast.success('تم حفظ التقييم');
      setEditing(null);
      await load();
    } catch { toast.error('فشل الحفظ'); }
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>;
  if (!data) return null;

  const { students, assignments, submissions } = data;

  // Helper: find submission for student × assignment
  const getSub = (uid: string, aid: string) =>
    submissions.find((s) => s.user_id === uid && s.assignment_id === aid) || null;

  return (
    <div className="space-y-6">
      {/* Top 3 leaderboard */}
      <div className="card">
        <h3 className="font-bold text-white mb-3 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-400" /> Top 3 الأوائل
        </h3>
        {leaders.filter((l) => l.avg_grade !== null).length === 0 ? (
          <p className="text-slate-400 text-sm">قيّم بعض المهام عشان يظهر الترتيب</p>
        ) : (
          <div className="grid sm:grid-cols-3 gap-3">
            {leaders.filter((l) => l.avg_grade !== null).slice(0, 3).map((l, i) => {
              const icons = ['🥇', '🥈', '🥉'];
              return (
                <div key={l.id} className="bg-dark-700/50 border border-dark-600 rounded-lg p-3 flex items-center gap-3">
                  <span className="text-2xl">{icons[i]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{l.name}</p>
                    <p className="text-xs text-slate-400">{l.graded_count} تقييم</p>
                  </div>
                  <span className="text-yellow-400 font-bold">{l.avg_grade}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submissions matrix */}
      {students.length === 0 ? (
        <div className="card text-center py-10 text-slate-400">لا يوجد طلاب في الدفعة</div>
      ) : assignments.length === 0 ? (
        <div className="card text-center py-10 text-slate-400">لا توجد مهام في الكورس بعد</div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-700/40">
              <tr className="text-slate-400">
                <th className="text-right px-4 py-3 sticky left-0 bg-dark-700/40">الطالب</th>
                {assignments.map((a) => (
                  <th key={a.id} className="text-center px-3 py-3 font-medium min-w-32">{a.title}</th>
                ))}
                <th className="text-center px-3 py-3 font-bold text-yellow-400">المتوسط</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {students.map((s) => {
                const myLeader = leaders.find((l) => l.id === s.id);
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-3 sticky left-0 bg-dark-800">
                      <p className="font-medium text-white">{s.name}</p>
                      <p className="text-xs text-slate-500">{s.email}</p>
                    </td>
                    {assignments.map((a) => {
                      const sub = getSub(s.id, a.id);
                      const isEditing = editing === sub?.id;
                      return (
                        <td key={a.id} className="px-3 py-3 text-center">
                          {!sub ? (
                            <span className="text-xs text-slate-600">— لم يسلم —</span>
                          ) : isEditing ? (
                            <div className="space-y-1.5 min-w-32">
                              <input
                                type="number" min={0} max={100}
                                value={editGrade}
                                onChange={(e) => setEditGrade(e.target.value)}
                                placeholder="0-100"
                                className="input text-sm py-1 text-center"
                                autoFocus
                              />
                              <textarea
                                value={editFeedback}
                                onChange={(e) => setEditFeedback(e.target.value)}
                                placeholder="ملاحظات..."
                                rows={2}
                                className="input text-xs py-1 resize-none"
                              />
                              <div className="flex gap-1">
                                <button onClick={saveGrade} className="btn-primary text-xs px-2 py-1 flex items-center gap-1 flex-1">
                                  <Save className="w-3 h-3" /> حفظ
                                </button>
                                <button onClick={() => setEditing(null)} className="btn-secondary text-xs px-2 py-1">×</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => startEdit(sub)} className="space-y-1 hover:bg-dark-700/50 rounded p-1">
                              {sub.grade !== null ? (
                                <div className={cn('text-lg font-bold',
                                  sub.grade >= 80 ? 'text-green-400' :
                                  sub.grade >= 60 ? 'text-yellow-400' : 'text-red-400'
                                )}>{sub.grade}</div>
                              ) : (
                                <div className="text-xs text-blue-400">⏳ يحتاج تقييم</div>
                              )}
                              {sub.file_key && (
                                <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
                                  <FileText className="w-3 h-3" /> ملف
                                </div>
                              )}
                            </button>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-3 py-3 text-center">
                      {myLeader?.avg_grade !== null ? (
                        <span className="text-yellow-400 font-bold text-lg">{myLeader?.avg_grade}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
