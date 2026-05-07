'use client';
import { useEffect, useState } from 'react';
import { Plus, Users, Calendar, Trash2, Edit2, X, UserPlus, Search, Video, MessageSquare, Loader2, Check, Radio, ExternalLink, ClipboardList } from 'lucide-react';
import BatchSubmissions from './BatchSubmissions';
import AttendanceModal from './AttendanceModal';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Batch {
  id: string; course_id: string; name: string; description: string;
  start_date: string | null; end_date: string | null; is_active: boolean;
  student_count: number;
  live_url?: string | null;
  next_session_at?: string | null;
  total_sessions?: number;
}

interface BatchStudent {
  enrollment_id: string; id: string; name: string; email: string;
  is_active: boolean; enrolled_at: string; progress_pct: number;
}

interface UserOption { id: string; name: string; email: string; }

interface Recording {
  id: string; title: string; recording_url: string; video_key: string;
  duration_minutes: number; recorded_at: string; created_at: string;
}

export default function BatchesManager({ courseId }: { courseId: string }) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBatch, setActiveBatch] = useState<Batch | null>(null);

  // Create batch form
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', start_date: '', end_date: '' });
  const [creating, setCreating] = useState(false);

  const loadBatches = () => {
    setLoading(true);
    api.get(`/batches/course/${courseId}`).then(({ data }) => setBatches(data)).finally(() => setLoading(false));
  };
  useEffect(() => { loadBatches(); }, [courseId]);

  const createBatch = async () => {
    if (!form.name.trim()) { toast.error('اسم الدفعة مطلوب'); return; }
    setCreating(true);
    try {
      await api.post('/batches', { course_id: courseId, ...form });
      toast.success('تم إنشاء الدفعة');
      setShowCreate(false);
      setForm({ name: '', description: '', start_date: '', end_date: '' });
      loadBatches();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'فشل الإنشاء');
    } finally { setCreating(false); }
  };

  const deleteBatch = async (id: string) => {
    if (!confirm('حذف الدفعة وكل تسجيلاتها وشاتها؟')) return;
    try {
      await api.delete(`/batches/${id}`);
      toast.success('تم الحذف');
      if (activeBatch?.id === id) setActiveBatch(null);
      loadBatches();
    } catch { toast.error('فشل الحذف'); }
  };

  if (activeBatch) {
    return <BatchDetail batch={activeBatch} onBack={() => { setActiveBatch(null); loadBatches(); }} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">دفعات الكورس (Groups)</h3>
          <p className="text-slate-400 text-sm">كل دفعة ليها طلابها وتسجيلاتها وشاتها الخاص</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> دفعة جديدة
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card border-brand-500/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-white">دفعة جديدة</h4>
            <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-300 mb-1">اسم الدفعة *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="مثلاً: دفعة مايو 2026" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm text-slate-300 mb-1">وصف (اختياري)</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" placeholder="ملاحظات..." />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">تاريخ البداية</label>
              <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">تاريخ النهاية</label>
              <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="input" />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button onClick={createBatch} disabled={creating} className="btn-primary flex items-center gap-2">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                إنشاء
              </button>
              <button onClick={() => setShowCreate(false)} className="btn-secondary">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Batches list */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /></div>
      ) : batches.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">لا توجد دفعات بعد. اضغط "دفعة جديدة" للبدء.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((b) => (
            <div key={b.id} className="card hover:border-brand-500/40 transition-all cursor-pointer" onClick={() => setActiveBatch(b)}>
              <div className="flex items-start justify-between mb-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', b.is_active ? 'bg-green-500/15' : 'bg-slate-500/15')}>
                  <Users className={cn('w-5 h-5', b.is_active ? 'text-green-400' : 'text-slate-400')} />
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteBatch(b.id); }} className="text-slate-500 hover:text-red-400 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h4 className="font-semibold text-white mb-1">{b.name}</h4>
              {b.description && <p className="text-slate-400 text-xs mb-2 line-clamp-2">{b.description}</p>}
              <div className="space-y-1.5 text-xs text-slate-400 mt-3 pt-3 border-t border-dark-700">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3 h-3" />
                  <span>{b.student_count} طالب</span>
                </div>
                {b.start_date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(b.start_date), 'MMM d, yyyy')}{b.end_date && ` → ${format(new Date(b.end_date), 'MMM d, yyyy')}`}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Single Batch Detail (students + recordings) ──────────────────
