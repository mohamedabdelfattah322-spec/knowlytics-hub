'use client';
import { useEffect, useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Bookmark, BookmarkX, Save, X, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Note {
  id: string; content: string; video_timestamp: number; created_at: string;
}
interface Bookmark {
  id: string; label: string | null; video_timestamp: number;
}

interface Props {
  lessonId: string;
  getCurrentTime?: () => number;   // returns current video position in seconds
}

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export default function NotesPanel({ lessonId, getCurrentTime }: Props) {
  const [tab, setTab] = useState<'notes' | 'bookmarks'>('notes');
  const [notes, setNotes] = useState<Note[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, [lessonId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [n, b] = await Promise.all([
        api.get(`/notes/lesson/${lessonId}`),
        api.get(`/notes/bookmarks/lesson/${lessonId}`),
      ]);
      setNotes(n.data);
      setBookmarks(b.data);
    } catch {}
    setLoading(false);
  };

  const addNote = async () => {
    if (!newContent.trim()) return;
    setSaving(true);
    try {
      const ts = getCurrentTime?.() || 0;
      const { data } = await api.post(`/notes/lesson/${lessonId}`, {
        content: newContent.trim(),
        video_timestamp: Math.floor(ts),
      });
      setNotes((n) => [...n, data]);
      setNewContent('');
      toast.success('تم حفظ الملاحظة');
    } catch { toast.error('فشل الحفظ'); }
    setSaving(false);
  };

  const saveEdit = async () => {
    if (!editId || !editContent.trim()) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/notes/${editId}`, { content: editContent.trim() });
      setNotes((n) => n.map((x) => x.id === editId ? data : x));
      setEditId(null);
      toast.success('تم التحديث');
    } catch { toast.error('فشل'); }
    setSaving(false);
  };

  const deleteNote = async (id: string) => {
    if (!confirm('حذف الملاحظة؟')) return;
    await api.delete(`/notes/${id}`);
    setNotes((n) => n.filter((x) => x.id !== id));
    toast.success('تم الحذف');
  };

  const addBookmark = async () => {
    const ts = getCurrentTime?.() || 0;
    const label = prompt('اسم للـ Bookmark (اختياري)') ?? undefined;
    try {
      const { data } = await api.post(`/notes/bookmarks/lesson/${lessonId}`, {
        video_timestamp: Math.floor(ts),
        label,
      });
      setBookmarks((b) => [...b, data].sort((a, z) => a.video_timestamp - z.video_timestamp));
      toast.success(`🔖 ${fmtTime(ts)} — تم الحفظ`);
    } catch { toast.error('فشل'); }
  };

  const deleteBookmark = async (id: string) => {
    await api.delete(`/notes/bookmarks/${id}`);
    setBookmarks((b) => b.filter((x) => x.id !== id));
  };

  return (
    <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-dark-700">
        {(['notes', 'bookmarks'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('flex-1 py-3 text-sm font-medium transition-colors',
              tab === t ? 'text-brand-400 border-b-2 border-brand-400' : 'text-slate-400 hover:text-white'
            )}>
            {t === 'notes' ? `📝 الملاحظات (${notes.length})` : `🔖 Bookmarks (${bookmarks.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-brand-400" /></div>
      ) : tab === 'notes' ? (
        <div className="p-4 space-y-3">
          {/* Add note */}
          <div className="space-y-2">
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={3}
              placeholder="اكتب ملاحظتك هنا... (سيتم حفظ وقت الفيديو تلقائياً)"
              className="input resize-none text-sm w-full"
            />
            <button onClick={addNote} disabled={saving || !newContent.trim()}
              className="btn-primary text-sm flex items-center gap-1.5 py-2 disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              إضافة
            </button>
          </div>

          {/* Notes list */}
          {notes.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">لا توجد ملاحظات لهذا الدرس</p>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="bg-dark-700/50 rounded-lg p-3 border border-dark-600">
                {editId === n.id ? (
                  <div className="space-y-2">
                    <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                      rows={3} className="input resize-none text-sm w-full" />
                    <div className="flex gap-2">
                      <button onClick={saveEdit} disabled={saving} className="btn-primary text-xs py-1 flex items-center gap-1">
                        <Save className="w-3 h-3" /> حفظ
                      </button>
                      <button onClick={() => setEditId(null)} className="btn-secondary text-xs py-1 flex items-center gap-1">
                        <X className="w-3 h-3" /> إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-xs text-brand-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {fmtTime(n.video_timestamp)}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditId(n.id); setEditContent(n.content); }}
                          className="p-1 text-slate-500 hover:text-brand-400">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => deleteNote(n.id)} className="p-1 text-slate-500 hover:text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <button onClick={addBookmark} className="btn-primary text-sm flex items-center gap-1.5 py-2 w-full justify-center">
            <Bookmark className="w-3.5 h-3.5" /> إضافة Bookmark عند الوقت الحالي
          </button>

          {bookmarks.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">لا توجد bookmarks لهذا الدرس</p>
          ) : (
            bookmarks.map((b) => (
              <div key={b.id} className="flex items-center justify-between bg-dark-700/50 rounded-lg p-3 border border-dark-600">
                <div className="flex items-center gap-2">
                  <span className="text-brand-400 font-mono text-sm">{fmtTime(b.video_timestamp)}</span>
                  <span className="text-slate-300 text-sm">{b.label || 'Bookmark'}</span>
                </div>
                <button onClick={() => deleteBookmark(b.id)} className="text-slate-500 hover:text-red-400 p-1">
                  <BookmarkX className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
