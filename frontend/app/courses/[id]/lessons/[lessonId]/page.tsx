'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ChevronLeft, ChevronRight, Loader2, FileText, Download, ClipboardList, Upload, Star, List } from 'lucide-react';
import NotesPanel from '@/components/lesson/NotesPanel';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useVideoAnalytics } from '@/hooks/useVideoAnalytics';
import DiscussionForum from '@/components/course/DiscussionForum';
import AIChatbot from '@/components/AIChatbot';

interface Lesson {
  id: string; title: string; type: string; content: string;
  duration_minutes: number; section_id: string;
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
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [allLessons, setAllLessons] = useState<{id: string; title: string; section: string}[]>([]);

  useEffect(() => {
    api.get(`/lessons/${lessonId}`).then(({ data }) => {
      const l = data.lesson;
      // If this lesson is a quiz type with a linked quiz, redirect immediately
      if (l.type === 'quiz' && l.content) {
        router.replace(`/courses/${courseId}/quiz/${l.content}`);
        return;
      }
      setLesson(l);
      setVideoUrl(data.videoUrl);
    }).catch(() => {
      toast.error('Could not load lesson. Please enroll first.');
      router.push(`/courses/${courseId}`);
    }).finally(() => setLoading(false));

    api.get(`/files/course/${courseId}`).then(({ data }) => {
      // Show only files for this lesson + global course files (no lesson_id)
      setFiles(data.filter((f: any) => !f.lesson_id || f.lesson_id === lessonId));
    }).catch(() => {});

    // Load all lessons in order for prev/next navigation
    api.get(`/courses/${courseId}`).then(({ data }) => {
      const flat: {id: string; title: string; section: string}[] = [];
      (data.sections || []).forEach((s: any) => {
        (s.lessons || []).forEach((l: any) => {
          flat.push({ id: l.id, title: l.title, section: s.title });
        });
      });
      setAllLessons(flat);
    }).catch(() => {});

    // Load assignments for this lesson + my submissions
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
      setSubmissions((p) => ({ ...p, [id]: data }));
      toast.success('✅ تم تسليم المهمة');
    } catch { toast.error('فشل التسليم'); }
    finally { setSubmittingId(null); }
  };

  // Disable right-click on video
  const blockContextMenu = (e: React.MouseEvent) => e.preventDefault();

