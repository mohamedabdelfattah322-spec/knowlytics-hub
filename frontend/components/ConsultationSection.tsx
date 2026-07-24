'use client';
import { useEffect, useState } from 'react';
import { Calendar, Clock, Briefcase, ChevronDown, ChevronUp, CheckCircle2, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useLanguage } from '@/hooks/useLanguage';

interface ConsultationType {
  id: string; name: string; name_ar: string; type: 'hourly' | 'project';
  price: number; duration_minutes: number; description: string; description_ar: string;
}

interface Props { instructorId: string; instructorName: string; }

export default function ConsultationSection({ instructorId, instructorName }: Props) {
  const { isAr } = useLanguage();
  const [types, setTypes] = useState<ConsultationType[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ConsultationType | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', description: '', preferred_date: '' });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/consultations/instructor/${instructorId}/types`).then(({ data }) => setTypes(data)).catch(() => {});
  }, [instructorId]);

  if (!types.length) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) { setError(isAr ? 'اختر نوع الاستشارة' : 'Select consultation type'); return; }
    if (!form.name || !form.email) { setError(isAr ? 'الاسم والإيميل مطلوبان' : 'Name and email are required'); return; }
    setSending(true); setError('');
    try {
      await api.post('/consultations/book', { ...form, consultation_type_id: selected.id, instructor_id: instructorId });
      setDone(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || (isAr ? 'حدث خطأ' : 'Something went wrong'));
    } finally { setSending(false); }
  };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#162038', border: '1px solid rgba(255,255,255,0.08)' }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(59,130,246,0.15)' }}>
            <Calendar className="w-5 h-5" style={{ color: '#3b82f6' }} />
          </div>
          <div className="text-start">
            <h3 className="font-bold text-base text-white">{isAr ? 'احجز استشارة مع المدرب' : 'Book a Consultation'}</h3>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {isAr ? `تحدث مع ${instructorName} مباشرة` : `Talk directly with ${instructorName}`}
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {open && (
        <div className="px-5 pb-5">
          {done ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-14 h-14 mx-auto mb-3" style={{ color: '#10b981' }} />
              <h4 className="text-lg font-bold text-white mb-1">{isAr ? 'تم إرسال طلبك!' : 'Request Sent!'}</h4>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {isAr ? 'هنتواصل معك قريباً على الإيميل المذكور.' : "We'll contact you soon at the provided email."}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Consultation types */}
              <div>
                <label className="block text-xs font-medium mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {isAr ? 'نوع الاستشارة' : 'Consultation Type'}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {types.map(ct => (
                    <label key={ct.id} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${selected?.id === ct.id ? 'ring-2 ring-blue-500' : ''}`}
                      style={{ backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <input type="radio" name="consultation_type" value={ct.id} checked={selected?.id === ct.id}
                        onChange={() => setSelected(ct)} className="mt-0.5 accent-blue-500" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-white flex items-center gap-1.5">
                            {ct.type === 'hourly' ? <Clock className="w-3.5 h-3.5 text-blue-400" /> : <Briefcase className="w-3.5 h-3.5 text-purple-400" />}
                            {isAr ? (ct.name_ar || ct.name) : ct.name}
                          </span>
                          <span className="font-bold text-sm" style={{ color: '#60a5fa' }}>
                            {ct.price} {isAr ? 'ج.م' : 'EGP'}
                            {ct.type === 'hourly' && <span className="font-normal text-xs ml-1 opacity-60">{isAr ? '/ساعة' : '/hr'}</span>}
                          </span>
                        </div>
                        {(ct.description || ct.description_ar) && (
                          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            {isAr ? (ct.description_ar || ct.description) : ct.description}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {isAr ? 'الاسم *' : 'Name *'}
                  </label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm text-white" required
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    placeholder={isAr ? 'اسمك الكامل' : 'Your full name'} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {isAr ? 'البريد الإلكتروني *' : 'Email *'}
                  </label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm text-white" required
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    placeholder="email@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {isAr ? 'رقم الهاتف' : 'Phone'}
                  </label>
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm text-white"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    placeholder="+20..." />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    {isAr ? 'الشركة / المجال' : 'Company / Field'}
                  </label>
                  <input type="text" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg text-sm text-white"
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    placeholder={isAr ? 'اختياري' : 'Optional'} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {isAr ? 'الموعد المفضل' : 'Preferred Date'}
                </label>
                <input type="datetime-local" value={form.preferred_date} onChange={e => setForm({ ...form, preferred_date: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm text-white"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {isAr ? 'وصف المشكلة / ما تحتاج مساعدة فيه' : 'Describe what you need help with'}
                </label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3} className="w-full px-3 py-2 rounded-lg text-sm text-white resize-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  placeholder={isAr ? 'اكتب تفاصيل احتياجك...' : 'Describe your needs...'} />
              </div>

              {error && <p className="text-red-400 text-xs">{error}</p>}

              <button type="submit" disabled={sending}
                className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform disabled:opacity-50"
                style={{ backgroundColor: '#3b82f6', color: '#fff' }}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                {isAr ? 'إرسال طلب الحجز' : 'Submit Booking Request'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
