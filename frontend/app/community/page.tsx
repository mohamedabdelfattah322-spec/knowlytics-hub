'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heart, MessageCircle, Send, Loader2, Trash2, Pin,
  Image as ImageIcon, X, Users
} from 'lucide-react';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import api from '@/lib/api';
import Link from 'next/link';

interface Post {
  id: string; content: string; image_url: string | null;
  likes_count: number; comments_count: number; is_pinned: boolean;
  user_name: string; avatar_url: string | null; created_at: string;
  liked_by_me: boolean; user_id: string;
}
interface Comment {
  id: string; content: string; user_name: string; avatar_url: string | null; created_at: string; user_id: string;
}

function Avatar({ name, src, size = 9 }: { name: string; src?: string | null; size?: number }) {
  if (src) return <img src={src} alt={name} className={`w-${size} h-${size} rounded-full object-cover shrink-0`} />;
  return (
    <div className={`w-${size} h-${size} rounded-full flex items-center justify-center text-sm font-bold shrink-0`}
         style={{ backgroundColor: 'rgba(59,130,246,0.2)', color: '#60a5fa' }}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

function timeAgo(dateStr: string, isAr: boolean) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return isAr ? 'الآن' : 'just now';
  if (diff < 3600) return isAr ? `${Math.floor(diff / 60)} د` : `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return isAr ? `${Math.floor(diff / 3600)} س` : `${Math.floor(diff / 3600)}h`;
  return isAr ? `${Math.floor(diff / 86400)} ي` : `${Math.floor(diff / 86400)}d`;
}

function PostCard({ post, currentUser, isAr, onLike, onDelete, onPin, onComment }: any) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [sending, setSending] = useState(false);

  const loadComments = async () => {
    if (showComments) { setShowComments(false); return; }
    setLoadingComments(true);
    try {
      const { data } = await api.get(`/community/posts/${post.id}/comments`);
      setComments(data);
    } finally { setLoadingComments(false); }
    setShowComments(true);
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/community/posts/${post.id}/comments`, { content: commentText });
      setComments(prev => [...prev, data]);
      setCommentText('');
      onComment(post.id);
    } finally { setSending(false); }
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#162038', border: `1px solid ${post.is_pinned ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}` }}>
      {post.is_pinned && (
        <div className="px-5 py-2 flex items-center gap-1.5 text-xs font-medium" style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#60a5fa' }}>
          <Pin className="w-3 h-3" /> {isAr ? 'منشور مثبّت' : 'Pinned post'}
        </div>
      )}
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <Avatar name={post.user_name} src={post.avatar_url} />
            <div>
              <p className="font-semibold text-sm text-white">{post.user_name}</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{timeAgo(post.created_at, isAr)}</p>
            </div>
          </div>
          <div className="flex gap-1">
            {currentUser?.role === 'admin' && (
              <button onClick={() => onPin(post.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-blue-400">
                <Pin className="w-4 h-4" />
              </button>
            )}
            {(currentUser?.user_id === post.user_id || currentUser?.role === 'admin') && (
              <button onClick={() => onDelete(post.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.85)' }}>{post.content}</p>
        {post.image_url && (
          <img src={post.image_url} alt="" className="w-full rounded-xl mb-4 max-h-96 object-cover" />
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button onClick={() => onLike(post.id)}
            className="flex items-center gap-1.5 text-sm transition-colors hover:scale-105"
            style={{ color: post.liked_by_me ? '#f43f5e' : 'rgba(255,255,255,0.4)' }}>
            <Heart className={`w-4 h-4 ${post.liked_by_me ? 'fill-current' : ''}`} />
            <span>{post.likes_count}</span>
          </button>
          <button onClick={loadComments}
            className="flex items-center gap-1.5 text-sm transition-colors hover:text-white"
            style={{ color: 'rgba(255,255,255,0.4)' }}>
            <MessageCircle className="w-4 h-4" />
            <span>{post.comments_count}</span>
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="mt-4 space-y-3">
            {loadingComments ? <Loader2 className="w-4 h-4 animate-spin mx-auto text-slate-500" /> : (
              <>
                {comments.map(c => (
                  <div key={c.id} className="flex gap-2.5">
                    <Avatar name={c.user_name} src={c.avatar_url} size={7} />
                    <div className="flex-1 rounded-xl p-2.5" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
                      <p className="text-xs font-semibold text-white mb-0.5">{c.user_name}</p>
                      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{c.content}</p>
                    </div>
                  </div>
                ))}
                <form onSubmit={submitComment} className="flex gap-2 mt-2">
                  <input type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
                    placeholder={isAr ? 'اكتب تعليقاً...' : 'Write a comment...'}
                    className="flex-1 px-3 py-2 rounded-xl text-xs text-white"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                  <button type="submit" disabled={sending || !commentText.trim()}
                    className="px-3 py-2 rounded-xl disabled:opacity-50"
                    style={{ backgroundColor: '#3b82f6' }}>
                    {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Send className="w-3.5 h-3.5 text-white" />}
                  </button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const { isAr, dir } = useLanguage();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login?redirect=/community'); return; }
    api.get('/community/posts').then(({ data }) => setPosts(data)).finally(() => setLoading(false));
  }, [user]);

  const submitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      const { data } = await api.post('/community/posts', { content: newPost.trim() });
      setPosts(prev => [data, ...prev]);
      setNewPost('');
    } finally { setPosting(false); }
  };

  const handleLike = async (postId: string) => {
    try {
      const { data } = await api.post(`/community/posts/${postId}/like`);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked_by_me: data.liked, likes_count: data.liked ? p.likes_count + 1 : p.likes_count - 1 } : p));
    } catch {}
  };

  const handleDelete = async (postId: string) => {
    if (!confirm(isAr ? 'حذف المنشور؟' : 'Delete post?')) return;
    await api.delete(`/community/posts/${postId}`);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handlePin = async (postId: string) => {
    await api.put(`/community/posts/${postId}/pin`);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_pinned: !p.is_pinned } : p).sort((a, b) => +b.is_pinned - +a.is_pinned));
  };

  const handleComment = (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen" dir={dir} style={{ backgroundColor: '#0a1628' }}>
      <PublicNavbar />

      {/* Header */}
      <section className="py-10 text-center" style={{ backgroundColor: '#0f1d32' }}>
        <div className="max-w-2xl mx-auto px-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(59,130,246,0.15)' }}>
            <Users className="w-7 h-7" style={{ color: '#3b82f6' }} />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">
            {isAr ? 'مجتمع المتدربين' : 'Trainees Community'}
          </h1>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {isAr ? 'شارك، اتعلم، وتواصل مع زملائك' : 'Share, learn, and connect with your peers'}
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* New post */}
        <form onSubmit={submitPost} className="rounded-2xl p-5" style={{ backgroundColor: '#162038', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex gap-3 mb-3">
            <Avatar name={user.name || '?'} size={9} />
            <textarea value={newPost} onChange={e => setNewPost(e.target.value)}
              rows={3} placeholder={isAr ? 'شارك فكرة، سؤال، أو إنجاز...' : 'Share an idea, question, or achievement...'}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white resize-none"
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={posting || !newPost.trim()}
              className="px-5 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 disabled:opacity-50 hover:scale-[1.02] transition-transform"
              style={{ backgroundColor: '#3b82f6', color: '#fff' }}>
              {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isAr ? 'نشر' : 'Post'}
            </button>
          </div>
        </form>

        {/* Posts feed */}
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3b82f6' }} /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>{isAr ? 'لا توجد منشورات بعد. كن أول من يشارك!' : 'No posts yet. Be the first to share!'}</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} currentUser={user} isAr={isAr}
              onLike={handleLike} onDelete={handleDelete} onPin={handlePin} onComment={handleComment} />
          ))
        )}
      </div>

      <PublicFooter />
    </div>
  );
}
