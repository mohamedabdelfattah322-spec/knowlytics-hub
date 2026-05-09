'use client';
import { useEffect, useState } from 'react';
import { Package, Plus, Trash2, X, Loader2, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';

interface Bundle {
  id: string; name: string; description: string;
  price: number; duration_days: number; thumbnail_url: string | null;
  is_active: boolean; course_count: number; subscriber_count: number;
}

interface Course { id: string; title: string; }

export default function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Bundle | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: '', description: '', price: '',
    duration_days: '365', thumbnail_url: '',
    course_ids: [] as string[],
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/bundles'),
      api.get('/courses', { params: { admin: 'true', limit: 100 } }),
    ]).then(([b, co]) => {
      setBundles(b.data);
      setCourses(co.data.courses);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', price: '', duration_days: '365', thumbnail_url: '', course_ids: [] });
    setSelectedCourses([]);
    setModal(true);
  };

  const openEdit = async (b: Bundle) => {
    setEditing(b);
    const { data } = await api.get(`/bundles/${b.id}`);
    setForm({
      name: b.name, description: b.description || '',
      price: String(b.price), duration_days: String(b.duration_days),
      thumbnail_url: b.thumbnail_url || '',
      course_ids: data.courses.map((c: any) => c.id),
    });
    setSelectedCourses(data.courses.map((c: any) => c.id));
    setModal(true);
  };

  const save = async () => {
    if (!form.name || !form.price) { toast.error('الاسم والسعر مطلوبين'); return; }
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        duration_days: Number(form.duration_days) || 0,
        course_ids: selectedCourses,
      };
      if (editing) {
        await api.patch(`/bundles/${editing.id}`, payload);
      } else {
        await api.post('/bundles', payload);
      }
      toast.success('✅ تم الحفظ');
      setModal(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'فشل الحفظ');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('حذف الباقة وكل اشتراكاتها؟')) return;
    try {
      await api.delete(`/bundles/${id}`);
      toast.success('تم الحذف');
      load();
    } catch { toast.error('فشل'); }
  };

  const toggleCourseInBundle = (courseId: string) => {
    setSelectedCourses((p) =>
      p.includes(courseId) ? p.filter((x) => x !== courseId) : [...p, courseId]
    );
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-brand-400" /> الباقات (Bundles)
          </h1>
          <p className="text-slate-400 text-sm mt-1">باقات اشتراك تشمل كل أو بعض الكورسات</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> باقة جديدة
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>
      ) : bundles.length === 0 ? (
        <div className="card text-center py-12">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">لا توجد باقات. أنشئ باقة "All Access" لتمنح الطلاب وصول لكل الكورسات بسعر واحد.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bundles.map((b) => (
            <div key={b.id} className={cn('card', !b.is_active && 'opacity-50')}>
              {b.thumbnail_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.thumbnail_url} alt={b.name} className="w-full h-32 object-cover rounded-lg mb-3" />
              )}
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-white">{b.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(b)} className="p-1 text-slate-400 hover:text-brand-400">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(b.id)} className="p-1 text-slate-400 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {b.description && <p className="text-xs text-slate-400 mb-2 line-clamp-2">{b.description}</p>}
              <div className="space-y-1.5 text-sm border-t border-dark-700 pt-3 mt-3">
                <div className="flex justify-between"><span className="text-slate-400">السعر</span>
                  <span className="text-brand-400 font-bold">{formatCurrency(b.price)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">المدة</span>
                  <span className="text-white">{b.duration_days === 0 ? 'مدى الحياة' : `${b.duration_days} يوم`}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">الكورسات</span>
                  <span className="text-white">{b.course_count === 0 ? 'كل الكورسات' : `${b.course_count} كورس`}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">المشتركين</span>
                  <span className="text-white">{b.subscriber_count}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModal(false)}>
          <div className="bg-dark-800 border border-dark-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">{editing ? 'تعديل الباقة' : 'باقة جديدة'}</h2>
              <button onClick={() => setModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">اسم الباقة *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="مثلاً: All Access — Yearly" className="input" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">الوصف</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2} className="input resize-none"
                  placeholder="ادخل وصف الباقة وما تحتويه" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">السعر (جنيه) *</label>
                  <input type="number" min={0} value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">المدة (يوم)</label>
                  <input type="number" min={0} value={form.duration_days}
                    onChange={(e) => setForm({ ...form, duration_days: e.target.value })} className="input"
                    placeholder="365 = سنة، 0 = مدى الحياة" />
                  <p className="text-xs text-slate-500 mt-1">365 = سنة · 30 = شهر · 0 = دائم</p>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">رابط الصورة</label>
                <input type="url" value={form.thumbnail_url}
                  onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} className="input"
                  placeholder="(اختياري)" />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">الكورسات المشمولة</label>
                <p className="text-xs text-slate-500 mb-2">
                  {selectedCourses.length === 0 ? '⚡ لو ما اخترت كورسات، الباقة بتشمل كل الكورسات الحالية والمستقبلية' : `${selectedCourses.length} كورس مختار`}
                </p>
                <div className="border border-dark-600 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
                  {courses.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 p-2 hover:bg-dark-700 rounded cursor-pointer">
                      <input type="checkbox"
                        checked={selectedCourses.includes(c.id)}
                        onChange={() => toggleCourseInBundle(c.id)} />
                      <span className="text-sm text-slate-200 flex-1">{c.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={save} className="btn-primary flex-1">{editing ? 'حفظ التعديلات' : 'إنشاء الباقة'}</button>
                <button onClick={() => setModal(false)} className="btn-secondary">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
