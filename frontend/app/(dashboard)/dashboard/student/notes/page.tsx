'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StickyNote, Bookmark, Clock, BookOpen, Loader2, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Note {
  id: string; content: string; video_timestamp: number; created_at: string;
  lesson_title: string; section_title: string; course_id: string; course_title: string;
  lesson_id: string;
}
interface Bookmark {
  id: string; label: string | null; video_timestamp: number;
  lesson_title: string; course_id: string; course_title: string;
  lesson_id: string;
}

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

export default function MyNotesPage() {
  const [tab, setTab] = useState<'notes' | 'bookmarks'>('notes');
  const [notes, setNotes] = useState<Note[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/notes/my-all'),
      api.get('/notes/bookmarks/my-all'),
    ]).then(([n, b]) => {
      setNotes(n.data);
      setBookmarks(b.data);
    }).finally(() => setLoading(false));
  }, []);

  const deleteNote = async (id: string) => {
    await api.delete(`/notes/${id}`);
    setNotes((n) => n.filter((x) => x.id !== id));
    toast.success('تم الحذف');
  };

  const deleteBookmark = async (id: string) => {
    await api.delete(`/notes/bookmarks/${id}`);
    setBookmarks((b) => b.filter((x) => x.id !== id));
    toast.success('تم الحذف');
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <StickyNote className="w-6 h-6 text-brand-400" /> ملاحظاتي وإشاراتي
        </h1>
        <p className="text-slate-400 text-sm mt-1">كل الملاحظات والـ Bookmarks الخاصة بك عبر كل الكورسات</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-dark-700 gap-6">
        <button onClick={() => setTab('notes')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === 'notes' ? 'text-brand-400 border-brand-400' : 'text-slate-400 border-transparent hover:text-white'}`}>
          📝 الملاحظات ({notes.length})
        </button>
        <button onClick={() => setTab('bookmarks')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${tab === 'bookmarks' ? 'text-brand-400 border-brand-400' : 'text-slate-400 border-transparent hover:text-white'}`}>
          🔖 Bookmarks ({bookmarks.length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>
      ) : tab === 'notes' ? (
        notes.length === 0 ? (
          <div className="card text-center py-14">
            <StickyNote className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">لا توجد ملاحظات بعد. ابدأ بمشاهدة الدروس وأضف ملاحظاتك!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((n) => (
              <div key={n.id} className="card flex gap-4">
                {/* Time badge */}
                <div className="shrink-0 text-center">
                  <span className="inline-flex items-center gap-1 bg-brand-500/15 text-brand-400 rounded-lg px-2 py-1 text-xs font-mono">
                    <Clock className="w-3 h-3" /> {fmtTime(n.video_timestamp)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm whitespace-pre-wrap mb-2">{n.content}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <BookOpen className="w-3 h-3" />
                    <Link href={`/courses/${n.course_id}/lessons/${n.lesson_id}`}
                      className="hover:text-brand-400 transition-colors">
                      {n.course_title} · {n.lesson_title}
                    </Link>
                    <span>·</span>
                    <span>{new Date(n.created_at).toLocaleDateString('ar-EG')}</span>
                  </div>
                </div>
                <button onClick={() => deleteNote(n.id)} className="shrink-0 text-slate-600 hover:text-red-400 p-1 self-start">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        bookmarks.length === 0 ? (
          <div className="card text-center py-14">
            <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">لا توجد Bookmarks. أضفها أثناء مشاهدة الفيديوهات.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {bookmarks.map((b) => (
              <Link key={b.id} href={`/courses/${b.course_id}/lessons/${b.lesson_id}`}
                className="card hover:border-brand-500/40 transition-all group block">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="text-brand-400 font-mono text-sm">{fmtTime(b.video_timestamp)}</span>
                    <p className="text-white font-medium mt-1">{b.label || '🔖 Bookmark'}</p>
                    <p className="text-xs text-slate-500 mt-1 truncate">{b.course_title} · {b.lesson_title}</p>
                  </div>
                  <button onClick={(e) => { e.preventDefault(); deleteBookmark(b.id); }}
                    className="p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )
      )}
    </div>
  );
}
