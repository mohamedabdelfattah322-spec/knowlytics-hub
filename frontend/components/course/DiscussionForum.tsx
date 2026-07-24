'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  MessageSquare, ThumbsUp, CheckCircle, Pin, Plus, Send,
  Loader2, ChevronDown, ChevronUp, Award, ArrowLeft,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

interface Thread {
  id: string; title: string; body: string; user_id: string;
  author_name: string; author_role: string;
  is_pinned: boolean; is_resolved: boolean;
  upvotes: number; reply_count: number; my_vote: number;
  lesson_title: string | null;
  created_at: string; last_activity_at: string;
}

interface Reply {
  id: string; body: string; user_id: string;
  author_name: string; author_role: string;
  parent_id: string | null; is_answer: boolean;
  upvotes: number; my_vote: number;
  created_at: string;
}

interface Props {
  courseId: string;
  lessonId?: string;
}

export default function DiscussionForum({ courseId, lessonId }: Props) {
  const { user } = useAuth();
  const { isAr } = useLanguage();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThread, setActiveThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sort, setSort] = useState('recent');

  const loadThreads = useCallback(async () => {
    try {
      const params: any = { sort };
      if (lessonId) params.lesson_id = lessonId;
      const { data } = await api.get(`/discussions/course/${courseId}`, { params });
      setThreads(data.threads);
    } catch {} finally { setLoading(false); }
  }, [courseId, lessonId, sort]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  const openThread = async (t: Thread) => {
    try {
      const { data } = await api.get(`/discussions/thread/${t.id}`);
      setActiveThread(data.thread);
      setReplies(data.replies);
    } catch { toast.error('Failed to load thread'); }
  };

  const createThread = async () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`/discussions/course/${courseId}`, {
        title: newTitle, body: newBody, lesson_id: lessonId || null,
      });
      setNewTitle(''); setNewBody(''); setShowNew(false);
      toast.success(isAr ? 'تم نشر السؤال!' : 'Question posted!');
      loadThreads();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed');
    } finally { setSubmitting(false); }
  };

  const postReply = async () => {
    if (!replyBody.trim() || !activeThread) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/discussions/thread/${activeThread.id}/reply`, { body: replyBody });
      setReplies(prev => [...prev, data]);
      setReplyBody('');
      setActiveThread(prev => prev ? { ...prev, reply_count: prev.reply_count + 1 } : null);
    } catch { toast.error('Failed'); }
    finally { setSubmitting(false); }
  };

  const toggleVote = async (threadId?: string, replyId?: string) => {
    try {
      const { data } = await api.post('/discussions/vote', { thread_id: threadId, reply_id: replyId });
      if (threadId) {
        setThreads(prev => prev.map(t => t.id === threadId
          ? { ...t, upvotes: data.voted ? t.upvotes + 1 : t.upvotes - 1, my_vote: data.voted ? 1 : 0 }
          : t));
        if (activeThread?.id === threadId) {
          setActiveThread(prev => prev
            ? { ...prev, upvotes: data.voted ? prev.upvotes + 1 : prev.upvotes - 1, my_vote: data.voted ? 1 : 0 }
            : null);
        }
      }
      if (replyId) {
        setReplies(prev => prev.map(r => r.id === replyId
          ? { ...r, upvotes: data.voted ? r.upvotes + 1 : r.upvotes - 1, my_vote: data.voted ? 1 : 0 }
          : r));
      }
    } catch {}
  };

  const markAnswer = async (replyId: string) => {
    try {
      const { data } = await api.put(`/discussions/reply/${replyId}/answer`);
      setReplies(prev => prev.map(r => r.id === replyId ? { ...r, is_answer: data.is_answer } : r));
      if (data.is_answer && activeThread) {
        setActiveThread({ ...activeThread, is_resolved: true });
      }
    } catch {}
  };

  // ─── Thread List View ────────────────────────
  if (!activeThread) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-brand-400" />
            {isAr ? 'المناقشات' : 'Discussions'}
            <span className="text-xs text-slate-500">({threads.length})</span>
          </h3>
          <div className="flex items-center gap-2">
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="text-xs bg-dark-700 border border-dark-600 text-slate-300 rounded-lg px-2 py-1">
              <option value="recent">{isAr ? 'الأحدث' : 'Recent'}</option>
              <option value="popular">{isAr ? 'الأكثر تفاعلاً' : 'Popular'}</option>
              <option value="unanswered">{isAr ? 'بدون إجابة' : 'Unanswered'}</option>
            </select>
            <button onClick={() => setShowNew(!showNew)}
              className="btn-primary text-xs flex items-center gap-1 px-3 py-1.5">
              <Plus className="w-3 h-3" /> {isAr ? 'سؤال جديد' : 'New'}
            </button>
          </div>
        </div>

        {/* New Thread Form */}
        {showNew && (
          <div className="bg-dark-700/50 rounded-lg p-4 mb-4 space-y-3 border border-dark-600">
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
              placeholder={isAr ? 'عنوان السؤال...' : 'Question title...'}
              className="input text-sm" />
            <textarea value={newBody} onChange={e => setNewBody(e.target.value)}
              placeholder={isAr ? 'اكتب تفاصيل سؤالك هنا...' : 'Describe your question...'}
              rows={3} className="input text-sm resize-none" />
            <div className="flex gap-2">
              <button onClick={createThread} disabled={submitting}
                className="btn-primary text-xs flex items-center gap-1 px-4 py-1.5">
                {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                {isAr ? 'نشر' : 'Post'}
              </button>
              <button onClick={() => setShowNew(false)} className="text-xs text-slate-400 hover:text-white px-3">
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        )}

        {/* Thread List */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-dark-700 rounded-lg animate-pulse" />)}
          </div>
        ) : threads.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">
            {isAr ? 'لا توجد مناقشات بعد. كن أول من يسأل!' : 'No discussions yet. Be the first to ask!'}
          </p>
        ) : (
          <div className="space-y-2">
            {threads.map(t => (
              <button key={t.id} onClick={() => openThread(t)}
                className="w-full text-left p-3 rounded-lg hover:bg-dark-700/50 transition-colors border border-transparent hover:border-dark-600 group">
                <div className="flex items-start gap-3">
                  {/* Vote */}
                  <div className="flex flex-col items-center gap-0.5 mt-0.5"
                    onClick={e => { e.stopPropagation(); toggleVote(t.id); }}>
                    <ChevronUp className={cn('w-4 h-4 cursor-pointer transition-colors',
                      t.my_vote > 0 ? 'text-brand-400' : 'text-slate-600 hover:text-brand-400')} />
                    <span className={cn('text-xs font-medium', t.upvotes > 0 ? 'text-brand-400' : 'text-slate-500')}>
                      {t.upvotes}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {t.is_pinned && <Pin className="w-3 h-3 text-yellow-400" />}
                      {t.is_resolved && <CheckCircle className="w-3 h-3 text-green-400" />}
                      <span className="text-sm font-medium text-white group-hover:text-brand-300 transition-colors truncate">
                        {t.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className={cn(t.author_role === 'admin' ? 'text-brand-400' : '')}>
                        {t.author_name}
                        {t.author_role === 'admin' && ' ⭐'}
                      </span>
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(t.created_at), { addSuffix: true })}</span>
                      {t.lesson_title && <><span>·</span><span className="truncate max-w-[120px]">{t.lesson_title}</span></>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <MessageSquare className="w-3 h-3" /> {t.reply_count}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── Thread Detail View ──────────────────────
  return (
    <div className="card">
      {/* Back button */}
      <button onClick={() => { setActiveThread(null); setReplies([]); }}
        className="flex items-center gap-1 text-sm text-slate-400 hover:text-brand-400 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /> {isAr ? 'العودة للمناقشات' : 'Back to discussions'}
      </button>

      {/* Thread header */}
      <div className="flex items-start gap-3 mb-4 pb-4 border-b border-dark-700">
        <div className="flex flex-col items-center gap-0.5"
          onClick={() => toggleVote(activeThread.id)}>
          <ChevronUp className={cn('w-5 h-5 cursor-pointer transition-colors',
            activeThread.my_vote > 0 ? 'text-brand-400' : 'text-slate-600 hover:text-brand-400')} />
          <span className={cn('text-sm font-bold', activeThread.upvotes > 0 ? 'text-brand-400' : 'text-slate-500')}>
            {activeThread.upvotes}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {activeThread.is_pinned && <span className="badge badge-yellow text-[10px]">📌 Pinned</span>}
            {activeThread.is_resolved && <span className="badge badge-green text-[10px]">✅ Resolved</span>}
          </div>
          <h3 className="text-lg font-semibold text-white">{activeThread.title}</h3>
          <p className="text-slate-300 text-sm mt-2 whitespace-pre-wrap">{activeThread.body}</p>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-3">
            <span className={cn(activeThread.author_role === 'admin' ? 'text-brand-400 font-medium' : '')}>
              {activeThread.author_name}{activeThread.author_role === 'admin' && ' ⭐'}
            </span>
            <span>·</span>
            <span>{formatDistanceToNow(new Date(activeThread.created_at), { addSuffix: true })}</span>
          </div>
        </div>
      </div>

      {/* Replies */}
      <div className="space-y-3 mb-4">
        <h4 className="text-sm font-medium text-slate-400">
          {isAr ? `${replies.length} رد` : `${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
        </h4>
        {replies.map(r => (
          <div key={r.id}
            className={cn('p-3 rounded-lg border',
              r.is_answer ? 'border-green-500/30 bg-green-500/5' : 'border-dark-700 bg-dark-700/30')}>
            <div className="flex items-start gap-2">
              <div className="flex flex-col items-center gap-0.5 mt-0.5"
                onClick={() => toggleVote(undefined, r.id)}>
                <ChevronUp className={cn('w-3.5 h-3.5 cursor-pointer transition-colors',
                  r.my_vote > 0 ? 'text-brand-400' : 'text-slate-600 hover:text-brand-400')} />
                <span className="text-[10px] text-slate-500">{r.upvotes}</span>
              </div>
              <div className="flex-1 min-w-0">
                {r.is_answer && (
                  <div className="flex items-center gap-1 text-green-400 text-xs mb-1">
                    <Award className="w-3 h-3" /> {isAr ? 'إجابة معتمدة' : 'Accepted Answer'}
                  </div>
                )}
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{r.body}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                  <span className={cn(r.author_role === 'admin' ? 'text-brand-400 font-medium' : '')}>
                    {r.author_name}{r.author_role === 'admin' && ' ⭐'}
                  </span>
                  <span>·</span>
                  <span>{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                  {user?.role === 'admin' && !r.is_answer && (
                    <button onClick={() => markAnswer(r.id)}
                      className="text-green-400 hover:text-green-300 flex items-center gap-0.5 ml-2">
                      <CheckCircle className="w-3 h-3" /> {isAr ? 'اعتمد' : 'Accept'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply input */}
      <div className="flex items-start gap-2 pt-3 border-t border-dark-700">
        <textarea value={replyBody} onChange={e => setReplyBody(e.target.value)}
          placeholder={isAr ? 'اكتب ردك هنا...' : 'Write your reply...'}
          rows={2} className="input flex-1 text-sm resize-none" />
        <button onClick={postReply} disabled={submitting || !replyBody.trim()}
          className="btn-primary px-4 py-2.5 flex items-center gap-1">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
