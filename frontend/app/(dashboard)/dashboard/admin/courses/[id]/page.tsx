'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Plus, Trash2, Video, FileText, HelpCircle,
  Save, Loader2, Upload, ChevronDown, ChevronUp,
  Lock, Unlock, ClipboardList, CheckCircle, DollarSign,
  Eye, Image as ImageIcon, Paperclip, X, Users, UserPlus,
  Search, BadgeCheck, Ban, ArrowUp, ArrowDown, Link as LinkIcon,
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
  bunny_video_id?: string | null; bunny_embed_url?: string | null;
  content?: string | null;
}
interface Section { id: string; title: string; description: string | null; order_index: number; lessons: Lesson[]; }
interface Course {
  id: string; title: string; description: string; type: string;
  level: string; price: number; duration_hours: number; is_published: boolean;
  thumbnail_url?: string | null;
  promo_video_url?: string | null;
  default_access_days?: number;
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
  const [instructorsList, setInstructorsList] = useState<{id: string; name: string}[]>([]);
  const [loading, setLoading]     = useState(true);

  // Track whether assignments have been loaded (avoid re-fetching on every sections update)
  const assignmentsLoadedRef = useRef(false);

  // New-section form
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [addingSection, setAddingSection]     = useState(false);

  // New-lesson form per section
  const [newLesson, setNewLesson] = useState<Record<string, { title: string; type: string; duration: string }>>({});

  // Upload state per lesson
  const [uploadingVideo, setUploadingVideo] = useState<Record<string, boolean>>({});
  const [uploadingToBunny, setUploadingToBunny] = useState<Record<string, boolean>>({});
  const [uploadingFile, setUploadingFile]   = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // Promo video upload state
  const [uploadingPromo, setUploadingPromo] = useState(false);
  const [promoProgress, setPromoProgress]   = useState(0);

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
  const [tab, setTab] = useState<'curriculum' | 'files' | 'students' | 'batches' | 'settings' | 'quizzes' | 'leaderboard'>('curriculum');

