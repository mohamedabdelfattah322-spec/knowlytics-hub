'use client';
import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Loader2, Sparkles, Minimize2 } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  courseId?: string;
  lessonId?: string;
}

export default function AIChatbot({ courseId, lessonId }: Props) {
  const { isAr } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', {
        message: userMsg,
        course_id: courseId,
        lesson_id: lessonId,
        history: messages.slice(-8),
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || (isAr ? 'خطأ في الاتصال بالذكاء الاصطناعي' : 'AI service error');
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}` }]);
    } finally { setLoading(false); }
  };

  // Floating button
  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="fixed bottom-20 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 text-white shadow-lg shadow-brand-500/30 flex items-center justify-center hover:scale-110 transition-transform">
        <Bot className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-dark-800 border border-dark-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-brand-500 to-purple-600 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <div>
            <p className="font-semibold text-sm">
              {isAr ? 'المساعد الذكي' : 'AI Assistant'}
            </p>
            <p className="text-[10px] opacity-80">Powered by AI</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="hover:bg-white/20 rounded-lg p-1 transition-colors">
          <Minimize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-10 h-10 text-brand-400 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              {isAr ? 'مرحباً! أنا مساعدك الذكي. اسألني أي سؤال عن محتوى الكورس.' : 'Hi! I\'m your AI assistant. Ask me anything about the course content.'}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-4 justify-center">
              {(isAr
                ? ['اشرحلي الدرس ده', 'لخص المحتوى', 'أنا مش فاهم...']
                : ['Explain this lesson', 'Summarize content', 'I don\'t understand...']
              ).map(s => (
                <button key={s} onClick={() => { setInput(s); }}
                  className="text-[11px] px-2.5 py-1 bg-dark-700 text-slate-400 rounded-full hover:bg-dark-600 hover:text-white transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn('max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm',
              msg.role === 'user'
                ? 'bg-brand-500 text-white rounded-br-sm'
                : 'bg-dark-700 text-slate-200 rounded-bl-sm')}>
              <div className="whitespace-pre-wrap break-words">{msg.content}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-dark-700 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-dark-700">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={isAr ? 'اكتب سؤالك هنا...' : 'Type your question...'}
            className="flex-1 bg-dark-700 border border-dark-600 text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder-slate-500"
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white flex items-center justify-center transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
