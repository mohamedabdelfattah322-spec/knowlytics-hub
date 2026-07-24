'use client';
import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Clock, Briefcase, Loader2, X, Save, Calendar, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface ConsultationType {
  id: string; instructor_id: string; instructor_name: string;
  name: string; name_ar: string; type: 'hourly' | 'project';
  price: number; duration_minutes: number; description: string; description_ar: string; is_active: boolean;
}
interface Booking {
  id: string; name: string; email: string; phone: string; company: string;
  description: string; status: string; preferred_date: string; created_at: string;
  type_name: string; consultation_type: string; price: number; instructor_name: string; notes: string;
}

const EMPTY_TYPE = { instructor_id: '', name: '', name_ar: '', type: 'hourly' as const, price: 0, duration_minutes: 60, description: '', description_ar: '', is_active: true };

export default function AdminConsultationsPage() {
  const [tab, setTab] = useState<'types' | 'bookings'>('bookings');
  const [types, setTypes] = useState<ConsultationType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [instructors, setInstructors] = useState<{id:string;name:string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<ConsultationType> | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    api.get('/instructors').then(({ data }) => setInstructors(data)).catch(() => {});
    loadAll();
  }, []);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/consultations/types'),
      api.get('/consultations/bookings'),
    ]).then(([t, b]) => { setTypes(t.data); setBookings(b.data); }).finally(() => setLoading(false));
  };

  const handleSaveType = async () => {
    if (!editing?.name || !editing.instructor_id) { toast.error('الاسم والمدرب مطلوبان'); return; }
    setSaving(true);
    try {
      if (editing.id) await api.put(`/consultations/types/${editing.id}`, editing);
      else await api.post('/consultations/types', editing);
      toast.success('تم الحفظ'); setEditing(null); loadAll();
    } catch { toast.error('حدث خطأ'); } finally { setSaving(false); }
  };

  const deleteType = async (id: string) => {
    if (!confirm('حذف نوع الاستشارة؟')) return;
    await api.delete(`/consultations/types/${id}`);
    toast.success('تم الحذف'); loadAll();
  };

  const updateBookingStatus = async (id: string, status: string, notes?: string) => {
    await api.put(`/consultations/bookings/${id}`, { status, notes });
    toast.success('تم التحديث'); loadAll(); setSelectedBooking(null);
  };

  const statusColor: Record<string, string> = {
    pending: 'text-yellow-400 bg-yellow-400/10',
    confirmed: 'text-blue-400 bg-blue-400/10',
    completed: 'text-green-400 bg-green-400/10',
    cancelled: 'text-red-400 bg-red-400/10',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">الاستشارات</h1>
          <p className="text-sm text-slate-400">إدارة أنواع الاستشارات والحجوزات</p>
        </div>
        {tab === 'types' && (
          <button onClick={() => setEditing({ ...EMPTY_TYPE })} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> إضافة نوع
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['bookings', 'types'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white hover:bg-dark-700'}`}>
            {t === 'bookings' ? `الحجوزات (${bookings.length})` : 'أنواع الاستشارات'}
          </button>
        ))}
      </div>

      {/* Type Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-dark-800 rounded-2xl w-full max-w-lg p-6 border border-dark-700">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">{editing.id ? 'تعديل نوع' : 'إضافة نوع استشارة'}</h2>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">المدرب *</label>
                <select className="input" value={editing.instructor_id || ''} onChange={e => setEditing({ ...editing, instructor_id: e.target.value })}>
                  <option value="">اختر مدرب</option>
                  {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">الاسم (EN) *</label>
                  <input className="input" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Hourly Consultation" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">الاسم (AR)</label>
                  <input className="input" value={editing.name_ar || ''} onChange={e => setEditing({ ...editing, name_ar: e.target.value })} placeholder="استشارة بالساعة" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">النوع</label>
                  <select className="input" value={editing.type || 'hourly'} onChange={e => setEditing({ ...editing, type: e.target.value as any })}>
                    <option value="hourly">بالساعة</option>
                    <option value="project">بحجم العمل</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">السعر (EGP)</label>
                  <input className="input" type="number" value={editing.price || 0} onChange={e => setEditing({ ...editing, price: parseFloat(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">المدة (دقيقة)</label>
                  <input className="input" type="number" value={editing.duration_minutes || 60} onChange={e => setEditing({ ...editing, duration_minutes: parseInt(e.target.value) })} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">الوصف (AR)</label>
                <textarea className="input resize-none" rows={2} value={editing.description_ar || ''} onChange={e => setEditing({ ...editing, description_ar: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setEditing(null)} className="btn-secondary">إلغاء</button>
                <button onClick={handleSaveType} disabled={saving} className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" />{saving ? 'جارِ الحفظ...' : 'حفظ'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div>
      ) : tab === 'types' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map(ct => (
            <div key={ct.id} className="card hover:border-brand-500/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {ct.type === 'hourly' ? <Clock className="w-4 h-4 text-blue-400" /> : <Briefcase className="w-4 h-4 text-purple-400" />}
                  <span className="font-bold text-white text-sm">{ct.name_ar || ct.name}</span>
                </div>
                <span className="text-sm font-bold text-brand-400">{ct.price} ج.م{ct.type === 'hourly' ? '/س' : ''}</span>
              </div>
              <p className="text-xs text-slate-400 mb-3">{ct.instructor_name}</p>
              <div className="flex gap-2 pt-3 border-t border-dark-700">
                <button onClick={() => setEditing(ct)} className="btn-secondary text-xs flex-1 flex items-center justify-center gap-1">
                  <Edit2 className="w-3 h-3" /> تعديل
                </button>
                <button onClick={() => deleteType(ct.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <div className="card text-center py-12">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">لا توجد حجوزات بعد</p>
            </div>
          ) : bookings.map(b => (
            <div key={b.id} className="card hover:border-brand-500/30 transition-colors cursor-pointer" onClick={() => setSelectedBooking(b)}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{b.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[b.status] || ''}`}>{b.status}</span>
                  </div>
                  <p className="text-xs text-slate-400">{b.email} · {b.phone}</p>
                  <p className="text-xs text-slate-500 mt-1">{b.type_name} — {b.instructor_name} — {b.price} ج.م</p>
                  {b.description && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{b.description}</p>}
                </div>
                <div className="text-right text-xs text-slate-500">
                  {new Date(b.created_at).toLocaleDateString('ar-EG')}
                  {b.preferred_date && <p className="mt-0.5 text-blue-400">{new Date(b.preferred_date).toLocaleDateString('ar-EG')}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-dark-800 rounded-2xl w-full max-w-lg p-6 border border-dark-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">تفاصيل الحجز</h2>
              <button onClick={() => setSelectedBooking(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ['الاسم', selectedBooking.name], ['الإيميل', selectedBooking.email],
                ['الهاتف', selectedBooking.phone], ['الشركة', selectedBooking.company],
                ['نوع الاستشارة', selectedBooking.type_name], ['المدرب', selectedBooking.instructor_name],
                ['السعر', `${selectedBooking.price} ج.م`],
                ['الموعد المفضل', selectedBooking.preferred_date ? new Date(selectedBooking.preferred_date).toLocaleString('ar-EG') : '-'],
              ].map(([k, v]) => v && (
                <div key={k} className="flex gap-2"><span className="text-slate-400 w-28 shrink-0">{k}:</span><span className="text-white">{v}</span></div>
              ))}
              {selectedBooking.description && (
                <div><p className="text-slate-400 mb-1">الوصف:</p><p className="text-white bg-dark-700 rounded-lg p-3 text-xs">{selectedBooking.description}</p></div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              {selectedBooking.status === 'pending' && (
                <button onClick={() => updateBookingStatus(selectedBooking.id, 'confirmed')}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4" /> تأكيد
                </button>
              )}
              {selectedBooking.status === 'confirmed' && (
                <button onClick={() => updateBookingStatus(selectedBooking.id, 'completed')}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4" /> مكتملة
                </button>
              )}
              {!['cancelled', 'completed'].includes(selectedBooking.status) && (
                <button onClick={() => updateBookingStatus(selectedBooking.id, 'cancelled')}
                  className="flex-1 flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                  <XCircle className="w-4 h-4" /> إلغاء
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