function BatchDetail({ batch: initialBatch, onBack }: { batch: Batch; onBack: () => void }) {
  const [batch, setBatch] = useState(initialBatch);
  const [innerTab, setInnerTab] = useState<'live' | 'students' | 'recordings' | 'submissions'>('live');
  const [attendanceFor, setAttendanceFor] = useState<{ id: string; title: string } | null>(null);
  const [liveForm, setLiveForm] = useState({
    live_url: initialBatch.live_url || '',
    next_session_at: initialBatch.next_session_at ? initialBatch.next_session_at.slice(0, 16) : '',
    total_sessions: initialBatch.total_sessions ?? 12,
  });
  const [savingLive, setSavingLive] = useState(false);
  const [notifying, setNotifying] = useState(false);

  const saveLive = async () => {
    setSavingLive(true);
    try {
      const { data } = await api.patch(`/batches/${batch.id}`, {
        live_url: liveForm.live_url || null,
        next_session_at: liveForm.next_session_at || null,
        total_sessions: Number(liveForm.total_sessions) || 12,
      });
      setBatch({ ...batch, ...data });
      toast.success('تم الحفظ');
    } catch { toast.error('فشل الحفظ'); }
    finally { setSavingLive(false); }
  };

  const notifyStudents = async () => {
    if (!batch.live_url) { toast.error('احفظ رابط Live الأول'); return; }
    if (!confirm('إرسال إيميل لكل طلاب الدفعة بأن الجلسة بدأت؟')) return;
    setNotifying(true);
    try {
      const { data } = await api.post(`/batches/${batch.id}/notify`);
      toast.success(`📧 تم إرسال ${data.recipients} إيميل`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'فشل الإرسال');
    } finally { setNotifying(false); }
  };
  const [students, setStudents] = useState<BatchStudent[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserOption[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recForm, setRecForm] = useState({ title: '', recording_url: '', recorded_at: '' });
  const [showRecForm, setShowRecForm] = useState(false);

  const loadStudents = () => {
    api.get(`/batches/${batch.id}/students`).then(({ data }) => setStudents(data));
  };
  const loadRecordings = () => {
    api.get(`/batches/${batch.id}/recordings`).then(({ data }) => setRecordings(data));
  };

  useEffect(() => {
    loadStudents();
    loadRecordings();
  }, [batch.id]);

  useEffect(() => {
    if (search.length < 2) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      api.get('/admin/students', { params: { search } }).then(({ data }) => setSearchResults(data));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const enrollStudent = async (userId: string) => {
    try {
      await api.post(`/batches/${batch.id}/enroll`, { user_id: userId });
      toast.success('تم الإضافة');
      setSearch(''); setSearchResults([]); setShowAdd(false);
      loadStudents();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'فشل');
    }
  };

  const removeStudent = async (userId: string) => {
    if (!confirm('إزالة الطالب من الدفعة؟')) return;
    try {
      await api.delete(`/batches/${batch.id}/students/${userId}`);
      toast.success('تم الإزالة');
      loadStudents();
    } catch { toast.error('فشل'); }
  };

  const addRecording = async () => {
    if (!recForm.title || !recForm.recording_url) { toast.error('العنوان ورابط التسجيل مطلوبين'); return; }
    try {
      await api.post(`/batches/${batch.id}/recordings`, recForm);
      toast.success('تم الإضافة');
      setRecForm({ title: '', recording_url: '', recorded_at: '' });
      setShowRecForm(false);
      loadRecordings();
    } catch { toast.error('فشل الإضافة'); }
  };

  const deleteRecording = async (recId: string) => {
    if (!confirm('حذف التسجيل؟')) return;
    try {
      await api.delete(`/batches/${batch.id}/recordings/${recId}`);
      loadRecordings();
    } catch { toast.error('فشل'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-slate-400 hover:text-white text-sm">← رجوع للدفعات</button>
        <span className="text-slate-600">/</span>
        <h3 className="text-lg font-bold text-white">{batch.name}</h3>
      </div>

      {/* Inner tabs */}
      <div className="flex gap-1 bg-dark-800 border border-dark-700 rounded-xl p-1 w-fit">
        {([
          { key: 'live', label: '🔴 جلسة Live', count: batch.live_url ? 1 : 0 },
          { key: 'students', label: '👥 الطلاب', count: students.length },
          { key: 'recordings', label: '🎬 التسجيلات', count: recordings.length },
          { key: 'submissions', label: '📝 المهام والتقييم', count: 0 },
        ] as const).map(({ key, label, count }) => (
          <button key={key} onClick={() => setInnerTab(key)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all',
              innerTab === key ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
            )}>
            {label} <span className="opacity-70">({count})</span>
          </button>
        ))}
      </div>

      {/* Live tab */}
      {innerTab === 'live' && (
        <div className="card space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center flex-shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-white">رابط جلسة Live</h4>
              <p className="text-slate-400 text-sm">حط رابط Zoom/Meet/Teams هنا. الطلاب هيلاقوا زرار "انضم للايف الآن" في dashboardهم.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">رابط Zoom / Meet / Teams</label>
            <input
              value={liveForm.live_url}
              onChange={(e) => setLiveForm({ ...liveForm, live_url: e.target.value })}
              placeholder="https://us05web.zoom.us/j/..."
              className="input"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">موعد الجلسة الجاية</label>
              <input
                type="datetime-local"
                value={liveForm.next_session_at}
                onChange={(e) => setLiveForm({ ...liveForm, next_session_at: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">إجمالي عدد المحاضرات</label>
              <input
                type="number" min={1} max={100}
                value={liveForm.total_sessions}
                onChange={(e) => setLiveForm({ ...liveForm, total_sessions: Number(e.target.value) })}
                className="input"
              />
              <p className="text-xs text-slate-500 mt-1">مثلاً: 12 محاضرة طول الكورس</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={saveLive} disabled={savingLive} className="btn-primary flex items-center gap-2">
              {savingLive ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              حفظ
            </button>
            {batch.live_url && (
              <>
                <a href={batch.live_url} target="_blank" rel="noreferrer" className="btn-secondary flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" /> فتح Zoom
                </a>
                <button onClick={notifyStudents} disabled={notifying}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  {notifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
                  📢 ابعت إيميل للطلاب إن الجلسة بدأت
                </button>
              </>
            )}
          </div>

          {batch.live_url && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-sm text-green-300">
              ✅ الرابط محفوظ. الطلاب يقدروا يدخلوا اللايف من dashboardهم.
            </div>
          )}
        </div>
      )}

      {/* Students tab */}
      {innerTab === 'students' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowAdd(!showAdd)} className="btn-primary flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> إضافة طالب
            </button>
          </div>

          {showAdd && (
            <div className="card border-brand-500/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث بالاسم أو الإيميل..."
                  className="input pl-10"
                  autoFocus
                />
              </div>
              {searchResults.length > 0 && (
                <div className="mt-3 max-h-64 overflow-y-auto space-y-1">
                  {searchResults.map((u) => (
                    <button key={u.id} onClick={() => enrollStudent(u.id)}
                      className="w-full text-left p-3 rounded-lg bg-dark-700/50 hover:bg-dark-700 transition-colors flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-sm font-semibold">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                      <Plus className="w-4 h-4 text-brand-400" />
                    </button>
                  ))}
                </div>
              )}
              {search.length >= 2 && searchResults.length === 0 && (
                <p className="text-slate-400 text-sm mt-3">لا يوجد نتائج. جرب تعمل اكونت جديد من صفحة Users.</p>
              )}
            </div>
          )}

          {students.length === 0 ? (
            <div className="card text-center py-10 text-slate-400">لا يوجد طلاب في هذه الدفعة بعد</div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-dark-700/40 text-slate-400">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">الطالب</th>
                    <th className="text-left px-4 py-3 font-medium">التقدم</th>
                    <th className="text-left px-4 py-3 font-medium">تاريخ التسجيل</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700">
                  {students.map((s) => (
                    <tr key={s.id} className={cn('hover:bg-dark-700/30', !s.is_active && 'opacity-40')}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.email}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{s.progress_pct}%</td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{format(new Date(s.enrolled_at), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => removeStudent(s.id)} className="text-slate-400 hover:text-red-400 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Recordings tab */}
      {innerTab === 'recordings' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowRecForm(!showRecForm)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> إضافة تسجيل
            </button>
          </div>

          {showRecForm && (
            <div className="card border-brand-500/30 space-y-3">
              <input value={recForm.title} onChange={(e) => setRecForm({ ...recForm, title: e.target.value })} placeholder="عنوان المحاضرة" className="input" />
              <input value={recForm.recording_url} onChange={(e) => setRecForm({ ...recForm, recording_url: e.target.value })} placeholder="رابط التسجيل (Zoom / Drive / YouTube unlisted ...)" className="input" />
              <input type="datetime-local" value={recForm.recorded_at} onChange={(e) => setRecForm({ ...recForm, recorded_at: e.target.value })} className="input" />
              <div className="flex gap-2">
                <button onClick={addRecording} className="btn-primary">حفظ</button>
                <button onClick={() => setShowRecForm(false)} className="btn-secondary">إلغاء</button>
              </div>
            </div>
          )}

          {recordings.length === 0 ? (
            <div className="card text-center py-10 text-slate-400">لا يوجد تسجيلات بعد</div>
          ) : (
            <div className="space-y-2">
              {recordings.map((r) => (
                <div key={r.id} className="card flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500/15 text-purple-400 rounded-lg flex items-center justify-center">
                    <Video className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{r.title}</p>
                    <a href={r.recording_url} target="_blank" rel="noreferrer" className="text-xs text-brand-400 hover:underline truncate block">{r.recording_url}</a>
                  </div>
                  {r.recorded_at && <span className="text-xs text-slate-400">{format(new Date(r.recorded_at), 'MMM d')}</span>}
                  <button
                    onClick={() => setAttendanceFor({ id: r.id, title: r.title })}
                    title="تسجيل الحضور"
                    className="text-slate-400 hover:text-green-400 p-1.5 rounded-lg hover:bg-green-500/10">
                    <UserPlus className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteRecording(r.id)} className="text-slate-400 hover:text-red-400 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submissions tab */}
      {innerTab === 'submissions' && <BatchSubmissions batchId={batch.id} />}

      {/* Attendance modal */}
      {attendanceFor && (
        <AttendanceModal
          batchId={batch.id}
          recording={attendanceFor}
          onClose={() => setAttendanceFor(null)}
        />
      )}
    </div>
  );
}
