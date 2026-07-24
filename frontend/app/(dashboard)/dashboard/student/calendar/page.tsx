'use client';
import { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Plus, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  event_type: string;
  start_at: string;
  end_at: string | null;
  course_title: string | null;
  is_global: boolean;
}

const EVENT_COLORS: Record<string, string> = {
  live_class: 'bg-blue-500',
  assignment_due: 'bg-red-500',
  quiz_due: 'bg-yellow-500',
  custom: 'bg-brand-500',
};

const EVENT_LABELS: Record<string, string> = {
  live_class: 'حصة لايف',
  assignment_due: 'تسليم واجب',
  quiz_due: 'موعد اختبار',
  custom: 'حدث',
};

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', event_type: 'custom', start_at: '', end_at: '' });

  const fetchEvents = async () => {
    try {
      const start = new Date(month.getFullYear(), month.getMonth(), 1).toISOString();
      const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59).toISOString();
      const { data } = await api.get(`/calendar?start=${start}&end=${end}`);
      setEvents(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchEvents(); }, [month]);

  const addEvent = async () => {
    try {
      await api.post('/calendar', form);
      toast.success('تمت إضافة الحدث');
      setShowForm(false);
      setForm({ title: '', description: '', event_type: 'custom', start_at: '', end_at: '' });
      fetchEvents();
    } catch { toast.error('فشل إضافة الحدث'); }
  };

  const deleteEvent = async (id: string) => {
    try {
      await api.delete(`/calendar/${id}`);
      toast.success('تم الحذف');
      fetchEvents();
    } catch { toast.error('فشل الحذف'); }
  };

  // Calendar grid
  const calendarDays = useMemo(() => {
    const y = month.getFullYear(), m = month.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [month]);

  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    events.forEach(e => {
      const d = new Date(e.start_at).getDate();
      if (!map[d]) map[d] = [];
      map[d].push(e);
    });
    return map;
  }, [events]);

  const today = new Date();
  const isCurrentMonth = month.getMonth() === today.getMonth() && month.getFullYear() === today.getFullYear();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-brand-400" /> التقويم
        </h1>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1 text-sm">
          <Plus className="w-4 h-4" /> إضافة حدث
        </button>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1))}
          className="text-slate-400 hover:text-white"><ChevronRight className="w-5 h-5" /></button>
        <span className="text-white font-medium">
          {month.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1))}
          className="text-slate-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></button>
      </div>

      {/* Calendar grid */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 text-center text-xs text-slate-500 border-b border-dark-700 py-2">
          {['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => (
            <div key={i} className={`min-h-[80px] border border-dark-700 p-1 ${day ? '' : 'bg-dark-800/50'} ${isCurrentMonth && day === today.getDate() ? 'bg-brand-500/10' : ''}`}>
              {day && (
                <>
                  <span className={`text-xs ${isCurrentMonth && day === today.getDate() ? 'text-brand-400 font-bold' : 'text-slate-400'}`}>{day}</span>
                  <div className="space-y-0.5 mt-0.5">
                    {(eventsByDay[day] || []).slice(0, 2).map(e => (
                      <div key={e.id} className={`text-[10px] px-1 py-0.5 rounded text-white truncate cursor-pointer ${EVENT_COLORS[e.event_type] || 'bg-dark-600'}`}
                        title={e.title} onClick={() => deleteEvent(e.id)}>
                        {e.title}
                      </div>
                    ))}
                    {(eventsByDay[day]?.length || 0) > 2 && (
                      <span className="text-[10px] text-slate-500">+{eventsByDay[day].length - 2}</span>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming events */}
      <div className="card">
        <h2 className="text-white font-semibold mb-3">الأحداث القادمة</h2>
        {events.filter(e => new Date(e.start_at) >= new Date()).length === 0 ? (
          <p className="text-slate-500 text-sm">لا توجد أحداث قادمة</p>
        ) : (
          <div className="space-y-2">
            {events.filter(e => new Date(e.start_at) >= new Date()).slice(0, 10).map(e => (
              <div key={e.id} className="flex items-center gap-3 py-2 border-b border-dark-700 last:border-0">
                <div className={`w-2 h-2 rounded-full ${EVENT_COLORS[e.event_type] || 'bg-dark-600'}`} />
                <div className="flex-1">
                  <p className="text-white text-sm">{e.title}</p>
                  <p className="text-slate-500 text-xs">{EVENT_LABELS[e.event_type]} • {new Date(e.start_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <button onClick={() => deleteEvent(e.id)} className="text-slate-500 hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add event modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="card w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-semibold mb-4">إضافة حدث جديد</h3>
            <div className="space-y-3">
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="عنوان الحدث" className="input w-full" />
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="الوصف (اختياري)" className="input w-full" rows={2} />
              <select value={form.event_type} onChange={e => setForm({ ...form, event_type: e.target.value })}
                className="input w-full">
                <option value="custom">حدث عام</option>
                <option value="live_class">حصة لايف</option>
                <option value="assignment_due">تسليم واجب</option>
                <option value="quiz_due">موعد اختبار</option>
              </select>
              <input type="datetime-local" value={form.start_at} onChange={e => setForm({ ...form, start_at: e.target.value })}
                className="input w-full" />
              <div className="flex gap-2">
                <button onClick={addEvent} disabled={!form.title || !form.start_at} className="btn-primary flex-1">
                  إضافة
                </button>
                <button onClick={() => setShowForm(false)} className="btn-outline flex-1">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