  // ── Leaderboard state ──
  interface LeaderRow { id: string; name: string; email: string; avatar_url: string | null; xp: number; level: number; streak_days: number; quizzes_done: number; total_attempts: number; avg_score: number | null; best_score: number | null; total_quiz_points: number; tasks_done: number; rank: number; }
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);

  // ── Quiz state ──
  interface QuizAnswer { text: string; is_correct: boolean; }
  interface QuizQuestion { question_text: string; points: number; answers: QuizAnswer[]; }
  interface QuizRecord { id: string; title: string; description: string; section_id: string; section_title: string; question_count: string; attempt_count: string; }
  const [quizzes, setQuizzes]         = useState<QuizRecord[]>([]);
  const [quizModal, setQuizModal]     = useState(false);
  const [quizSectionId, setQuizSectionId] = useState('');
  const [quizTitle, setQuizTitle]     = useState('');
  const [quizDesc, setQuizDesc]       = useState('');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([
    { question_text: '', points: 1, answers: [{ text: '', is_correct: true }, { text: '', is_correct: false }, { text: '', is_correct: false }, { text: '', is_correct: false }] },
  ]);
  const [savingQuiz, setSavingQuiz]   = useState(false);

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

    // Load instructors list for dropdown
    api.get('/instructors').then(({ data }) => setInstructorsList(data)).catch(() => {});
  }, [id]);

  // Load enrollments when students tab is active
  useEffect(() => {
    if (tab === 'students' && id) {
      api.get(`/enrollments/course/${id}`)
        .then(({ data }) => setEnrollments(data))
        .catch(() => {});
    }
    if (tab === 'quizzes' && id) {
      api.get(`/quizzes/course/${id}`)
        .then(({ data }) => setQuizzes(data))
        .catch(() => {});
    }
    if (tab === 'leaderboard' && id) {
      api.get(`/quizzes/course/${id}/leaderboard`)
        .then(({ data }) => setLeaderboard(data))
        .catch(() => {});
    }
  }, [tab, id]);

  const openQuizModal = (sectionId: string) => {
    setQuizSectionId(sectionId);
    setQuizTitle('');
    setQuizDesc('');
    setQuizQuestions([{ question_text: '', points: 1, answers: [{ text: '', is_correct: true }, { text: '', is_correct: false }, { text: '', is_correct: false }, { text: '', is_correct: false }] }]);
    setQuizModal(true);
  };

  const addQuestion = () => setQuizQuestions(p => [
    ...p,
    { question_text: '', points: 1, answers: [{ text: '', is_correct: true }, { text: '', is_correct: false }, { text: '', is_correct: false }, { text: '', is_correct: false }] },
  ]);

  const updateQuestion = (qi: number, field: string, val: any) =>
    setQuizQuestions(p => p.map((q, i) => i === qi ? { ...q, [field]: val } : q));

  const updateAnswer = (qi: number, ai: number, field: string, val: any) =>
    setQuizQuestions(p => p.map((q, i) => i === qi ? {
      ...q,
      answers: q.answers.map((a, j) =>
        field === 'is_correct'
          ? { ...a, is_correct: j === ai }           // radio: only one correct
          : j === ai ? { ...a, [field]: val } : a
      ),
    } : q));

  const saveQuiz = async () => {
    if (!quizTitle.trim()) return toast.error('أدخل عنوان الكويز');
    if (quizQuestions.some(q => !q.question_text.trim())) return toast.error('أدخل نص كل الأسئلة');
    if (quizQuestions.some(q => q.answers.every(a => !a.text.trim()))) return toast.error('أدخل الإجابات');
    setSavingQuiz(true);
    try {
      await api.post('/quizzes', {
        section_id: quizSectionId,
        title:      quizTitle,
        description: quizDesc,
        questions:  quizQuestions.map(q => ({
          question_text: q.question_text,
          question_type: 'multiple_choice',
          points:        q.points,
          answers:       q.answers.filter(a => a.text.trim()),
        })),
      });
      toast.success('✅ تم حفظ الكويز!');
      setQuizModal(false);
      api.get(`/quizzes/course/${id}`).then(({ data }) => setQuizzes(data));
    } catch { toast.error('فشل الحفظ'); }
    finally { setSavingQuiz(false); }
  };

  const deleteQuizById = async (quizId: string) => {
    if (!confirm('مسح الكويز؟')) return;
    await api.delete(`/quizzes/${quizId}`);
    setQuizzes(p => p.filter(q => q.id !== quizId));
    toast.success('تم المسح');
  };

  // Search students for enrollment
  useEffect(() => {
    const t = setTimeout(() => {
      api.get('/admin/students', { params: { search: studentSearch } })
        .then(({ data }) => setStudents(data))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [studentSearch]);

  // Load assignments ONCE after sections are first fetched (not on every sections state update)
  useEffect(() => {
    if (assignmentsLoadedRef.current) return;
    const lessonIds = sections.flatMap((s) => (s.lessons ?? []).map((l) => l.id));
    if (!lessonIds.length) return;
    assignmentsLoadedRef.current = true;
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
        is_published: course.is_published, thumbnail_url: course.thumbnail_url,
        promo_video_url: course.promo_video_url,
        instructor_profile_id: (course as any).instructor_profile_id,
        category_id: (course as any).category_id,
        language: (course as any).language,
        short_description: (course as any).short_description,
        default_access_days: (course as any).default_access_days,
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

  /* ── Reorder lesson up/down within its section ── */
  const moveLesson = async (sectionId: string, lessonId: string, direction: 'up' | 'down') => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section || !section.lessons) return;
    const idx = section.lessons.findIndex((l) => l.id === lessonId);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= section.lessons.length) return;
    const a = section.lessons[idx], b = section.lessons[swapIdx];
    const reorderedLessons = [...section.lessons];
    reorderedLessons[idx] = b; reorderedLessons[swapIdx] = a;
    setSections((p) => p.map((s) => s.id === sectionId ? { ...s, lessons: reorderedLessons } : s));
    try {
      await Promise.all([
        api.put(`/lessons/${a.id}`, { order_index: swapIdx }),
        api.put(`/lessons/${b.id}`, { order_index: idx }),
      ]);
    } catch { toast.error('فشل تغيير الترتيب'); }
  };

  /* ── Reorder section up/down ── */
  const moveSection = async (sectionId: string, direction: 'up' | 'down') => {
    const idx = sections.findIndex((s) => s.id === sectionId);
    if (idx === -1) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sections.length) return;

    const a = sections[idx], b = sections[swapIdx];
    // Optimistic UI
    const reordered = [...sections];
    reordered[idx] = b; reordered[swapIdx] = a;
    setSections(reordered);

    try {
      await Promise.all([
        api.put(`/admin/sections/${a.id}`, { order_index: swapIdx }),
        api.put(`/admin/sections/${b.id}`, { order_index: idx }),
      ]);
      toast.success('تم تغيير الترتيب');
    } catch {
      toast.error('فشل تغيير الترتيب');
      setSections(sections); // revert
    }
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

  /* ── Rename lesson title ── */
  const renameLesson = async (sectionId: string, lessonId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    try {
      await api.put(`/lessons/${lessonId}`, { title: trimmed });
      setSections((p) =>
        p.map((s) => s.id === sectionId
          ? { ...s, lessons: (s.lessons ?? []).map((l) => l.id === lessonId ? { ...l, title: trimmed } : l) }
          : s)
      );
      toast.success('✏️ تم تعديل اسم الدرس');
    } catch { toast.error('فشل التعديل'); }
  };

  /* ── Rename section title ── */
  const renameSection = async (sectionId: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    try {
      await api.put(`/admin/sections/${sectionId}`, { title: trimmed });
      setSections((p) => p.map((s) => s.id === sectionId ? { ...s, title: trimmed } : s));
      toast.success('✏️ تم تعديل اسم القسم');
    } catch { toast.error('فشل التعديل'); }
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

  /* ── Upload video DIRECTLY to Bunny via TUS (browser → Bunny, bypasses server) ── */
  const uploadVideo = async (lessonId: string, file: File) => {
    setUploadingVideo((p) => ({ ...p, [lessonId]: true }));
    setUploadProgress((p) => ({ ...p, [lessonId]: 0 }));
    try {
      // Step 1: Get TUS credentials from backend (creates video entry on Bunny)
      const { data: token } = await api.post('/files/bunny-tus-token', {
        lesson_id: lessonId,
        title: file.name.replace(/\.[^/.]+$/, ''),
      });

      // Step 2: Upload directly to Bunny via TUS
      const { Upload } = await import('tus-js-client');

      console.log('[TUS] Starting upload with:', {
        videoId:   token.videoId,
        libraryId: token.libraryId,
        expire:    token.authorizationExpire,
        sigLen:    token.authorizationSignature?.length,
      });

      await new Promise<void>((resolve, reject) => {
        const upload = new Upload(file, {
          endpoint:       'https://video.bunnycdn.com/tusupload',
          retryDelays:    [0, 3000, 5000, 10000, 20000],
          storeFingerprintForResuming: false,
          headers: {
            AuthorizationSignature: token.authorizationSignature,
            AuthorizationExpire:    String(token.authorizationExpire),
            VideoId:                token.videoId,
            LibraryId:              String(token.libraryId),
          },
          metadata: {
            filename:  file.name,
            filetype:  file.type,
            title:     file.name.replace(/\.[^/.]+$/, ''),
          },
          onProgress: (bytesUploaded, bytesTotal) => {
            const pct = Math.round((bytesUploaded / bytesTotal) * 100);
            setUploadProgress((p) => ({ ...p, [lessonId]: pct }));
          },
          onSuccess: () => resolve(),
          onError:   (err) => {
            console.error('[TUS] Upload error:', err);
            reject(err);
          },
        });
        upload.start();
      });

      // Step 3: Notify backend to fetch duration
      await api.post('/files/bunny-tus-complete', {
        lesson_id: lessonId,
        video_id:  token.videoId,
      });

      // Update local state
      setSections((p) =>
        p.map((s) => ({
          ...s,
          lessons: s.lessons.map((l) =>
            l.id === lessonId
              ? { ...l, bunny_video_id: token.videoId }
              : l
          ),
        }))
      );

      toast.success('✅ تم رفع الفيديو على Bunny مباشرة!\n🔄 المدة ستظهر تلقائياً بعد المعالجة', { duration: 6000 });
    } catch (err: any) {
      toast.error(err?.message || err?.response?.data?.error || 'فشل رفع الفيديو');
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

  /* ── Upload video to Bunny.net ── */
  const uploadVideoToBunny = async (lessonId: string) => {
    setUploadingToBunny((p) => ({ ...p, [lessonId]: true }));
    try {
      const res = await api.post('/files/upload-to-bunny', { lesson_id: lessonId });
      setSections((p) =>
        p.map((s) => ({
          ...s,
          lessons: s.lessons.map((l) =>
            l.id === lessonId
              ? {
                  ...l,
                  bunny_video_id: res.data.lesson.bunny_video_id,
                  bunny_embed_url: res.data.lesson.bunny_embed_url,
                  duration_minutes: res.data.lesson.duration_minutes ?? l.duration_minutes,
                }
              : l
          ),
        }))
      );
      toast.success(res.data.message || `✅ تم رفع الفيديو إلى Bunny`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'فشل رفع الفيديو إلى Bunny');
    } finally {
      setUploadingToBunny((p) => ({ ...p, [lessonId]: false }));
    }
  };

  /* ── Upload promo video to Bunny (TUS direct) ── */
  const uploadPromoVideo = async (file: File) => {
    if (!id) return;
    setUploadingPromo(true);
    setPromoProgress(0);
    try {
      const { data: token } = await api.post('/files/bunny-tus-token-promo', {
        course_id: id,
        title: `Promo - ${course?.title || file.name.replace(/\.[^/.]+$/, '')}`,
      });
      const { Upload } = await import('tus-js-client');
      await new Promise<void>((resolve, reject) => {
        const upload = new Upload(file, {
          endpoint: 'https://video.bunnycdn.com/tusupload',
          retryDelays: [0, 3000, 5000, 10000, 20000],
          storeFingerprintForResuming: false,
          headers: {
            AuthorizationSignature: token.authorizationSignature,
            AuthorizationExpire:    String(token.authorizationExpire),
            VideoId:                token.videoId,
            LibraryId:              String(token.libraryId),
          },
          metadata: { filename: file.name, filetype: file.type },
          onProgress: (uploaded, total) => setPromoProgress(Math.round((uploaded / total) * 100)),
          onSuccess: () => resolve(),
          onError:   (err) => { console.error('[PromoTUS]', err); reject(err); },
        });
        upload.start();
      });
      // Update local state with the embed URL
      setCourse((c) => c ? { ...c, promo_video_url: token.embedUrl } : c);
      toast.success('✅ تم رفع الفيديو الدعائي على Bunny!');
    } catch (err) {
      console.error('[PromoUpload]', err);
      toast.error('فشل رفع الفيديو الدعائي');
    } finally {
      setUploadingPromo(false);
      setPromoProgress(0);
    }
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

  /* ── Link a Quiz Builder quiz to a quiz-type lesson (stored in content field) ── */
  const setLessonLinkedQuiz = async (lessonId: string, quizId: string) => {
    try {
      await api.put(`/lessons/${lessonId}`, { content: quizId || null });
      setSections((p) =>
        p.map((s) => ({
          ...s,
          lessons: s.lessons.map((l) => l.id === lessonId ? { ...l, content: quizId || null } : l),
        }))
      );
      toast.success(quizId ? '✅ تم ربط الكويز بالدرس' : 'تم إلغاء ربط الكويز');
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
    <>
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
        <div className="flex items-center gap-2">
          <a
            href={`/courses/${id}`}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary flex items-center gap-2 text-sm"
            title="شوف الكورس كما يراه الطالب"
          >
            <Eye className="w-4 h-4" />
            معاينة كطالب
          </a>
          <button onClick={saveCourse} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الحفظ...</> : <><Save className="w-4 h-4" /> حفظ التغييرات</>}
          </button>
        </div>
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
          { key: 'quizzes',      label: '❓ الكويزات' },
          { key: 'leaderboard',  label: '🏆 الترتيب' },
          { key: 'batches',      label: '👥 الدفعات (Groups)' },
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
                    <span
                      contentEditable
                      suppressContentEditableWarning
                      onClick={(e) => e.stopPropagation()}
                      onBlur={(e) => {
                        const v = (e.currentTarget.textContent || '').trim();
                        if (v && v !== section.title) renameSection(section.id, v);
                        else if (!v) e.currentTarget.textContent = section.title;
                      }}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); }
                      }}
                      title="اضغط للتعديل"
                      className="font-semibold text-white text-sm outline-none focus:bg-dark-900 focus:px-2 focus:rounded cursor-text">
                      {section.title}
                    </span>
                    <span className="text-slate-500 text-xs ml-auto">{(section.lessons?.length ?? 0)} درس</span>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'up'); }}
                    disabled={sections.indexOf(section) === 0}
                    title="تحريك لأعلى"
                    className="p-1.5 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:text-slate-500 disabled:hover:bg-transparent">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'down'); }}
                    disabled={sections.indexOf(section) === sections.length - 1}
                    title="تحريك لأسفل"
                    className="p-1.5 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:text-slate-500 disabled:hover:bg-transparent">
                    <ArrowDown className="w-3.5 h-3.5" />
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
                            <span
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => {
                                const v = (e.currentTarget.textContent || '').trim();
                                if (v && v !== lesson.title) renameLesson(section.id, lesson.id, v);
                                else if (!v) e.currentTarget.textContent = lesson.title;
                              }}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); } }}
                              title="اضغط للتعديل"
                              className="text-slate-200 text-sm font-medium flex-1 outline-none focus:bg-dark-700 focus:px-2 focus:rounded cursor-text">
                              {lesson.title}
                            </span>
                            <span className="flex items-center gap-0.5 text-slate-500 text-xs">
                              {lesson.duration_minutes || 0}د
                              {lesson.bunny_video_id && (!lesson.duration_minutes || lesson.duration_minutes === 0) && (
                                <button title="تحديث المدة من Bunny"
                                  className="text-slate-600 hover:text-brand-400 transition-colors"
                                  onClick={async () => {
                                    try {
                                      const { data } = await api.post('/files/refresh-duration', { lesson_id: lesson.id });
                                      if (data.ok) {
                                        setSections(secs => secs.map(s => ({
                                          ...s,
                                          lessons: s.lessons.map(l => l.id === lesson.id ? { ...l, duration_minutes: data.duration_minutes } : l),
                                        })));
                                        toast.success(`✅ تم تحديث المدة: ${data.duration_minutes} دقيقة`);
                                      } else {
                                        toast.error(data.message || 'الفيديو لسه بيتعالج');
                                      }
                                    } catch { toast.error('فشل تحديث المدة'); }
                                  }}>↻</button>
                              )}
                            </span>

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
                              <div className="flex items-center gap-1">
                                <label title="رفع فيديو (يُرفع تلقائياً على Bunny)"
                                  className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer',
                                    lesson.bunny_video_id
                                      ? 'border-green-500/40 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                                      : lesson.video_key
                                        ? 'border-brand-500/40 bg-brand-500/10 text-brand-400 hover:bg-brand-500/20'
                                        : 'border-slate-600 bg-dark-700 text-slate-400 hover:border-brand-500/50 hover:text-brand-400'
                                  )}>
                                  {uploadingVideo[lesson.id]
                                    ? <><Loader2 className="w-3 h-3 animate-spin" /> {uploadProgress[lesson.id] < 100 ? `${uploadProgress[lesson.id]}% جاري الرفع...` : '⏳ جاري المعالجة...'}</>
                                    : lesson.bunny_video_id
                                      ? <><Video className="w-3 h-3" /> ✅ Bunny — تغيير</>
                                      : <><Video className="w-3 h-3" /> 🎬 رفع فيديو</>
                                  }
                                  <input type="file" accept="video/*" className="sr-only"
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadVideo(lesson.id, f); e.target.value = ''; }}
                                    disabled={uploadingVideo[lesson.id]} />
                                </label>
                              </div>
                            )}

                            {/* Thumbnail upload — only when lesson has Bunny video */}
                            {lesson.bunny_video_id && (
                              <label title="تغيير صورة الـ Thumbnail للفيديو"
                                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-600 bg-dark-700 text-slate-400 hover:border-yellow-500/50 hover:text-yellow-400 transition-all cursor-pointer">
                                🖼 Thumb
                                <input type="file" accept="image/*" className="sr-only"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const fd = new FormData();
                                    fd.append('thumbnail', file);
                                    fd.append('video_id', lesson.bunny_video_id!);
                                    try {
                                      await api.post('/files/bunny-thumbnail', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                                      toast.success('✅ تم تحديث الـ Thumbnail');
                                    } catch { toast.error('فشل تحديث الـ Thumbnail'); }
                                    e.target.value = '';
                                  }} />
                              </label>
                            )}

                            {/* Multi-file upload */}
                            <label title="رفع ملفات للدرس (PDF/Excel/Word) — يمكن اختيار عدة ملفات"
                              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-600 bg-dark-700 text-slate-400 hover:border-purple-500/50 hover:text-purple-400 transition-all cursor-pointer">
                              <Paperclip className="w-3 h-3" /> 📎 ملفات
                              <input type="file" multiple className="sr-only"
                                accept=".pdf,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.csv,.txt,.zip,.rar,image/*"
                                onChange={(e) => uploadCourseFile(e, lesson.id)} />
                            </label>

                            <button onClick={() => moveLesson(section.id, lesson.id, 'up')}
                              disabled={(section.lessons ?? []).indexOf(lesson) === 0}
                              title="تحريك لأعلى"
                              className="p-1 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 rounded transition-colors disabled:opacity-30 disabled:hover:text-slate-500 disabled:hover:bg-transparent">
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button onClick={() => moveLesson(section.id, lesson.id, 'down')}
                              disabled={(section.lessons ?? []).indexOf(lesson) === ((section.lessons ?? []).length - 1)}
                              title="تحريك لأسفل"
                              className="p-1 text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 rounded transition-colors disabled:opacity-30 disabled:hover:text-slate-500 disabled:hover:bg-transparent">
                              <ArrowDown className="w-3 h-3" />
                            </button>
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

                          {/* Quiz link selector — shown when lesson type is quiz */}
                          {lesson.type === 'quiz' && (
                            <div className="mt-2 ml-7 flex gap-2 items-center">
                              <span className="text-xs text-slate-500 whitespace-nowrap">🔗 ربط بكويز:</span>
                              <select
                                value={lesson.content || ''}
                                onChange={(e) => setLessonLinkedQuiz(lesson.id, e.target.value)}
                                className="input text-xs py-1 flex-1"
                              >
                                <option value="">— اختر كويز —</option>
                                {quizzes.map((q) => (
                                  <option key={q.id} value={q.id}>
                                    {q.title} ({q.section_title})
                                  </option>
                                ))}
                              </select>
                              {lesson.content && (
                                <a
                                  href={`/courses/${id}/quiz/${lesson.content}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-brand-400 hover:underline whitespace-nowrap"
                                >
                                  معاينة
                                </a>
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
          TAB: QUIZZES
      ══════════════════════════════════════════════════ */}
      {tab === 'quizzes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">الكويزات</h2>
              <p className="text-slate-400 text-sm mt-0.5">أضف كويز لأي سيكشن في الكورس</p>
            </div>
            <button onClick={() => openQuizModal(sections[0]?.id || '')} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> إضافة كويز
            </button>
          </div>

          {quizzes.length === 0 ? (
            <div className="card text-center py-16">
              <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">مفيش كويزات لحد دلوقتي</p>
              <button onClick={() => openQuizModal(sections[0]?.id || '')} className="btn-primary text-sm mt-4 inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> إنشاء أول كويز
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="card flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <HelpCircle className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{quiz.title}</p>
                      <p className="text-xs text-slate-400">{quiz.section_title} · {quiz.question_count} سؤال · {quiz.attempt_count} محاولة</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/courses/${id}/quiz/${quiz.id}`} target="_blank"
                      className="btn-secondary text-xs px-3 py-1.5">معاينة</Link>
                    <button onClick={() => openQuizModal(quiz.section_id)} className="btn-secondary text-xs px-3 py-1.5">
                      + سؤال جديد
                    </button>
                    <button onClick={() => deleteQuizById(quiz.id)} className="text-red-400 hover:text-red-300 p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Per-section quick add */}
          {sections.length > 0 && (
            <div className="card space-y-3">
              <p className="text-sm font-medium text-slate-300">إضافة كويز لسيكشن محدد:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {sections.map(s => (
                  <button key={s.id} onClick={() => openQuizModal(s.id)}
                    className="text-xs text-left bg-dark-700 hover:bg-dark-600 border border-dark-600 rounded-lg px-3 py-2 text-slate-300 hover:text-white transition-all">
                    <Plus className="w-3 h-3 inline ml-1" />
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB: LEADERBOARD
      ══════════════════════════════════════════════════ */}
      {tab === 'leaderboard' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">🏆 ترتيب المتدربين</h2>
              <p className="text-slate-400 text-sm mt-0.5">مرتبون حسب متوسط درجة الكويزات والنقاط</p>
            </div>
            <button onClick={() => api.get(`/quizzes/course/${id}/leaderboard`).then(({ data }) => setLeaderboard(data))}
              className="btn-secondary text-xs flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              تحديث
            </button>
          </div>

          {leaderboard.length === 0 ? (
            <div className="card text-center py-16">
              <p className="text-4xl mb-3">🏆</p>
              <p className="text-slate-400">مفيش بيانات بعد — لما الطلاب يعملوا كويزات هيظهروا هنا</p>
            </div>
          ) : (
            <>
              {/* #1 Hero Card */}
              {(() => {
                const top = leaderboard[0];
                return (
                  <div className="relative overflow-hidden rounded-2xl border-2 border-yellow-500/40 bg-gradient-to-br from-yellow-500/10 via-orange-500/5 to-dark-800 p-6 text-center">
                    {/* Glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent pointer-events-none" />
                    <p className="text-xs text-yellow-400 font-bold tracking-widest uppercase mb-3">المتصدر #{top.rank}</p>
                    {/* Avatar */}
                    <div className="relative w-24 h-24 mx-auto mb-3">
                      {top.avatar_url ? (
                        <img src={top.avatar_url} alt={top.name}
                          className="w-24 h-24 rounded-full object-cover border-4 border-yellow-500/60 shadow-lg" />
                      ) : (
                        <div className="w-24 h-24 rounded-full border-4 border-yellow-500/60 bg-gradient-to-br from-yellow-500/30 to-orange-500/20 flex items-center justify-center shadow-lg">
                          <span className="text-3xl font-bold text-yellow-300">
                            {top.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <span className="absolute -bottom-1 -right-1 text-2xl">🥇</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">{top.name}</h3>
                    <p className="text-slate-400 text-sm mb-4">{top.email}</p>
                    <div className="flex justify-center gap-6 flex-wrap">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-400">{top.avg_score ?? '—'}%</p>
                        <p className="text-xs text-slate-400">متوسط الدرجات</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-brand-400">{top.quizzes_done}</p>
                        <p className="text-xs text-slate-400">كويز أتم</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-400">{top.tasks_done}</p>
                        <p className="text-xs text-slate-400">تاسك سلّم</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-400">{top.best_score ?? '—'}%</p>
                        <p className="text-xs text-slate-400">أعلى درجة</p>
                      </div>
                    </div>
                    {/* Badge strip */}
                    <div className="mt-4 flex items-center justify-center gap-2">
                      <span className="inline-flex items-center gap-1.5 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs font-semibold px-3 py-1.5 rounded-full">
                        ⚡ {top.xp} XP
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-brand-500/20 border border-brand-500/40 text-brand-300 text-xs font-semibold px-3 py-1.5 rounded-full">
                        🎯 المستوى {top.level}
                      </span>
                      {(top.streak_days || 0) > 0 && (
                        <span className="inline-flex items-center gap-1.5 bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-semibold px-3 py-1.5 rounded-full">
                          🔥 {top.streak_days} يوم
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Full rankings table */}
              <div className="card overflow-hidden p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-700 bg-dark-800/60">
                      <th className="text-right px-4 py-3 text-xs text-slate-400 font-medium w-10">#</th>
                      <th className="text-right px-4 py-3 text-xs text-slate-400 font-medium">المتدرب</th>
                      <th className="text-center px-3 py-3 text-xs text-slate-400 font-medium">متوسط</th>
                      <th className="text-center px-3 py-3 text-xs text-slate-400 font-medium">كويزات</th>
                      <th className="text-center px-3 py-3 text-xs text-slate-400 font-medium">محاولات</th>
                      <th className="text-center px-3 py-3 text-xs text-slate-400 font-medium">تاسكات</th>
                      <th className="text-center px-3 py-3 text-xs text-slate-400 font-medium">أعلى</th>
                      <th className="text-center px-3 py-3 text-xs text-slate-400 font-medium">XP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700/50">
                    {leaderboard.map((row) => {
                      const medal = row.rank === 1 ? '🥇' : row.rank === 2 ? '🥈' : row.rank === 3 ? '🥉' : null;
                      const avgColor = (row.avg_score ?? 0) >= 80 ? 'text-green-400' : (row.avg_score ?? 0) >= 50 ? 'text-yellow-400' : row.avg_score === null ? 'text-slate-500' : 'text-red-400';
                      return (
                        <tr key={row.id} className={cn(
                          'transition-colors hover:bg-dark-700/30',
                          row.rank === 1 && 'bg-yellow-500/5'
                        )}>
                          <td className="px-4 py-3 text-center">
                            {medal
                              ? <span className="text-lg">{medal}</span>
                              : <span className="text-slate-500 font-bold">{row.rank}</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              {row.avatar_url ? (
                                <img src={row.avatar_url} alt={row.name}
                                  className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-bold text-brand-400">
                                    {row.name?.charAt(0)?.toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-slate-200 font-medium truncate">{row.name}</p>
                                <p className="text-xs text-slate-500 truncate">{row.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={cn('font-bold', avgColor)}>
                              {row.avg_score !== null ? `${row.avg_score}%` : '—'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center text-slate-300 font-medium">{row.quizzes_done}</td>
                          <td className="px-3 py-3 text-center text-slate-400">{row.total_attempts}</td>
                          <td className="px-3 py-3 text-center">
                            <span className={cn('font-medium', row.tasks_done > 0 ? 'text-purple-400' : 'text-slate-500')}>
                              {row.tasks_done}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center text-slate-300">
                            {row.best_score !== null ? `${row.best_score}%` : '—'}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="text-yellow-400 font-medium">{row.xp}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
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
                accept=".pdf,.xlsx,.xls,.docx,.doc,.pptx,.ppt,.csv,.txt,.zip,.rar,image/*" />
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

            {/* Thumbnail */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">صورة الكورس (Thumbnail)</label>
              {course.thumbnail_url && (
                <div className="mb-2 relative w-full h-40 rounded-lg overflow-hidden bg-dark-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={course.thumbnail_url} alt="thumbnail" className="w-full h-full object-cover" />
                  <button onClick={() => setCourse({ ...course, thumbnail_url: null })}
                    className="absolute top-2 right-2 p-1.5 bg-red-500/90 hover:bg-red-600 rounded-lg text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input type="url" value={course.thumbnail_url || ''}
                  onChange={(e) => setCourse({ ...course, thumbnail_url: e.target.value })}
                  placeholder="رابط صورة (أو ارفع ملف ←)"
                  className="input flex-1" />
                <label className="btn-secondary cursor-pointer flex items-center gap-2 whitespace-nowrap">
                  <Upload className="w-4 h-4" />
                  رفع
                  <input type="file" accept="image/*" className="sr-only"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const fd = new FormData();
                      fd.append('file', f);
                      fd.append('image_only', 'true');
                      fd.append('title', f.name);
                      try {
                        const { data } = await api.post('/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                        const baseHost = apiBase.replace(/\/api\/?$/, '');
                        const url = data.file.public_url || `${baseHost}/uploads/${data.file.file_key}`;
                        setCourse({ ...course, thumbnail_url: url });
                        toast.success('✅ تم رفع الصورة');
                      } catch (err: any) {
                        toast.error(err?.response?.data?.error || 'فشل الرفع');
                      }
                      e.target.value = '';
                    }} />
                </label>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                الصق رابط مباشر (مثلاً من Drive — لازم يكون "Anyone with the link") أو ارفع صورة من جهازك
              </p>
            </div>

            {/* Instructor Profile */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">المدرب</label>
              <select className="input" value={(course as any).instructor_profile_id || ''}
                onChange={(e) => setCourse({ ...course, instructor_profile_id: e.target.value || null } as any)}>
                <option value="">— اختر مدرب —</option>
                {instructorsList.map((inst: any) => (
                  <option key={inst.id} value={inst.id}>{inst.name} {inst.name_ar ? `(${inst.name_ar})` : ''}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">بيانات المدرب هتظهر تلقائياً في صفحة الكورس</p>
            </div>

            {/* Promo Video */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300">الفيديو الدعائي</label>

              {/* Bunny upload button */}
              <div className="flex items-center gap-3 flex-wrap">
                <label className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium cursor-pointer transition-all',
                  uploadingPromo
                    ? 'border-brand-500/40 bg-brand-500/10 text-brand-400 cursor-not-allowed'
                    : course.promo_video_url?.includes('iframe.mediadelivery.net')
                      ? 'border-green-500/40 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                      : 'border-slate-600 bg-dark-700 text-slate-300 hover:border-brand-500/50 hover:text-brand-400'
                )}>
                  {uploadingPromo
                    ? <><Loader2 className="w-4 h-4 animate-spin" />
                        {promoProgress < 100 ? `${promoProgress}% جاري الرفع...` : '⏳ جاري المعالجة...'}</>
                    : course.promo_video_url?.includes('iframe.mediadelivery.net')
                      ? <><Video className="w-4 h-4" /> ✅ Bunny — تغيير الفيديو</>
                      : <><Video className="w-4 h-4" /> 🎬 رفع على Bunny</>}
                  <input type="file" accept="video/*" className="sr-only"
                    disabled={uploadingPromo}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPromoVideo(f); e.target.value = ''; }} />
                </label>

                {/* Thumbnail upload — only when promo video is on Bunny */}
                {course.promo_video_url?.includes('iframe.mediadelivery.net') && (() => {
                  const match = course.promo_video_url!.match(/embed\/\d+\/([a-f0-9-]+)/);
                  const promoVideoId = match?.[1];
                  if (!promoVideoId) return null;
                  return (
                    <label title="تغيير صورة الـ Thumbnail للفيديو الدعائي"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-600 bg-dark-700 text-slate-300 text-sm font-medium cursor-pointer hover:border-yellow-500/50 hover:text-yellow-400 transition-all">
                      🖼 تغيير الـ Thumbnail
                      <input type="file" accept="image/*" className="sr-only"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const fd = new FormData();
                          fd.append('thumbnail', file);
                          fd.append('video_id', promoVideoId);
                          try {
                            await api.post('/files/bunny-thumbnail', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                            toast.success('✅ تم تحديث الـ Thumbnail للفيديو الدعائي');
                          } catch { toast.error('فشل تحديث الـ Thumbnail'); }
                          e.target.value = '';
                        }} />
                    </label>
                  );
                })()}

                {uploadingPromo && promoProgress > 0 && promoProgress < 100 && (
                  <div className="flex-1 h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full transition-all duration-300"
                      style={{ width: `${promoProgress}%` }} />
                  </div>
                )}
              </div>

              {/* Preview if Bunny video */}
              {course.promo_video_url?.includes('iframe.mediadelivery.net') && (
                <div className="rounded-xl overflow-hidden aspect-video bg-black max-w-sm">
                  <iframe src={course.promo_video_url} className="w-full h-full"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen style={{ border: 'none' }} />
                </div>
              )}

              {/* Fallback: external URL */}
              <div>
                <p className="text-xs text-slate-500 mb-1.5">أو الصق رابط YouTube / Google Drive</p>
                <input type="url" value={course.promo_video_url?.includes('iframe.mediadelivery.net') ? '' : (course.promo_video_url || '')}
                  onChange={(e) => setCourse({ ...course, promo_video_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=... أو https://youtu.be/..."
                  className="input text-sm"
                  disabled={!!course.promo_video_url?.includes('iframe.mediadelivery.net')} />
                {course.promo_video_url?.includes('iframe.mediadelivery.net') && (
                  <button onClick={() => setCourse({ ...course, promo_video_url: '' })}
                    className="text-xs text-red-400 hover:text-red-300 mt-1">
                    × إزالة فيديو Bunny واستخدام رابط خارجي
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500">هذا الفيديو يظهر في صفحة الكورس للزائرين قبل التسجيل</p>
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
                  <DollarSign className="w-3.5 h-3.5 text-green-400" /> السعر (جنيه)
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

            {/* Access duration after purchase */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">مدة الوصول بعد الشراء (يوم)</label>
              <input type="number" value={course.default_access_days ?? 0} min={0} step={1}
                onChange={(e) => setCourse({ ...course, default_access_days: parseInt(e.target.value) || 0 })}
                className="input" />
              <p className="text-xs text-slate-500 mt-1">
                مثلاً: <strong>365</strong> سنة · <strong>180</strong> ستة شهور · <strong>30</strong> شهر · <strong>0</strong> مدى الحياة
              </p>
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
    {/* ── Quiz Builder Modal ── */}
    {quizModal && (
      <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8 px-4">
        <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-2xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-dark-700">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-400" /> إنشاء كويز جديد
            </h2>
            <button onClick={() => setQuizModal(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Section selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">السيكشن</label>
              <select value={quizSectionId} onChange={e => setQuizSectionId(e.target.value)} className="input w-full">
                {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>

            {/* Quiz title + desc */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">عنوان الكويز *</label>
                <input value={quizTitle} onChange={e => setQuizTitle(e.target.value)}
                  placeholder="مثال: كويز الوحدة الأولى" className="input w-full" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">وصف (اختياري)</label>
                <input value={quizDesc} onChange={e => setQuizDesc(e.target.value)}
                  placeholder="وصف مختصر للكويز" className="input w-full" />
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white">الأسئلة ({quizQuestions.length})</h3>
                <button onClick={addQuestion} className="btn-secondary text-xs flex items-center gap-1 px-3 py-1.5">
                  <Plus className="w-3.5 h-3.5" /> إضافة سؤال
                </button>
              </div>

              {quizQuestions.map((q, qi) => (
                <div key={qi} className="bg-dark-700/60 border border-dark-600 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-purple-400 bg-purple-500/20 rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">{qi + 1}</span>
                    <input
                      value={q.question_text}
                      onChange={e => updateQuestion(qi, 'question_text', e.target.value)}
                      placeholder={`السؤال ${qi + 1}`}
                      className="input flex-1 text-sm"
                    />
                    <div className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
                      <span>درجة:</span>
                      <input type="number" min={1} max={10} value={q.points}
                        onChange={e => updateQuestion(qi, 'points', parseInt(e.target.value) || 1)}
                        className="input w-14 text-center text-sm py-1 px-2" />
                    </div>
                    {quizQuestions.length > 1 && (
                      <button onClick={() => setQuizQuestions(p => p.filter((_, i) => i !== qi))}
                        className="text-red-400 hover:text-red-300 flex-shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Answers */}
                  <div className="space-y-2 mr-8">
                    {q.answers.map((a, ai) => (
                      <div key={ai} className={cn('flex items-center gap-2 rounded-lg px-3 py-2 border transition-all',
                        a.is_correct ? 'border-green-500/50 bg-green-500/10' : 'border-dark-500 bg-dark-800/50')}>
                        <input type="radio" name={`correct-${qi}`} checked={a.is_correct}
                          onChange={() => updateAnswer(qi, ai, 'is_correct', true)}
                          className="accent-green-400 flex-shrink-0" />
                        <input
                          value={a.text}
                          onChange={e => updateAnswer(qi, ai, 'text', e.target.value)}
                          placeholder={`الإجابة ${ai + 1}${a.is_correct ? ' ✓ الصح' : ''}`}
                          className="bg-transparent flex-1 text-sm text-white outline-none placeholder:text-slate-500"
                        />
                        {a.is_correct && <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />}
                      </div>
                    ))}
                    <p className="text-xs text-slate-500 mr-1">اضغط على الـ radio button قدام الإجابة الصح ✓</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-dark-700">
            <button onClick={() => setQuizModal(false)} className="btn-secondary">إلغاء</button>
            <button onClick={saveQuiz} disabled={savingQuiz} className="btn-primary flex items-center gap-2">
              {savingQuiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ الكويز ({quizQuestions.length} أسئلة)
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
