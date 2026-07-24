'use client';
import { useEffect, useState } from 'react';
import { Mail, Send, History, Loader2, Users, ChevronDown, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface BroadcastRecord {
  id: string;
  subject: string;
  audience: string;
  sent_count: number;
  admin_name: string;
  created_at: string;
}

interface Course { id: string; title: string; }

const audienceLabel = (a: string) => {
  if (a === 'all') return 'كل الطلاب';
  if (a === 'live') return 'طلاب Live';
  if (a === 'online') return 'طلاب Online';
  if (a.startsWith('enrolled:')) return 'مسجلين في كورس';
  return a;
};

export default function NewsletterPage() {
  const [tab, setTab] = useState<'compose' | 'history'>('compose');
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [audience, setAudience] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [sendNotif, setSendNotif] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [history, setHistory] = useState<BroadcastRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<{ sent: number; total: number } | null>(null);

  useEffect(() => {
    api.get('/courses', { params: { admin: 'true', limit: 100 } }).then(({ data }) => setCourses(data.courses || [])).catch(() => {});
  }, []);

  const loadHistory = async () => {
    const { data } = await api.get('/admin/broadcasts');
    setHistory(data);
  };

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab]);

  const buildPreview = () => {
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  body { font-family: 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 20px; }
  .card { background: #1e293b; border-radius: 12px; max-width: 600px; margin: 0 auto; padding: 40px; }
  .logo { color: #6366f1; font-size: 24px; font-weight: 700; margin-bottom: 24px; }
  h2 { color: #f8fafc; margin-top: 0; }
  p { line-height: 1.6; color: #94a3b8; }
  .btn { display: inline-block; background: #6366f1; color: #fff; text-decoration: none;
         padding: 12px 28px; border-radius: 8px; font-weight: 600; margin: 16px 0; }
  .footer { margin-top: 32px; font-size: 12px; color: #475569; text-align: center; }
</style>
</head><body><div class="card">
  <div class="logo">🎓 Knowlytics Hub</div>
  ${bodyHtml}
  <div class="footer">© ${new Date().getFullYear()} Knowlytics Hub.</div>
</div></body></html>`;
  };

  const send = async () => {
    if (!subject.trim() || !bodyHtml.trim()) {
      toast.error('الموضوع والمحتوى مطلوبان');
      return;
    }
    const finalAudience = audience === 'enrolled' ? `enrolled:${selectedCourse}` : audience;
    if (audience === 'enrolled' && !selectedCourse) {
      toast.error('اختر كورساً لإرسال لمشتركيه');
      return;
    }
    setLoading(true);
    setSent(null);
    try {
      const { data } = await api.post('/admin/broadcast', {
        subject: subject.trim(),
        body_html: bodyHtml.trim(),
        audience: finalAudience,
        send_notification: sendNotif,
      });
      setSent(data);
      toast.success(`✅ تم الإرسال لـ ${data.sent} مشترك`);
      setSubject('');
      setBodyHtml('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'فشل الإرسال');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Mail className="w-6 h-6 text-brand-400" /> النشرة البريدية
        </h1>
        <p className="text-slate-400 text-sm mt-1">أرسل إيميل جماعي لطلابك أو أشعارات داخلية</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-dark-700 gap-6">
        {[{ id: 'compose', label: '✉️ إنشاء رسالة' }, { id: 'history', label: '📋 السجل' }].map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id as any)}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              tab === id ? 'text-brand-400 border-brand-400' : 'text-slate-400 border-transparent hover:text-white'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'compose' ? (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Compose Form */}
          <div className="space-y-4">
            <div className="card space-y-4">
              {/* Audience */}
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">الجمهور المستهدف</label>
                <select value={audience} onChange={(e) => setAudience(e.target.value)} className="input">
                  <option value="all">كل الطلاب</option>
                  <option value="live">طلاب Live فقط</option>
                  <option value="online">طلاب Online فقط</option>
                  <option value="enrolled">مسجلين في كورس محدد</option>
                </select>
                {audience === 'enrolled' && (
                  <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="input mt-2">
                    <option value="">— اختر الكورس —</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">موضوع الإيميل *</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)}
                  placeholder="مثلاً: إعلان هام — كورس جديد 🎉" className="input" />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm text-slate-300 mb-1.5">محتوى الرسالة (HTML) *</label>
                <textarea value={bodyHtml} onChange={(e) => setBodyHtml(e.target.value)}
                  rows={10} className="input resize-y font-mono text-xs"
                  placeholder={`<h2>عنوان الرسالة</h2>\n<p>مرحباً بكم،</p>\n<p>...</p>\n<a href="https://..." class="btn">اضغط هنا</a>`} />
                <p className="text-xs text-slate-500 mt-1">يمكنك استخدام HTML. Class: <code className="bg-dark-700 px-1 rounded">btn</code> للأزرار</p>
              </div>

              {/* In-app notification toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div className={`relative w-10 h-5 rounded-full transition-colors ${sendNotif ? 'bg-brand-500' : 'bg-dark-600'}`}
                  onClick={() => setSendNotif(!sendNotif)}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${sendNotif ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-slate-300">أضف إشعاراً داخلياً أيضاً</span>
              </label>

              <button onClick={send} disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                إرسال الرسالة
              </button>

              {sent && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                  <div>
                    <p className="text-green-400 font-semibold">تم الإرسال بنجاح!</p>
                    <p className="text-sm text-slate-300">أُرسل لـ <strong>{sent.sent}</strong> من أصل <strong>{sent.total}</strong> مشترك</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Preview */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-slate-300">معاينة الإيميل</p>
              <span className="text-xs text-slate-500">مباشر</span>
            </div>
            <div className="border border-dark-600 rounded-xl overflow-hidden bg-[#0f172a]" style={{ height: '460px' }}>
              <iframe
                srcDoc={buildPreview()}
                className="w-full h-full"
                title="Email Preview"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        </div>
      ) : (
        /* History */
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="card text-center py-12">
              <History className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">لا توجد رسائل مرسلة بعد</p>
            </div>
          ) : (
            history.map((h) => (
              <div key={h.id} className="card">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-white">{h.subject}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {audienceLabel(h.audience)}
                      </span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-500">{h.sent_count} مُرسل</span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-500">بواسطة {h.admin_name}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">
                    {new Date(h.created_at).toLocaleDateString('ar-EG', { dateStyle: 'short' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
