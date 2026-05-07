'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Trash2, Video, FileText, HelpCircle,
  Save, Loader2, Upload, ChevronDown, ChevronUp,
  Lock, Unlock, ClipboardList, CheckCircle, DollarSign,
  Eye, Image as ImageIcon, Paperclip, X, Users, UserPlus,
  Search, BadgeCheck, Ban,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';
import BatchesManager from '@/components/admin/BatchesManager';

/* ─── Types ────────────────────────────────────────────── */
interface Lesson {
  id: string; title: string; type: string;
  duration_minutes: number; order_index: number;
  is_preview: boolean; video_key: string | null; video_url: string | null;
}
interface Section { id: string; title: string; order_index: number; lessons: Lesson[]; }
interface Course {
  id: string; title: string; description: string; type: string;
  level: string; price: number; duration_hours: number; is_published: boolean;
}
interface CourseFile { id: string; name: string; file_type: string; file_size: number; lesson_id: string | null; }
interface Assignment { id: string; lesson_id: string; title: string; description: string; due_days: number; submission_count: string; }
interface Enrollment { id: string; user_id: string; name: string; email: string; enrolled_at: string; progress_pct: number; is_active: boolean; payment_ref: string | null; }
interface Student { id: string; name: string; email: string; }

/* ─── Helpers ───────────────────────────────────────────── */
const fmtSize = (bytes: number) => bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
const lessonTypeIcon: Record<string, React.ElementType> = {
  video: Video, text: FileText, quiz: HelpCircle, assignment: ClipboardList, zoom: Video,
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════ */
export default function AdminCourseEditorPage() {
  const { id } = useParams();

  const [course, setCourse]       = useState<Course | null>(null);
  const [sections, setSections]   = useState<Section[]>([]);
  const [files, setFiles]         = useState<CourseFile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [expanded, setExpanded]   = useState<Record<string, boolean>>({});
  const [saving, setSaving]       = useState(false);
  const [loading, setLoading]     = useState(true);

  // New-section form
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [addingSection, setAddingSection]     = useState(false);

  // New-lesson form per section
  const [newLesson, setNewLesson] = useState<Record<string, { title: string; type: string; duration: string }>>({});

  // Upload state per lesson
  const [uploadingVideo, setUploadingVideo] = useState<Record<string, boolean>>({});
  const [uploadingFile, setUploadingFile]   = useState(false);

  // Assignment form per lesson
  const [newAssignment, setNewAssignment] = useState<Record<string, { title: string; description: string; due_days: string }>>({});

  // Students / enrollment tab
  const [enrollments, setEnrollments]   = useState<Enrollment[]>([]);
  const [students, setStudents]         = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [paymentRef, setPaymentRef]     = useState('');
  const [enrolling, setEnrolling]       = useState(false);

  // Active tab
  const [tab, setTab] = useState<'curriculum' | 'files' | 'students' | 'batches' | 'settings'>('curriculum');

  /* ── Load data ── */
  useEffect(() => {
    Promise.all([
      api.get(`/courses/${id}`),
      api.get(`/courses/${id}/analytics`),
      api.get(`/files/course/${id}`),
    ]).then(([cRes, aRes, fRes]) => {
      setCourse(cRes.data.course);
      const secs: Section[] = cRes.data.sections || [];
      setSections(secs);
      setAnalytics(aRes.data);
      setFiles(fRes.data);
      if (secs.length) setExpanded({ [secs[0].id]: true });
    }).catch(() => toast.error('فشل تحميل بيانات الكورس'))
      .finally(() => setLoading(false));
  }, [id]);

  // Load enrollments when students tab is active
  useEffect(() => {
    if (tab === 'students' && id) {
      api.get(`/enrollments/course/${id}`)
        .then(({ data }) => setEnrollments(data))
        .catch(() => {});
    }
  }, [tab, id]);

  // Search students for enrollment
  useEffect(() => {
    const t = setTimeout(() => {
      api.get('/admin/students', { params: { search: studentSearch } })
        .then(({ data }) => setStudents(data))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [studentSearch]);

  // Load assignments whenever sections change
  useEffect(() => {
    const lessonIds = sections.flatMap((s) => (s.lessons ?? []).map((l) => l.id));
    if (!lessonIds.length) return;
    Promise.all(lessonIds.map((lid) => api.get(`/assignments/lesson/${lid}`)))
      .then((results) => {
        const all = results.flatMap((r) => r.data);
        setAssignments(all);
      }).catch(() => {});
  }, [sections]);

  /* ── Save course details ── */
  const saveCourse = async () => {
    if (!course) return;
    setSaving(true);
    try {
      await api.put(`/courses/${id}`, {
        title: course.title, description: course.description, type: course.type,
        level: course.level, price: course.price, duration_hours: course.duration_hours,
        is_published: course.is_published,
      });
      toast.success('✅ تم حفظ الكورس');
    } catch { toast.error('فشل الحفظ'); }
    finally { setSaving(false); }
  };

  /* ── Section CRUD ── */
  const addSection = async () => {
    if (!newSectionTitle.trim()) return;
    setAddingSection(true);
    try {
      const { data } = await api.post('/admin/sections', {
        course_id: id, title: newSectionTitle, order_index: sections.length,
      });
      setSections((p) => [...p, { ...data, lessons: [] }]);
      setNewSectionTitle('');
      toast.success('تم إضافة القسم');
    } catch { toast.error('فشل إضافة القسم'); }
    finally { setAddingSection(false); }
  };

  const deleteSection = async (sectionId: string) => {
    if (!confirm('حذف هذا القسم وكل دروسه؟')) return;
    try {
      await api.delete(`/admin/sections/${sectionId}`);
      setSections((p) => p.filter((s) => s.id !== sectionId));
      toast.success('تم حذف القسم');
    } catch { toast.error('فشل حذف القسم'); }
  };

  /* ── Lesson CRUD ── */
  const addLesson = async (sectionId: string) => {
    const form = newLesson[sectionId];
    if (!form?.title?.trim()) return;
    try {
      const section = sections.find((s) => s.id === sectionId)!;
      const { data } = await api.post('/lessons', {
        section_id: sectionId, title: form.title,
        type: form.type || 'video',
        duration_minutes: parseInt(form.duration) || 0,
        order_index: (section.lessons?.length ?? 0),
        is_preview: false,
      });
      setSections((p) => p.map((s) => s.id === sectionId ? { ...s, lessons: [...s.lessons, data] } : s));
      setNewLesson((p) => ({ ...p, [sectionId]: { title: '', type: 'video', duration: '' } }));
      toast.success('تم إضافة الدرس');
    } catch { toast.error('فشل إضافة الدرس'); }
  };

  const deleteLesson = async (sectionId: string, lessonId: string) => {
    try {
      await api.delete(`/lessons/${lessonId}`);
      setSections((p) =>
        p.map((s) => s.id === sectionId ? { ...s, lessons: s.lessons.filter((l) => l.id !== lessonId) } : s)
      );
      toast.success('تم حذف الدرس');
    } catch { toast.error('فشل حذف الدرس'); }
  };

  /* ── Toggle is_preview (free/paid) ── */
  const togglePreview = async (sectionId: string, lesson: Lesson) => {
    try {
      await api.put(`/lessons/${lesson.id}`, { is_preview: !lesson.is_preview });
      setSections((p) =>
        p.map((s) => s.id === sectionId
          ? { ...s, lessons: s.lessons.map((l) => l.id === lesson.id ? { ...l, is_preview: !l.is_preview } : l) }
          : s)
      );
      toast.success(lesson.is_preview ? '🔒 الدرس أصبح مدفوع' : '🆓 الدرس أصبح مجاني (preview)');
    } catch { toast.error('فشل التحديث'); }
  };

  /* ── Upload video to lesson ── */
  const uploadVideo = async (lessonId: string, file: File) => {
    setUploadingVideo((p) => ({ ...p, [lessonId]: true }));
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('lesson_id', lessonId);
      await api.post('/files/upload-video', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      // Mark the lesson as having a video
      setSections((p) =>
        p.map((s) => ({
          ...s,
          lessons: s.lessons.map((l) => l.id === lessonId ? { ...l, video_key: 'uploaded' } : l),
        }))
      );
      toast.success(`✅ تم رفع الفيديو للدرس`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'فشل رفع الفيديو');
    } finally {
      setUploadingVideo((p) => ({ ...p, [lessonId]: false }));
    }
  };

  /* ── Upload file(s) (PDF/Excel/etc.) — supports multiple ── */
  const uploadCourseFile = async (e: React.ChangeEvent<HTMLInputElement>, lessonId?: string) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploadingFile(true);
    let success = 0;
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('course_id', id as string);
        if (lessonId) formData.append('lesson_id', lessonId);
        formData.append('title', file.name);
        const { data } = await api.post('/files/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        setFiles((p) => [data.file, ...p]);
        success++;
      } catch (err: any) {
        toast.error(`فشل رفع ${file.name}`);
      }
    }
    if (success > 0) toast.success(`✅ تم رفع ${success} ملف`);
    setUploadingFile(false);
    e.target.value = '';
  };

  /* ── Set Drive/YouTube URL for a lesson ── */
  const setLessonVideoUrl = async (lessonId: string, url: string) => {
    try {
      await api.put(`/lessons/${lessonId}`, { video_url: url || null });
      setSections((p) =>
        p.map((s) => ({
          ...s,
          lessons: s.lessons.map((l) => l.id === lessonId ? { ...l, video_url: url || null } : l),
        }))
      );
      toast.success(url ? '✅ تم حفظ رابط الفيديو' : 'تم حذف الرابط');
    } catch { toast.error('فشل الحفظ'); }
  };

  /* ── Delete file ── */
  const deleteFileItem = async (fileId: string) => {
    try {
      await api.delete(`/files/${fileId}`);
      setFiles((p) => p.filter((f) => f.id !== fileId));
      toast.success('تم حذف الملف');
    } catch { toast.error('فشل الحذف'); }
  };

  /* ── Add assignment ── */
  const addAssignment = async (lessonId: string) => {
    const form = newAssignment[lessonId];
    if (!form?.title?.trim()) return;
    try {
      const { data } = await api.post('/assignments', {
        lesson_id: lessonId, title: form.title,
        description: form.description || '',
        due_days: parseInt(form.due_days) || 7,
      });
      setAssignments((p) => [...p, { ...data, submission_count: '0' }]);
      setNewAssignment((p) => ({ ...p, [lessonId]: { title: '', description: '', due_days: '7' } }));
      toast.success('✅ تم إضافة التاسك');
    } catch { toast.error('فشل إضافة التاسك'); }
  };

  const deleteAssignment = async (assignmentId: string) => {
    try {
      await api.delete(`/assignments/${assignmentId}`);
      setAssignments((p) => p.filter((a) => a.id !== assignmentId));
      toast.success('تم حذف التاسك');
    } catch { toast.error('فشل الحذف'); }
  };

  /* ── Enroll student ── */
  const enrollStudent = async () => {
    if (!selectedStudent) return;
    setEnrolling(true);
    try {
      await api.post('/enrollments', {
        course_id: id,
        user_id: selectedStudent.id,
        payment_ref: paymentRef || undefined,
      });
      toast.success(`✅ تم تسجيل ${selectedStudent.name}`);
      setSelectedStudent(null);
      setPaymentRef('');
      setStudentSearch('');
      const { data } = await api.get(`/enrollments/course/${id}`);
      setEnrollments(data);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'فشل التسجيل');
    } finally { setEnrolling(false); }
  };

  const removeEnrollment = async (enrollmentId: string, name: string) => {
    if (!confirm(`إلغاء تسجيل ${name}؟`)) return;
    try {
      await api.delete(`/enrollments/${enrollmentId}`);
      setEnrollments(p => p.map(e => e.id === enrollmentId ? { ...e, is_active: false } : e));
      toast.success('تم إلغاء التسجيل');
    } catch { toast.error('فشل الإلغاء'); }
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-dark-700 rounded w-64 animate-pulse" />
        <div className="card h-48 animate-pulse bg-dark-700" />
      </div>
    );
  }
  if (!course) return <div className="text-slate-400 p-8">الكورس غير موجود</div>;

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6 animate-slide-up">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/admin/courses" className="p-2 text-slate-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">{course.title}</h1>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
              <span className={cn('badge', course.is_published ? 'badge-green' : 'badge-yellow')}>
                {course.is_published ? '✅ منشور' : '📝 مسودة'}
              </span>
              <span>{formatCurrency(course.price)}</span>
              <span className="capitalize">{course.type}</span>
            </div>
          </div>
        </div>
        <button onClick={saveCourse} disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</> : <><Save className="w-4 h-4" /> حفظ التغييرات</>}
        </button>
      </div>

      {/* ── Analytics strip ── */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'المسجلين', value: analytics.enrollments?.total ?? '0' },
            { label: 'أكملوا', value: analytics.enrollments?.completed ?? '0' },
            { label: 'متوسط التقدم', value: analytics.avg_progress ? `${Math.round(parseFloat(analytics.avg_progress))}%` : '0%' },
            { label: 'متوسط الكويز', value: analytics.quiz_scores?.avg_score ? `${Math.round(parseFloat(analytics.quiz_scores.avg_score))}%` : 'N/A' },
          ].map(({ label, value }) => (
            <div key={label} className="card text-center py-3">
              <p className="text-xl font-bold text-white">{value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 bg-dark-800 border border-dark-700 rounded-xl p-1 w-fit flex-wrap">
        {([
          { key: 'curriculum', label: '📚 المحتوى' },
          { key: 'batches',    label: '👥 الدفعات (Groups)' },
          { key: 'students',   label: '🎓 جميع الطلاب' },
          { key: 'files',      label: '📎 الملفات' },
          { key: 'settings',   label: '⚙️ الإعدادات' },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              tab === key ? 'bg-brand-500 text-white shadow' : 'text-slate-400 hover:text-white'
            )}>
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          TAB: CURRICULUM
      ══════════════════════════════════════════════════ */}
      {tab === 'curriculum' && (
        <div className="space-y-4">

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-slate-400 bg-dark-800 border border-dark-700 rounded-xl px-4 py-3">
            <span className="flex items-center gap-1.5"><Unlock className="w-3.5 h-3.5 text-green-400" /> مجاني (Preview) — يشوفه الكل</span>
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-yellow-400" /> مدفوع — فقط المسجلين</span>
            <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5 text-brand-400" /> اضغط 🎬 لرفع فيديو للدرس</span>
            <span className="flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5 text-purple-400" /> اضغط ➕ لإضافة تاسك</span>
          </div>

          {/* Add section */}
          <div className="flex gap-2">
            <input value={newSectionTitle} onChange={(e) => setNewSectionTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSection()}
              placeholder="عنوان قسم جديد…" className="input flex-1" />
            <button onClick={addSection} disabled={addingSection || !newSectionTitle.trim()} className="btn-primary px-4">
              {addingSection ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> قسم</>}
            </button>
          </div>

          {/* Sections */}
          {sections.map((section) => {
            const nl = newLesson[section.id] || { title: '', type: 'video', duration: '' };
            const isOpen = !!expanded[section.id];
            return (
              <div key={section.id} className="border border-dark-700 rounded-xl overflow-hidden">
                {/* Section header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-dark-800">
                  <button onClick={() => setExpanded((p) => ({ ...p, [section.id]: !isOpen }))}
                    className="flex-1 flex items-center gap-2 text-left">
                    {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    <span className="font-semibold text-white text-sm">{section.title}</span>
                    <span className="text-slate-500 text-xs ml-auto">{(section.lessons?.length ?? 0)} درس</span>
                  </button>
                  <button onClick={() => deleteSection(section.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {isOpen && (
                  <div className="divide-y divide-dark-700/50 bg-dark-900/30">
                    {(section.lessons ?? []).map((lesson) => {
                      const Icon = lessonTypeIcon[lesson.type] || Video;
                      const lessonAssignments = assignments.filter((a) => a.lesson_id === lesson.id);
                      const na = newAssignment[lesson.id] || { title: '', description: '', due_days: '7' };

                      return (
                        <div key={lesson.id} className="p-4">
                          {/* Lesson row */}
                          <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 text-brand-400 flex-shrink-0" />
                            <span className="text-slate-200 text-sm font-medium flex-1">{lesson.title}</span>
                            <span className="text-slate-500 text-xs">{lesson.duration_minutes}د</span>

                            {/* Free / Paid toggle */}
                            <button onClick={() => togglePreview(section.id, lesson)}
                              title={lesson.is_preview ? 'مجاني — اضغط لتحويله لمدفوع' : 'مدفوع — اضغط لتحويله لمجاني'}
                              className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200',
                                lesson.is_preview
                                  ? 'border-green-500/40 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                  : 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
                              )}>
                              {lesson.is_preview ? <><Unlock className="w-3 h-3" /> مجاني</> : <><Lock className="w-3 h-3" /> مدفوع</>}
                            </button>

                            {/* Video upload button */}
                            {lesson.type === 'video' && (
                              <label title="رفع فيديو لهذا الدرس"
                                className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer',
                                  lesson.video_key
                                    ? 'border-brand-500/40 bg-brand-500/10 text-brand-400 hover:bg-brand-500/20'
                                    : 'border-slate-600 bg-dark-700 text-slate-400 hover:border-brand-500/50 hover:text-brand-400'
                                )}>
                                {uploadingVideo[lesson.id]
                                  ? <Loader2 className="w-3 h-3 animate-spin" />
                                  : <Video className="w-3 h-3" />}
                                {lesson.video_key ? 'تغيير الفيديو' : '🎬 رفع فيديو'}
                                <input type="file" accept="video/*" className="sr-only"
                                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadVideo(lesson.id, f); e.target.value = ''; }}
                                  disabled={uploadingVideo[lesson.id]} />
                              </label>
                            )}

                            {/* Multi-file upload */}
                            <label title="رفع ملفات للدرس (PDF/Excel/Word) — يمكن اختيار عدة ملفات"
                              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-600 bg-dark-700 text-slate-400 hover:border-purple-500/50 hover:text-purple-400 transition-all cursor-pointer">
                              <Paperclip className="w-3 h-3" /> 📎 ملفات
                              <input type="file" multiple className="sr-only"
                                accept=".pdf,.xlsx,.xls,.docx,.doc,.zip,.rar,image/*"
                                onChange={(e) => uploadCourseFile(e, lesson.id)} />
                            </label>

                            <button onClick={() => deleteLesson(section.id, lesson.id)}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Video URL row (Drive / YouTube) */}
                          {lesson.type === 'video' && (
                            <div className="mt-2 ml-7 flex gap-2 items-center">
                              <span className="text-xs text-slate-500 whitespace-nowrap">🔗 رابط Drive/YouTube:</span>
                              <input
                                type="url"
                                defaultValue={lesson.video_url || ''}
                                onBlur={(e) => {
                                  const v = e.target.value.trim();
                                  if (v !== (lesson.video_url || '')) setLessonVideoUrl(lesson.id, v);
                                }}
                                placeholder="https://drive.google.com/file/d/.../preview أو رابط يوتيوب…"
                                className="input text-xs py-1 flex-1"
                              />
                              {lesson.video_url && (
                                <a href={lesson.video_url} target="_blank" rel="noreferrer"
                                   className="text-xs text-brand-400 hover:underline whitespace-nowrap">معاينة</a>
                              )}
                            </div>
                          )}

                          {/* Lesson files inline */}
                          {(() => {
                            const lessonFiles = files.filter((f) => f.lesson_id === lesson.id);
                            if (lessonFiles.length === 0) return null;
                            return (
                              <div className="mt-2 ml-7 flex flex-wrap gap-1.5">
                                {lessonFiles.map((f) => (
                                  <div key={f.id} className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/30 text-purple-300 rounded-full px-2 py-0.5 text-xs">
                                    <Paperclip className="w-3 h-3" />
                                    <span className="max-w-32 truncate">{f.name}</span>
                                    <button onClick={() => deleteFileItem(f.id)} className="text-slate-400 hover:text-red-400">
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}

                          {/* Assignments for this lesson */}
                          {lessonAssignments.length > 0 && (
                            <div className="mt-3 ml-7 space-y-1.5">
                              {lessonAssignments.map((a) => (
                                <div key={a.id} className="flex items-center gap-2 bg-purple-900/20 border border-purple-500/20 rounded-lg px-3 py-2">
                                  <ClipboardList className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                                  <span className="text-sm text-purple-200 flex-1">{a.title}</span>
                                  <span className="text-xs text-slate-400">{a.due_days} يوم</span>
                                  <span className="badge badge-purple">{a.submission_count} تسليم</span>
                                  <button onClick={() => deleteAssignment(a.id)}
                                    className="p-1 text-slate-500 hover:text-red-400 transition-colors">
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add assignment form */}
                          {(lesson.type === 'assignment' || lesson.type === 'text' || lesson.type === 'video') && (
                            <div className="mt-3 ml-7 space-y-2">
                              <div className="flex gap-2">
                                <input value={na.title}
                                  onChange={(e) => setNewAssignment((p) => ({ ...p, [lesson.id]: { ...na, title: e.target.value } }))}
                                  placeholder="عنوان التاسك (اختياري)…"
                                  className="input text-xs py-1.5 flex-1" />
                                <input type="number" min={1} value={na.due_days}
                                  onChange={(e) => setNewAssignment((p) => ({ ...p, [lesson.id]: { ...na, due_days: e.target.value } }))}
                                  placeholder="أيام" className="input text-xs py-1.5 w-20" />
                                <button onClick={() => addAssignment(lesson.id)} disabled={!na.title.trim()}
                                  className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-40 flex items-center gap-1">
                                  <Plus className="w-3 h-3" /> تاسك
                                </button>
                              </div>
                              {na.title && (
                                <textarea value={na.description}
                                  onChange={(e) => setNewAssignment((p) => ({ ...p, [lesson.id]: { ...na, description: e.target.value } }))}
                                  placeholder="وصف التاسك…" rows={2} className="input text-xs py-1.5 resize-none w-full" />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add lesson form */}
                    <div className="p-3 bg-dark-800/50 space-y-2">
                      <p className="text-xs text-slate-500 font-medium">إضافة درس جديد</p>
                      <input value={nl.title}
                        onChange={(e) => setNewLesson((p) => ({ ...p, [section.id]: { ...nl, title: e.target.value } }))}
                        placeholder="عنوان الدرس…" className="input text-sm py-2"
                        onKeyDown={(e) => e.key === 'Enter' && addLesson(section.id)} />
                      <div className="flex gap-2">
                        <select value={nl.type}
                          onChange={(e) => setNewLesson((p) => ({ ...p, [section.id]: { ...nl, type: e.target.value } }))}
                          className="input text-sm py-2 flex-1">
                          <option value="video">🎬 فيديو</option>
                          <option value="text">📄 نص / مقال</option>
                          <option value="quiz">❓ كويز</option>
                          <option value="assignment">📋 تاسك/واجب</option>
                          <option value="zoom">📹 جلسة Zoom</option>
                        </select>
                        <input type="number" value={nl.duration}
                          onChange={(e) => setNewLesson((p) => ({ ...p, [section.id]: { ...nl, duration: e.target.value } }))}
                          placeholder="دقائق" className="input text-sm py-2 w-24" min={0} />
                        <button onClick={() => addLesson(section.id)} disabled={!nl.title.trim()}
                          className="btn-primary px-4 text-sm disabled:opacity-50 flex items-center gap-1">
                          <Plus className="w-4 h-4" /> أضف
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {sections.length === 0 && (
            <div className="card text-center py-12">
              <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">لا توجد أقسام بعد. أضف قسماً لبناء محتوى الكورس.</p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: BATCHES (Groups)
      ══════════════════════════════════════════════════ */}
      {tab === 'batches' && id && (
        <BatchesManager courseId={String(id)} />
      )}

      {/* ══════════════════════════════════════════════════
          TAB: STUDENTS
      ══════════════════════════════════════════════════ */}
      {tab === 'students' && (
        <div className="space-y-5">

          {/* ── Enroll new student ── */}
          <div className="card space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-brand-400" /> تسجيل طالب جديد
            </h2>

            {/* Student search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={studentSearch}
                onChange={e => { setStudentSearch(e.target.value); setSelectedStudent(null); }}
                placeholder="ابحث باسم الطالب أو الإيميل…"
                className="input pr-10"
              />
            </div>

            {/* Dropdown results */}
            {studentSearch && !selectedStudent && students.length > 0 && (
              <div className="border border-dark-600 rounded-xl overflow-hidden bg-dark-800 divide-y divide-dark-700">
                {students.map(s => (
                  <button key={s.id} onClick={() => { setSelectedStudent(s); setStudentSearch(s.name); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-dark-700 transition-colors text-left">
                    <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-semibold text-sm flex-shrink-0">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-slate-200 text-sm font-medium">{s.name}</p>
                      <p className="text-slate-500 text-xs">{s.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Selected student */}
            {selectedStudent && (
              <div className="flex items-center gap-3 bg-brand-500/10 border border-brand-500/30 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm">
                  {selectedStudent.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{selectedStudent.name}</p>
                  <p className="text-slate-400 text-xs">{selectedStudent.email}</p>
                </div>
                <button onClick={() => { setSelectedStudent(null); setStudentSearch(''); }} className="text-slate-500 hover:text-red-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Payment ref — shown only for paid courses */}
            {course && parseFloat(course.price as any) > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-green-400" />
                  مرجع الدفع <span className="text-red-400">*</span>
                  <span className="text-slate-500 font-normal">(رقم الإيصال أو التحويل)</span>
                </label>
                <input value={paymentRef} onChange={e => setPaymentRef(e.target.value)}
                  placeholder="مثال: TRX-20240501-001"
                  className="input" />
              </div>
            )}

            <button
              onClick={enrollStudent}
              disabled={!selectedStudent || enrolling || (parseFloat(course?.price as any) > 0 && !paymentRef)}
              className="btn-primary flex items-center gap-2 disabled:opacity-40">
              {enrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              تسجيل في الكورس
            </button>
          </div>

          {/* ── Enrolled students list ── */}
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-dark-700 flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                الطلاب المسجلين ({enrollments.filter(e => e.is_active).length})
              </h3>
            </div>

            {enrollments.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">لا يوجد طلاب مسجلين بعد</div>
            ) : (
              <div className="divide-y divide-dark-700">
                {enrollments.map(e => (
                  <div key={e.id} className={cn('flex items-center gap-4 px-5 py-3 transition-colors',
                    e.is_active ? 'hover:bg-dark-700/30' : 'opacity-40')}>
                    <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-sm flex-shrink-0">
                      {e.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm font-medium">{e.name}</p>
                      <p className="text-slate-500 text-xs">{e.email}</p>
                    </div>
                    {/* Progress bar */}
                    <div className="hidden sm:flex items-center gap-2 w-28">
                      <div className="flex-1 h-1.5 bg-dark-600 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${e.progress_pct || 0}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 w-8">{e.progress_pct || 0}%</span>
                    </div>
                    {e.payment_ref && (
                      <span className="badge badge-green text-xs hidden sm:inline-flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3" /> {e.payment_ref}
                      </span>
                    )}
                    {!e.is_active && <span className="badge badge-yellow text-xs">مُلغي</span>}
                    {e.is_active && (
                      <button onClick={() => removeEnrollment(e.id, e.name)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                        title="إلغاء التسجيل">
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: FILES
      ══════════════════════════════════════════════════ */}
      {tab === 'files' && (
        <div className="space-y-4">
          <div className="card">
            <h2 className="text-base font-semibold text-white mb-4">📎 رفع ملفات للكورس</h2>
            <p className="text-slate-400 text-sm mb-4">
              يمكنك رفع <strong className="text-white">PDF، Excel، Word، صور</strong>.
              الملفات متاحة فقط للطلاب المسجلين ما لم تحددها مجانية.
            </p>
            <label className={cn('flex items-center gap-3 border-2 border-dashed border-dark-600 rounded-xl p-6 cursor-pointer hover:border-brand-500/50 hover:bg-brand-500/5 transition-all', uploadingFile && 'opacity-50 cursor-not-allowed')}>
              {uploadingFile
                ? <><Loader2 className="w-6 h-6 text-brand-400 animate-spin" /><span className="text-slate-300">جاري الرفع…</span></>
                : <><Upload className="w-6 h-6 text-slate-400" /><div><p className="text-slate-300 font-medium">اختر ملفاً للرفع</p><p className="text-xs text-slate-500">PDF · Excel · Word · صور · حتى 2GB</p></div></>
              }
              <input type="file" multiple className="sr-only" onChange={(e) => uploadCourseFile(e)} disabled={uploadingFile}
                accept=".pdf,.xlsx,.xls,.docx,.doc,.zip,.rar,image/*" />
            </label>
          </div>

          {/* Files list */}
          <div className="card p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-dark-700">
              <h3 className="font-semibold text-white">ملفات الكورس ({files.length})</h3>
            </div>
            {files.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">لا توجد ملفات مرفوعة بعد</div>
            ) : (
              <div className="divide-y divide-dark-700">
                {files.map((f) => (
                  <div key={f.id} className="flex items-center gap-4 px-6 py-3 hover:bg-dark-700/30 transition-colors">
                    <div className="w-8 h-8 bg-brand-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      {f.file_type.startsWith('image') ? <ImageIcon className="w-4 h-4 text-brand-400" /> : <FileText className="w-4 h-4 text-brand-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm font-medium truncate">{f.name}</p>
                      <p className="text-slate-500 text-xs">{fmtSize(f.file_size)} · {f.file_type.split('/')[1]?.toUpperCase()}</p>
                    </div>
                    {f.lesson_id && <span className="badge badge-blue text-xs">مرتبط بدرس</span>}
                    <button onClick={() => deleteFileItem(f.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: SETTINGS
      ══════════════════════════════════════════════════ */}
      {tab === 'settings' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card space-y-5">
            <h2 className="text-base font-semibold text-white">إعدادات الكورس</h2>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">العنوان</label>
              <input value={course.title} onChange={(e) => setCourse({ ...course, title: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">الوصف</label>
              <textarea value={course.description || ''} onChange={(e) => setCourse({ ...course, description: e.target.value })}
                rows={5} className="input resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">نوع الكورس</label>
                <select value={course.type} onChange={(e) => setCourse({ ...course, type: e.target.value })} className="input">
                  <option value="online">Online (مسجّل)</option>
                  <option value="live">Live (مباشر)</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">المستوى</label>
                <select value={course.level} onChange={(e) => setCourse({ ...course, level: e.target.value })} className="input">
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-green-400" /> السعر (USD)
                </label>
                <input type="number" value={course.price} min={0} step={0.01}
                  onChange={(e) => setCourse({ ...course, price: parseFloat(e.target.value) || 0 })} className="input" />
                <p className="text-xs text-slate-500 mt-1">اكتب 0 لجعل الكورس مجاني كلياً</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">المدة (ساعات)</label>
                <input type="number" value={course.duration_hours} min={0} step={0.5}
                  onChange={(e) => setCourse({ ...course, duration_hours: parseFloat(e.target.value) || 0 })} className="input" />
              </div>
            </div>

            {/* Published toggle */}
            <div className="border-t border-dark-700 pt-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" checked={course.is_published}
                    onChange={(e) => setCourse({ ...course, is_published: e.target.checked })} className="sr-only peer" />
                  <div className="w-11 h-6 bg-dark-600 rounded-full peer peer-checked:bg-brand-500 transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5 shadow" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{course.is_published ? '✅ الكورس منشور' : '📝 مسودة'}</p>
                  <p className="text-xs text-slate-400">{course.is_published ? 'الطلاب يمكنهم التسجيل والوصول' : 'الكورس مخفي عن الطلاب'}</p>
                </div>
              </label>
            </div>

            <button onClick={saveCourse} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</> : <><Save className="w-4 h-4" /> حفظ الإعدادات</>}
            </button>
          </div>

          {/* Pricing info card */}
          <div className="space-y-4">
            <div className="card border-brand-500/30 bg-brand-500/5">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" /> نظام المجاني / المدفوع
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 p-3 bg-green-900/20 border border-green-500/20 rounded-lg">
                  <Unlock className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-300 font-medium">درس مجاني (Preview)</p>
                    <p className="text-slate-400 text-xs mt-0.5">يظهر للزوار حتى بدون تسجيل. مثالي للدرس الأول كـ teaser.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-yellow-900/20 border border-yellow-500/20 rounded-lg">
                  <Lock className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-yellow-300 font-medium">درس مدفوع</p>
                    <p className="text-slate-400 text-xs mt-0.5">يحتاج تسجيل في الكورس. إذا الكورس بسعر، يحتاج الطالب الدفع أولاً.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-brand-900/20 border border-brand-500/20 rounded-lg">
                  <DollarSign className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-brand-300 font-medium">كورس مجاني بالكامل</p>
                    <p className="text-slate-400 text-xs mt-0.5">اضبط السعر = 0. الطلاب يسجلون مجاناً ويوصلوا لكل المحتوى.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card border-purple-500/30 bg-purple-500/5">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-purple-400" /> التاسكات / الواجبات
              </h3>
              <p className="text-slate-400 text-sm">
                تقدر تضيف تاسك لأي درس من تبويب <strong className="text-white">المحتوى والدروس</strong>.
                الطالب يقدر يرفع ملفه كإجابة، وإنت تقدر تراجعه وتديله درجة من لوحة التحكم.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