  // Anti-piracy: pause video when tab loses focus, block screenshot keys, no-print
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      // Block: PrintScreen, Ctrl/Cmd+P (print), Ctrl/Cmd+S (save), Ctrl/Cmd+Shift+I (devtools), F12
      if (e.key === 'PrintScreen') {
        navigator.clipboard?.writeText('').catch(() => {});
        toast.error('🔒 الطباعة بواسطة Print Screen ممنوعة');
        e.preventDefault();
      }
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S')) {
        e.preventDefault(); toast.error('🔒 الإجراء ممنوع');
      }
      if (e.key === 'F12' || (ctrl && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'C' || e.key === 'c' || e.key === 'J' || e.key === 'j'))) {
        e.preventDefault();
      }
    };
    const onCopy = (e: ClipboardEvent) => { e.preventDefault(); };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('copy', onCopy);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('copy', onCopy);
    };
  }, []);

  const markComplete = async () => {
    try {
      await api.post(`/lessons/${lessonId}/complete`);
      setCompleted(true);
      toast.success('Lesson completed! ✅');
    } catch { toast.error('Failed to mark complete'); }
  };

  const downloadFile = async (fileId: string, name: string) => {
    try {
      // Request as blob to support both S3-redirected and local-binary responses
      const res = await api.get(`/files/${fileId}/download`, { responseType: 'blob' });
      const ct = String(res.headers['content-type'] || '');

      if (ct.includes('application/json')) {
        // S3 mode — returns JSON { url }
        const text = await (res.data as Blob).text();
        const json = JSON.parse(text);
        window.open(json.url, '_blank');
        return;
      }

      // Local mode — binary file. Trigger browser download.
      const blob = res.data as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'فشل تحميل الملف';
      alert(msg);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Top bar */}
      <div className="border-b border-dark-700 px-6 py-3 flex items-center gap-4 bg-dark-800">
        <Link href={`/courses/${courseId}`} className="text-slate-400 hover:text-white flex items-center gap-1.5 text-sm">
          <ChevronLeft className="w-4 h-4" /> Back to Course
        </Link>
        <span className="text-slate-600">|</span>
        <span className="text-slate-300 text-sm font-medium truncate">{lesson?.title}</span>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Video Player — supports Google Drive, YouTube, Vimeo, and direct files */}
        {videoUrl && (() => {
          // Convert various URL formats to embeddable form
          let embedUrl: string | null = null;
          let isIframe = false;

          // Bunny.net embed URL (iframe.mediadelivery.net)
          if (videoUrl.includes('iframe.mediadelivery.net')) {
            return (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                <iframe
                  src={videoUrl}
                  className="w-full h-full"
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  style={{ border: 'none' }}
                />
                <div className="video-watermark pointer-events-none">
                  {user?.email} · {new Date().toLocaleString()}
                </div>
              </div>
            );
          }

          // Google Drive: file/d/FILE_ID/view → file/d/FILE_ID/preview
          const driveMatch = videoUrl.match(/drive\.google\.com\/file\/d\/([^/]+)/);
          if (driveMatch) {
            embedUrl = `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
            isIframe = true;
          }

          // YouTube: convert watch?v= or youtu.be/ to embed/
          const ytMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?#]+)/);
          if (ytMatch && !isIframe) {
            embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
            isIframe = true;
          }

          // Vimeo
          const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
          if (vimeoMatch && !isIframe) {
            embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
            isIframe = true;
          }

          if (isIframe && embedUrl) {
            return (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="autoplay; encrypted-media; fullscreen"
                  allowFullScreen
                  referrerPolicy="no-referrer"
                />
                <div className="video-watermark pointer-events-none">
                  {user?.email} · {new Date().toLocaleString()}
                </div>
              </div>
            );
          }

          // Direct video file (S3 / local upload)
          return (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
              <video
                ref={(el) => {
                  (videoRef as any).current = el;
                  if (el) attachToVideo(el);
                }}
                src={videoUrl}
                controls
                controlsList="nodownload nofullscreen"
                onContextMenu={blockContextMenu}
                className="w-full h-full"
                playsInline
              />
              <div className="video-watermark">
                {user?.email} · {new Date().toLocaleString()}
              </div>
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
              <FileText className="w-4 h-4 text-brand-400" /> Course Materials
            </h3>
            <div className="space-y-2">
              {files.map((f) => (
                <button
                  key={f.id}
                  onClick={() => downloadFile(f.id, f.name)}
                  className="flex items-center gap-3 w-full text-left px-3 py-2.5 rounded-lg hover:bg-dark-700 transition-colors group"
                >
                  <FileText className="w-4 h-4 text-slate-400 group-hover:text-brand-400 flex-shrink-0" />
                  <span className="text-slate-300 text-sm flex-1 truncate">{f.name}</span>
                  <Download className="w-4 h-4 text-slate-500 group-hover:text-brand-400" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notes & Bookmarks */}
        <NotesPanel
          lessonId={String(lessonId)}
          getCurrentTime={() => videoRef.current?.currentTime ?? 0}
        />

        {/* Assignments */}
        {assignments.length > 0 && (
          <div className="card">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-purple-400" /> المهام (Assignments)
            </h3>
            <div className="space-y-3">
              {assignments.map((a) => {
                const sub = submissions[a.id];
                const graded = sub && sub.grade !== null && sub.grade !== undefined;
                return (
                  <div key={a.id} className={`border rounded-lg p-4 ${
                    graded ? 'border-green-500/30 bg-green-500/5' :
                    sub ? 'border-blue-500/30 bg-blue-500/5' : 'border-dark-700'
                  }`}>
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
                        <textarea
                          value={notesById[a.id] || ''}
                          onChange={(e) => setNotesById((p) => ({ ...p, [a.id]: e.target.value }))}
                          placeholder="ملاحظات (اختياري)..."
                          rows={2}
                          className="input text-sm resize-none"
                        />
                        <label className="btn-primary inline-flex items-center gap-2 text-sm cursor-pointer">
                          {submittingId === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          {sub ? 'استبدل الملف' : 'رفع ملف التسليم'}
                          <input type="file" className="sr-only"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) submitAssignment(a.id, f); e.target.value = ''; }} />
                        </label>
                        {sub && <span className="text-xs text-blue-400 ml-2">✓ تم التسليم — في انتظار التقييم</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Complete button + Navigation */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-dark-700">
          <button
            onClick={markComplete}
            disabled={completed}
            className={completed
              ? 'flex items-center gap-2 text-green-400 font-medium cursor-default'
              : 'btn-primary flex items-center gap-2'}
          >
            <CheckCircle className="w-4 h-4" />
            {completed ? '✓ تمت المحاضرة' : 'وضع علامة كمكتمل'}
          </button>

          <Link href={`/courses/${courseId}`} className="btn-secondary flex items-center gap-2 text-sm">
            <List className="w-4 h-4" /> كل الدروس
          </Link>

          {(() => {
            const currentIdx = allLessons.findIndex((l) => l.id === lessonId);
            const prev = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
            const next = currentIdx >= 0 && currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;
            return (
              <div className="flex gap-2 ml-auto">
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
            );
          })()}
        </div>

        {/* Lesson Discussion */}
        <DiscussionForum courseId={String(courseId)} lessonId={String(lessonId)} />

        {/* All lessons list (sidebar-like) */}
        {allLessons.length > 1 && (
          <div className="card mt-6">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <List className="w-4 h-4 text-brand-400" /> دروس الكورس ({allLessons.length})
            </h3>
            <div className="space-y-1">
              {allLessons.map((l, i) => {
                const active = l.id === lessonId;
                return (
                  <Link key={l.id} href={`/courses/${courseId}/lessons/${l.id}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      active
                        ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
                        : 'text-slate-300 hover:bg-dark-700'
                    }`}>
                    <span className="w-6 h-6 rounded-full bg-dark-700 flex items-center justify-center text-xs flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate">{l.title}</span>
                    {active && <span className="text-xs">▶</span>}
                  </Link>
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
