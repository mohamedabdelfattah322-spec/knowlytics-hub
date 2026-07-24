'use client';
import { useEffect, useState } from 'react';
import {
  ClipboardList, ChevronDown, ChevronRight, Download, CheckCircle,
  Clock, AlertCircle, X, Save, Loader2, BookOpen, User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Assignment {
  id: string; title: string; description: string; due_days: number;
  lesson_title: string; course_id: string; course_title: string;
  submission_count: number; graded_count: number; pending_count: number;
  created_at: string;
}

interface Submission {
  id: string; user_id: string; student_name: string; email: string;
  file_key: string | null; notes: string | null;
  grade: number | null; feedback: string | null;
  submitted_at: string;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Record<string, Submission[]>>({});
  const [subLoading, setSubLoading] = useState<string | null>(null);
  const [grading, setGrading] = useState<Record<string, { grade: string; feedback: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [filterCourse, setFilterCourse] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'graded'>('all');

  useEffect(() => {
    api.get('/assignments/admin/all')
      .then(({ data }) => setAssignments(data))
      .catch(() => toast.error('فشل تحميل التاسكات'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (id: string) => {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (submissions[id]) return;
    setSubLoading(id);
    try {
      const { data } = await api.get(`/assignments/${id}/submissions`);
      setSubmissions(p => ({ ...p, [id]: data }));
      const init: Record<string, { grade: string; feedback: string }> = {};
      data.forEach((s: Submission) => {
        init[s.id] = { grade: s.grade !== null ? String(s.grade) : '', feedback: s.feedback || '' };
      });
      setGrading(p => ({ ...p, ...init }));
    } catch { toast.error('فشل تحميل التسليمات'); }
    finally { setSubLoading(null); }
  };

  const saveGrade = async (submissionId: string, assignmentId: string) => {
    const g = grading[submissionId];
    if (!g?.grade) { toast.error('أدخل الدرجة أولاً'); return; }
    const gradeNum = parseInt(g.grade);
    if (isNaN(gradeNum) || gradeNum < 0 || gradeNum > 100) { toast.error('الدرجة من 0 إلى 100'); return; }
    setSaving(submissionId);
    try {
      const { data } = await api.patch(`/assignments/submissions/${submissionId}/grade`, {
        grade: gradeNum, feedback: g.feedback || null,
      });
      setSubmissions(p => ({
        ...p,
        [assignmentId]: p[assignmentId].map(s => s.id === submissionId ? { ...s, grade: data.grade, feedback: data.feedback } : s),
      }));
      setAssignments(p => p.map(a => {
        if (a.id !== assignmentId) return a;
        const wasUngraded = submissions[assignmentId]?.find(s => s.id === submissionId)?.grade === null;
        return { ...a, graded_count: a.graded_count + (wasUngraded ? 1 : 0), pending_count: Math.max(0, a.pending_count - (wasUngraded ? 1 : 0)) };
      }));
      toast.success('✅ تم حفظ التقييم');
    } catch { toast.error('فشل الحفظ'); }
    finally { setSaving(null); }
  };

  const courses = [...new Set(assignments.map(a => a.course_title))].sort();

  const filtered = assignments.filter(a => {
    if (filterCourse && a.course_title !== filterCourse) return false;
    if (filterStatus === 'pending') return a.pending_count > 0;
    if (filterStatus === 'graded') return a.pending_count === 0 && a.submission_count > 0;
    return true;
  });

  const totalPending = assignments.reduce((s, a) => s + a.pending_count, 0);
  const totalSubmissions = assignments.reduce((s, a) => s + a.submission_count, 0);
  const totalGraded = assignments.reduce((s, a) => s + a.graded_count, 0);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-brand-400" /> التاسكات والتقييمات
        </h1>
        <p className="text-slate-400 text-sm mt-1">راجع تسليمات الطلاب وأضف تقييمك ودرجاتهم</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-white">{totalSubmissions}</p>
          <p className="text-xs text-slate-400 mt-1">إجمالي التسليمات</p>
        </div>
        <div className="card text-center border-amber-500/30">
          <p className="text-3xl font-bold text-amber-400">{totalPending}</p>
          <p className="text-xs text-slate-400 mt-1">في انتظار التقييم</p>
        </div>
        <div className="card text-center border-green-500/30">
          <p className="text-3xl font-bold text-green-400">{totalGraded}</p>
          <p className="text-xs text-slate-400 mt-1">تم تقييمها</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} className="input w-auto">
          <option value="">كل الكورسات</option>
          {courses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="flex gap-1 bg-dark-800 border border-dark-700 rounded-lg p-1">
          {(['all', 'pending', 'graded'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                filterStatus === s ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white')}>
              {s === 'all' ? 'الكل' : s === 'pending' ? '⏳ لم تُقيَّم' : '✅ مُقيَّمة'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <ClipboardList className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">لا توجد تاسكات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <div key={a.id} className={cn('card transition-all', a.pending_count > 0 && 'border-amber-500/20')}>
              {/* Assignment header */}
              <button onClick={() => toggle(a.id)} className="w-full flex items-center gap-3 text-right">
                <div className={cn('p-2 rounded-lg shrink-0',
                  a.pending_count > 0 ? 'bg-amber-500/20' : a.submission_count > 0 ? 'bg-green-500/20' : 'bg-dark-700')}>
                  <ClipboardList className={cn('w-4 h-4',
                    a.pending_count > 0 ? 'text-amber-400' : a.submission_count > 0 ? 'text-green-400' : 'text-slate-500')} />
                </div>
                <div className="flex-1 min-w-0 text-right">
                  <p className="font-semibold text-white">{a.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {a.course_title}
                    </span>
                    <span className="text-xs text-slate-600">·</span>
                    <span className="text-xs text-slate-500">{a.lesson_title}</span>
                    <span className="text-xs text-slate-600">·</span>
                    <span className="text-xs text-slate-500">⏱ {a.due_days} يوم</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {a.pending_count > 0 && (
                    <span className="flex items-center gap-1 text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">
                      <Clock className="w-3 h-3" /> {a.pending_count} جديد
                    </span>
                  )}
                  <span className="text-xs text-slate-400">{a.submission_count} تسليم</span>
                  {expanded === a.id
                    ? <ChevronDown className="w-4 h-4 text-slate-400" />
                    : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {/* Submissions */}
              {expanded === a.id && (
                <div className="mt-4 pt-4 border-t border-dark-700 space-y-4">
                  {subLoading === a.id ? (
                    <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 text-brand-400 animate-spin" /></div>
                  ) : (submissions[a.id] || []).length === 0 ? (
                    <p className="text-center text-slate-500 py-4 text-sm">لا يوجد تسليمات بعد</p>
                  ) : (
                    (submissions[a.id] || []).map(s => {
                      const isGraded = s.grade !== null && s.grade !== undefined;
                      const g = grading[s.id] || { grade: '', feedback: '' };
                      const fileUrl = s.file_key ? `${API_BASE}/uploads/${s.file_key}` : null;
                      return (
                        <div key={s.id} className={cn(
                          'rounded-xl border p-4 space-y-3',
                          isGraded ? 'border-green-500/25 bg-green-500/5' : 'border-dark-600 bg-dark-800/50'
                        )}>
                          {/* Student info */}
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm shrink-0">
                              {s.student_name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white text-sm">{s.student_name}</p>
                              <p className="text-xs text-slate-500">{s.email}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {isGraded
                                ? <span className="flex items-center gap-1 text-sm font-bold text-green-400 bg-green-500/20 px-3 py-1 rounded-full">
                                    <CheckCircle className="w-3.5 h-3.5" /> {s.grade}/100
                                  </span>
                                : <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/15 px-2 py-1 rounded-full">
                                    <Clock className="w-3 h-3" /> لم يُقيَّم
                                  </span>
                              }
                            </div>
                          </div>

                          {/* Notes from student */}
                          {s.notes && (
                            <div className="bg-dark-700/60 rounded-lg px-3 py-2">
                              <p className="text-xs text-slate-400 mb-1">ملاحظات الطالب:</p>
                              <p className="text-sm text-slate-300">{s.notes}</p>
                            </div>
                          )}

                          {/* File + submission date */}
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>{new Date(s.submitted_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            {fileUrl && (
                              <a href={fileUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-brand-400 hover:text-brand-300 transition-colors font-medium">
                                <Download className="w-3.5 h-3.5" /> تحميل الملف
                              </a>
                            )}
                            {!s.file_key && <span className="text-slate-600 italic">بدون ملف</span>}
                          </div>

                          {/* Existing feedback */}
                          {s.feedback && (
                            <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg px-3 py-2">
                              <p className="text-xs text-brand-400 mb-1">تقييمك السابق:</p>
                              <p className="text-sm text-slate-300">{s.feedback}</p>
                            </div>
                          )}

                          {/* Grade form */}
                          <div className="space-y-2 pt-2 border-t border-dark-700">
                            <p className="text-xs text-slate-400 font-medium">
                              {isGraded ? 'تعديل التقييم' : 'إضافة تقييم'}
                            </p>
                            <div className="flex gap-2">
                              <div className="relative">
                                <input type="number" min={0} max={100}
                                  value={g.grade}
                                  onChange={e => setGrading(p => ({ ...p, [s.id]: { ...g, grade: e.target.value } }))}
                                  placeholder="الدرجة"
                                  className="input w-24 text-center font-bold text-lg"
                                />
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-xs">/100</span>
                              </div>
                              <textarea
                                value={g.feedback}
                                onChange={e => setGrading(p => ({ ...p, [s.id]: { ...g, feedback: e.target.value } }))}
                                placeholder="اكتب ملاحظاتك وتقييمك للطالب (اختياري)..."
                                rows={2}
                                className="input flex-1 resize-none text-sm"
                              />
                              <button onClick={() => saveGrade(s.id, a.id)}
                                disabled={saving === s.id}
                                className="btn-primary flex items-center gap-2 self-end px-4 whitespace-nowrap">
                                {saving === s.id
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <Save className="w-4 h-4" />}
                                {saving === s.id ? 'جارِ الحفظ...' : 'حفظ التقييم'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
