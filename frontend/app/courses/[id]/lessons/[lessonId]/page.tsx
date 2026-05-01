'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ChevronLeft, Loader2, FileText, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface Lesson {
  id: string; title: string; type: string; content: string;
  duration_minutes: number; section_id: string;
}

export default function LessonPlayerPage() {
  const { id: courseId, lessonId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/lessons/${lessonId}`).then(({ data }) => {
      setLesson(data.lesson);
      setVideoUrl(data.videoUrl);
    }).catch(() => {
      toast.error('Could not load lesson. Please enroll first.');
      router.push(`/courses/${courseId}`);
    }).finally(() => setLoading(false));

    api.get(`/files/course/${courseId}`).then(({ data }) => setFiles(data)).catch(() => {});
  }, [lessonId, courseId]);

  // Disable right-click on video
  const blockContextMenu = (e: React.MouseEvent) => e.preventDefault();

  const markComplete = async () => {
    try {
      await api.post(`/lessons/${lessonId}/complete`);
      setCompleted(true);
      toast.success('Lesson completed! ✅');
    } catch { toast.error('Failed to mark complete'); }
  };

  const downloadFile = async (fileId: string, name: string) => {
    const { data } = await api.get(`/files/${fileId}/download`);
    window.open(data.url, '_blank');
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
        {/* Video Player */}
        {videoUrl && (
          <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              controlsList="nodownload nofullscreen"
              onContextMenu={blockContextMenu}
              className="w-full h-full"
              playsInline
            />
            {/* Dynamic watermark */}
            <div className="video-watermark">
              {user?.email} · {new Date().toLocaleString()}
            </div>
          </div>
        )}

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

        {/* Complete button */}
        <button
          onClick={markComplete}
          disabled={completed}
          className={completed
            ? 'flex items-center gap-2 text-green-400 font-medium cursor-default'
            : 'btn-primary flex items-center gap-2'}
        >
          <CheckCircle className="w-4 h-4" />
          {completed ? 'Lesson Completed ✓' : 'Mark as Complete'}
        </button>
      </div>
    </div>
  );
}
