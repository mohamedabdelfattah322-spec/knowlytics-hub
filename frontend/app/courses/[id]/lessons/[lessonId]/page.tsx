'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle, ChevronLeft, ChevronRight, Loader2, FileText, Download,
  ClipboardList, Upload, List, ChevronDown, Play, Lock,
} from 'lucide-react';
import NotesPanel from '@/components/lesson/NotesPanel';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useVideoAnalytics } from '@/hooks/useVideoAnalytics';
import DiscussionForum from '@/components/course/DiscussionForum';
import AIChatbot from '@/components/AIChatbot';
import { cn } from '@/lib/utils';

interface Lesson {
  id: string; title: string; type: string; content: string;
  duration_minutes: number; section_id: string;
}

interface SectionLesson {
  id: string; title: string; type: string; duration_minutes: number;
  order_index: number; is_preview: boolean;
}

interface Section {
  id: string; title: string; order_index: number;
  lessons: SectionLesson[];
}

export default function LessonPlayerPage() {
  const { id: courseId, lessonId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const { attachToVideo } = useVideoAnalytics({
    lessonId: String(lessonId),
    courseId: String(courseId),
  });

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [completedManual, setCompletedManual] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [notesById, setNotesById] = useState<Record<string, string>>({});

  // Sections + progress
  const [sections, setSections] = useState<Section[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [allLessons, setAllLessons] = useState<{ id: string; title: string }[]>([]);

  // Reset completion guard when lesson changes
  useEffect(() => {
    completedRef.current = false;
    setCompletedManual(false);
  }, [lessonId]);

  useEffect(() => {
    api.get(`/lessons/${lessonId}`).then(({ data }) => {
      const l = data.lesson;
      if (l.type === 'quiz' && l.content) {
        router.replace(`/courses/${courseId}/quiz/${l.content}`);
        return;
      }
      setLesson(l);
      setVideoUrl(data.videoUrl);
    }).catch(() => {
      toast.error('تعذّر تحميل الدرس. تأكد من تسجيلك في الكورس.');
      router.push(`/courses/${courseId}`);
    }).finally(() => setLoading(false));

    api.get(`/files/course/${courseId}`).then(({ data }) => {
      setFiles(data.filter((f: any) => !f.lesson_id || f.lesson_id === lessonId));
    }).catch(() => {});

    // Load sections with lessons structure
    api.get(`/courses/${courseId}`).then(({ data }) => {
      const secs: Section[] = data.sections || [];
      setSections(secs);
      // Build flat list for prev/next navigation
      const flat: { id: string; title: string }[] = [];
      secs.forEach(s => s.lessons?.forEach(l => flat.push({ id: l.id, title: l.title })));
      setAllLessons(flat);
      // Expand the section containing current lesson
      const activeSec = secs.find(s => s.lessons?.some(l => l.id === lessonId));
      if (activeSec) setExpandedSections(new Set([activeSec.id]));
    }).catch(() => {});

    // Load completed lesson IDs
    api.get(`/courses/${courseId}/my-progress`).then(({ data }) => {
      setCompletedIds(new Set(data.completed_ids || []));
    }).catch(() => {});

    // Load assignments
    api.get(`/assignments/lesson/${lessonId}`).then(async ({ data }) => {
      setAssignments(data);
      const subs: Record<string, any> = {};
      for (const a of data) {
        try {
          const { data: sub } = await api.get(`/assignments/${a.id}/my-submission`);
          if (sub) subs[a.id] = sub;
        } catch {}
      }
      setSubmissions(subs);
    }).catch(() => {});
  }, [lessonId, courseId]);

  const submitAssignment = async (id: string, file: File | null) => {
    setSubmittingId(id);
    try {
      const fd = new FormData();
      if (file) fd.append('file', file);
      fd.append('notes', notesById[id] || '');
      const { data } = await api.post(`/assignments/${id}/submit`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSubmissions(p => ({ ...p, [id]: data }));
      toast.success('✅ تم تسليم المهمة');
    } catch { toast.error('فشل التسليم'); }
    finally { setSubmittingId(null); }
  };

  // Disable right-click on video
  const blockContextMenu = (e: React.MouseEvent) => e.preventDefault();

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && videoRef.current && !videoRef.current.paused) videoRef.current.pause();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen') {
        navigator.clipboard?.writeText('').catch(() => {});
        toast.error('🔒 الطباعة ممنوعة');
        e.preventDefault();
      }
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S')) e.preventDefault();
      if (e.key === 'F12' || (ctrl && e.shiftKey && 'ICJicj'.includes(e.key))) e.preventDefault();
    };
    const onCopy = (e: ClipboardEvent) => e.preventDefault();
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('copy', onCopy);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('copy', onCopy);
    };
  }, []);

  const completedRef = useRef(false);
  const markCompleteRef = useRef<() => Promise<void>>(async () => {});

  const markComplete = async () => {
    if (completedRef.current) return;
    completedRef.current = true;
    try {
      await api.post(`/lessons/${lessonId}/complete`);
      setCompletedManual(true);
      setCompletedIds(p => new Set([...p, String(lessonId)]));
      toast.success('✅ تمت المحاضرة!');
    } catch {
      completedRef.current = false;
      toast.error('فشل التحديث');
    }
  };

  // Keep markCompleteRef always pointing to latest markComplete
  useEffect(() => { markCompleteRef.current = markComplete; });

  // Auto-complete when Bunny.net iframe video ends (postMessage) — always uses latest ref
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data?.event === 'ended' || data?.type === 'ended') markCompleteRef.current();
      } catch {}
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const downloadFile = async (fileId: string, name: string) => {
    try {
      const res = await api.get(`/files/${fileId}/download`, { responseType: 'blob' });
      const ct = String(res.headers['content-type'] || '');
      if (ct.includes('application/json')) {
        const text = await (res.data as Blob).text();
        window.open(JSON.parse(text).url, '_blank');
        return;
      }
      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: any) { alert(err?.response?.data?.error || 'فشل التحميل'); }
  };

  const toggleSection = (id: string) => {
    setExpandedSections(p => {
      const next = new Set(p);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Derived — true if this lesson is in the completedIds set OR manually marked
  const completed = completedManual || completedIds.has(String(lessonId));

  // Progress stats
  const totalLessons = sections.reduce((s, sec) => s + (sec.lessons?.length || 0), 0);
  const completedCount = [...completedIds].filter(id =>
    sections.some(s => s.lessons?.some(l => l.id === id))
  ).length;
  const progressPct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const remaining = totalLessons - completedCount;

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    );
  }

  const currentIdx = allLessons.findIndex(l => l.id === lessonId);
  const prev = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const next = currentIdx >= 0 && currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Top bar */}
      <div className="border-b border-dark-700 px-6 py-3 flex items-center gap-4 bg-dark-800 sticky top-0 z-10">
        <Link href={`/courses/${courseId}`} className="text-slate-400 hover:text-white flex items-center gap-1.5 text-sm">
          <ChevronLeft className="w-4 h-4" /> الكورس
        </Link>
        <span className="text-slate-600">|</span>
        <span className="text-slate-300 text-sm font-medium truncate flex-1">{lesson?.title}</span>
        {totalLessons > 0 && (
          <span className="text-xs text-slate-400 shrink-0">
            {completedCount}/{totalLessons} درس
          </span>
        )}
      </div>

      <div className="flex h-[calc(100vh-53px)]">
        {/* ── Left: Content area ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
            {/* Video Player */}
            {videoUrl && (() => {
              if (videoUrl.includes('iframe.mediadelivery.net')) {
                return (
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                    <iframe src={videoUrl} className="w-full h-full"
                      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen style={{ border: 'none' }} />
                    <div className="video-watermark pointer-events-none">{user?.email} · {new Date().toLocaleString()}</div>
                  </div>
                );
              }
              const driveMatch = videoUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/);
              if (driveMatch) return (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                  <iframe src={`https://drive.google.com/file/d/${driveMatch[1]}/preview`} className="w-full h-full"
                    allow="autoplay; encrypted-media; fullscreen" allowFullScreen referrerPolicy="no-referrer" />
                  <div className="video-watermark pointer-events-none">{user?.email} · {new Date().toLocaleString()}</div>
                </div>
              );
              const ytMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/);
              if (ytMatch) return (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                  <iframe src={`https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`} className="w-full h-full"
                    allow="autoplay; encrypted-media; fullscreen" allowFullScreen referrerPolicy="no-referrer" />
                  <div className="video-watermark pointer-events-none">{user?.email} · {new Date().toLocaleString()}</div>
                </div>
              );
              const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
              if (vimeoMatch) return (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                  <iframe src={`https://player.vimeo.com/video/${vimeoMatch[1]}`} className="w-full h-full"
                    allow="autoplay; encrypted-media; fullscreen" allowFullScreen />
                  <div className="video-watermark pointer-events-none">{user?.email} · {new Date().toLocaleString()}</div>
                </div>
              );
              return (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                  <video ref={el => { (videoRef as any).current = el; if (el) attachToVideo(el); }}
                    src={videoUrl} controls controlsList="nodownload nofullscreen"
                    onContextMenu={blockContextMenu} onEnded={markComplete}
                    className="w-full h-full" playsInline />
                  <div className="video-watermark">{user?.email} · {new Date().toLocaleString()}</div>
                </div>
              );
            })()}

            {/* Text content */}
            {lesson?.content && (
              <div className="card prose prose-invert prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
              </div>
            )}

            {/* Files */}
            {files.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-400" /> ملفات الدرس
                </h3>
                <div className="space-y-2">
                  {files.map(f => (
                    <button key={f.id} onClick={() => downloadFile(f.id, f.name)}
                      className="flex items-center gap-3 w-full text-right px-3 py-2.5 rounded-lg hover:bg-dark-700 transition-colors group">
                      <FileText className="w-4 h-4 text-slate-400 group-hover:text-brand-400 shrink-0" />
                      <span className="text-slate-300 text-sm flex-1 truncate">{f.name}</span>
                      <Download className="w-4 h-4 text-slate-500 group-hover:text-brand-400" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <NotesPanel lessonId={String(lessonId)} getCurrentTime={() => videoRef.current?.currentTime ?? 0} />

            {/* Assignments */}
            {assignments.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-purple-400" /> المهام
                </h3>
                <div className="space-y-3">
                  {assignments.map(a => {
                    const sub = submissions[a.id];
                    const graded = sub && sub.grade !== null && sub.grade !== undefined;
                    return (
                      <div key={a.id} className={`border rounded-lg p-4 ${graded ? 'border-green-500/30 bg-green-500/5' : sub ? 'border-blue-500/30 bg-blue-500/5' : 'border-dark-700'}`}>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white">{a.title}</p>
                            {a.description && <p className="text-sm text-slate-300 mt-1">{a.description}</p>}
                            <p className="text-xs text-slate-500 mt-1">⏱ {a.due_days} يوم للتسليم</p>
                          </div>
                          {graded && (
                            <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg font-bold border border-green-500/30">
                              {sub.grade}/100
                            </div>
                          )}
                        </div>
                        {sub?.feedback && (
                          <div className="bg-dark-700/50 border border-dark-600 rounded-lg p-3 my-2 text-sm text-slate-300">
                            <p className="text-xs text-slate-400 mb-1">📝 ملاحظات المدرس:</p>
                            {sub.feedback}
                          </div>
                        )}
                        {!graded && (
                          <div className="mt-3 space-y-2">
                            <textarea value={notesById[a.id] || ''} onChange={e => setNotesById(p => ({ ...p, [a.id]: e.target.value }))}
                              placeholder="ملاحظات (اختياري)..." rows={2} className="input text-sm resize-none" />
                            <label className="btn-primary inline-flex items-center gap-2 text-sm cursor-pointer">
                              {submittingId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                              {sub ? 'استبدل الملف' : 'رفع ملف التسليم'}
                              <input type="file" className="sr-only"
                                onChange={e => { const f = e.target.files?.[0]; if (f) submitAssignment(a.id, f); e.target.value = ''; }} />
                            </label>
                            {sub && <span className="text-xs text-blue-400 mr-2">✓ تم التسليم — في انتظار التقييم</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Complete + Navigation */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-dark-700">
              <button onClick={markComplete} disabled={completed}
                className={completed ? 'flex items-center gap-2 text-green-400 font-medium cursor-default' : 'btn-primary flex items-center gap-2'}>
                <CheckCircle className="w-4 h-4" />
                {completed ? '✓ تمت المحاضرة' : 'وضع علامة كمكتمل'}
              </button>
              <Link href={`/courses/${courseId}`} className="btn-secondary flex items-center gap-2 text-sm">
                <List className="w-4 h-4" /> كل الدروس
              </Link>
              <div className="flex gap-2 mr-auto">
                {prev && (
                  <Link href={`/courses/${courseId}/lessons/${prev.id}`}
                    className="btn-secondary flex items-center gap-2 text-sm" title={prev.title}>
                    <ChevronRight className="w-4 h-4" /> السابق
                  </Link>
                )}
                {next && (
                  <Link href={`/courses/${courseId}/lessons/${next.id}`}
                    className="btn-primary flex items-center gap-2 text-sm" title={next.title}>
                    التالي <ChevronLeft className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>

            {/* Discussion */}
            <DiscussionForum courseId={String(courseId)} lessonId={String(lessonId)} />
          </div>
        </div>

        {/* ── Right: Course Sidebar ── */}
        {sections.length > 0 && (
          <div className="w-80 shrink-0 border-r border-dark-700 bg-dark-800 flex flex-col overflow-hidden">
            {/* Progress header */}
            <div className="p-4 border-b border-dark-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">تقدمك في الكورس</span>
                <span className="text-sm font-bold text-brand-400">{progressPct}%</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-dark-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-500 to-green-400 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }} />
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-500">
                <span>✅ {completedCount} مكتمل</span>
                <span>⏳ {remaining} متبقي</span>
              </div>
            </div>

            {/* Sections list */}
            <div className="flex-1 overflow-y-auto">
              {sections.map((sec, secIdx) => {
                const secLessons = sec.lessons || [];
                const secCompleted = secLessons.filter(l => completedIds.has(l.id)).length;
                const isExpanded = expandedSections.has(sec.id);
                const hasActive = secLessons.some(l => l.id === lessonId);

                return (
                  <div key={sec.id} className={cn('border-b border-dark-700', hasActive && 'bg-brand-500/5')}>
                    {/* Section header */}
                    <button onClick={() => toggleSection(sec.id)}
                      className="w-full flex items-center gap-2 px-4 py-3 hover:bg-dark-700/50 transition-colors text-right">
                      <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform shrink-0', !isExpanded && '-rotate-90')} />
                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-xs font-semibold text-slate-300 truncate">
                          القسم {secIdx + 1}: {sec.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {secCompleted}/{secLessons.length} درس
                        </p>
                      </div>
                      {secCompleted === secLessons.length && secLessons.length > 0 && (
                        <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                      )}
                    </button>

                    {/* Section lessons */}
                    {isExpanded && (
                      <div className="pb-1">
                        {secLessons.map((l, lIdx) => {
                          const isActive = l.id === lessonId;
                          const isDone = completedIds.has(l.id);
                          return (
                            <Link key={l.id} href={`/courses/${courseId}/lessons/${l.id}`}
                              className={cn(
                                'flex items-start gap-3 px-4 py-2.5 text-sm transition-colors',
                                isActive
                                  ? 'bg-brand-500/20 border-r-2 border-brand-400'
                                  : 'hover:bg-dark-700/60'
                              )}>
                              {/* Status icon */}
                              <div className="shrink-0 mt-0.5">
                                {isDone ? (
                                  <CheckCircle className="w-4 h-4 text-green-400" />
                                ) : isActive ? (
                                  <div className="w-4 h-4 rounded-full bg-brand-500 flex items-center justify-center">
                                    <Play className="w-2.5 h-2.5 text-white fill-white" />
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-dark-500 flex items-center justify-center">
                                    <span className="text-[9px] text-slate-500">{lIdx + 1}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={cn(
                                  'text-xs leading-relaxed truncate',
                                  isActive ? 'text-brand-300 font-medium' : isDone ? 'text-slate-400' : 'text-slate-300'
                                )}>
                                  {l.title}
                                </p>
                                {l.duration_minutes > 0 && (
                                  <p className="text-[10px] text-slate-600 mt-0.5">{l.duration_minutes} د</p>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* AI Chatbot */}
      <AIChatbot courseId={String(courseId)} lessonId={String(lessonId)} />
    </div>
  );
}
