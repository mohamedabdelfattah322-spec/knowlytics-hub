'use client';
import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Trash2, Crown } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_name: string;
  user_role: string;
}

export default function BatchChat({ batchId }: { batchId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const lastIdRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async (initial = false) => {
    try {
      const params = initial ? {} : { since: messages[messages.length - 1]?.created_at };
      const { data } = await api.get(`/batches/${batchId}/messages`, { params });
      if (initial) {
        setMessages(data);
      } else if (data.length > 0) {
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id));
          const fresh = data.filter((m: Message) => !seen.has(m.id));
          return [...prev, ...fresh];
        });
      }
    } catch {} finally { if (initial) setLoading(false); }
  };

  // Initial load + polling
  useEffect(() => {
    fetchMessages(true);
    const t = setInterval(() => fetchMessages(false), 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  // Auto-scroll on new message
  useEffect(() => {
    const lastMsgId = messages[messages.length - 1]?.id;
    if (lastMsgId && lastMsgId !== lastIdRef.current) {
      containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
      lastIdRef.current = lastMsgId;
    }
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const { data } = await api.post(`/batches/${batchId}/messages`, { content: text });
      setMessages((prev) => [...prev, data]);
      setInput('');
    } catch {} finally { setSending(false); }
  };

  const deleteMsg = async (id: string) => {
    try {
      await api.delete(`/batches/${batchId}/messages/${id}`);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch {}
  };

  return (
    <div className="card flex flex-col" style={{ height: '600px' }}>
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-dark-700">
        <h3 className="font-semibold text-white">💬 شات الدفعة</h3>
        <span className="text-xs text-slate-500">{messages.length} رسالة</span>
      </div>

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-brand-400" /></div>
        ) : messages.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8">لا توجد رسائل بعد. ابدأ المحادثة!</div>
        ) : (
          messages.map((m) => {
            const mine = m.user_id === user?.id;
            const isAdmin = m.user_role === 'admin';
            return (
              <div key={m.id} className={cn('flex gap-2 group', mine ? 'flex-row-reverse' : '')}>
                <div className={cn('w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold',
                  isAdmin ? 'bg-purple-500/20 text-purple-400' : 'bg-brand-500/20 text-brand-400'
                )}>
                  {m.user_name.charAt(0).toUpperCase()}
                </div>
                <div className={cn('max-w-[75%] flex flex-col gap-0.5', mine ? 'items-end' : 'items-start')}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-300">{m.user_name}</span>
                    {isAdmin && <Crown className="w-3 h-3 text-purple-400" />}
                    <span className="text-[10px] text-slate-500">{new Date(m.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className={cn('rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words',
                    mine ? 'bg-brand-500/20 text-brand-100 border border-brand-500/30'
                         : 'bg-dark-700 text-slate-200'
                  )}>
                    {m.content}
                  </div>
                </div>
                {(mine || user?.role === 'admin') && (
                  <button onClick={() => deleteMsg(m.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-red-400 self-end">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="pt-3 mt-3 border-t border-dark-700 flex gap-2">
        <input
          type="text" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
          placeholder="اكتب رسالتك..."
          className="input flex-1"
          maxLength={2000}
        />
        <button onClick={sendMessage} disabled={!input.trim() || sending} className="btn-primary px-4 flex items-center gap-2">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
