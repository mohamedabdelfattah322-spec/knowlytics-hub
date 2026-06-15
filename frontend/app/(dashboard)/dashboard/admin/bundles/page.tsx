'use client';
import { useEffect, useState } from 'react';
import { Package, Plus, Trash2, X, Loader2, Edit2, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';

interface Bundle {
  id: string; name: string; description: string;
  price: number; original_price: number | null; duration_days: number;
  thumbnail_url: string | null; is_active: boolean;
  course_count: number; subscriber_count: number;
}

interface Course { id: string; title: string; }

const DURATION_OPTIONS = [
  { label: 'شهر (30 يوم)', value: '30' },
  { label: '٣ شهور (90 يوم)', value: '90' },
  { label: 'سنة (365 يوم)', value: '365' },
  { label: 'مدى الحياة', value: '0' },
  { label: 'مخصص', value: 'custom' },
];

export default function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Bundle | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [durationMode, setDurationMode] = useState<string>('365');

  const [form, setForm] = useState({
    name: '', description: '', price: '', original_price: '',
    duration_days: '365', thumbnail_url: '', course_ids: [] as string[],
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
    setForm({ name: '', description: '', price: '', original_price: '', duration_days: '365', thumbnail_url: '', course_ids: [] });
    setSelectedCourses([]);
    setDurationMode('365');
    setModal(true);
  };

  const openEdit = async (b: Bundle) => {
    setEditing(b);
    const { data } = await api.get(`/bundles/${b.id}`);
    const days = String(b.duration_days);
    const knownMode = DURATION_OPTIONS.find(o => o.value === days && o.value !== 'custom');
    setDurationMode(knownMode ? days : (days === '0' ? '0' : 'custom'));
    setForm({
      name: b.name, description: b.description || '',
      price: String(b.price),
      original_price: b.original_price ? String(b.original_price) : '',
      duration_days: days,
      thumbnail_url: b.thumbnail_url || '',
      course_ids: data.courses.map((c: any) => c.id),
    });
    setSelectedCourses(data.courses.map((c: any) => c.id));
    setModal(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('image_only', 'true');
      fd.append('title', file.name);
      const { data } = await api.post('/files/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const baseHost = apiBase.replace(/\/api\/?$/, '');
      const url = data.file.public_url || `${baseHost}/uploads/${data.file.file_key}`;
      setForm(f => ({ ...f, thumbnail_url: url }));
      toast.success('✅ تم رفع الصورة');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'فشل رفع الصورة');
    } finally { setUploading(false); }
  };

  const handleDurationMode = (val: string) => {
    setDurationMode(val);
    if (val !== 'custom') setForm(f => ({ ...f, duration_days: val }));
  };

  const discountPct = (() => {
    const orig = parseFloat(form.original_price);
    const final = parseFloat(form.price);
    if (orig > 0 && final >= 0 && orig > final) {
      return Math.round((orig - final) / orig * 100);
    }
    return null;
  })();

  const save = async () => {
    if (!form.name || !form.price) { toast.error('الاسم والسعر مطلوبين'); return; }
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        original_price: form.original_price ? Number(form.original_price) : null,
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
    setSelectedCourses(p => p.includes(courseId) ? p.filter(x => x !== courseId) : [...p, courseId]);
  };

  const bundleDiscountPct = (b: Bundle) => {
    if (b.original_price && b.original_price > b.price) {
      return Math.round((b.original_price - b.price) / b.original_price * 100);
    }
    return null;
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
          {bundles.map((b) => {
            const pct = bundleDiscountPct(b);
            return (
              <div key={b.id} className={cn('card', !b.is_active && 'opacity-50')}>
                {b.thumbnail_url && (
                  <div className="relative mb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.thumbnail_url} alt={b.name} className="w-full h-36 object-cover rounded-lg" />
                    {pct && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        خصم {pct}%
                      </span>
                    )}
                  </div>
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
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">السعر</span>
                    <div className="flex items-center gap-2">
                      {b.original_price && b.original_price > b.price && (
                        <span className="text-slate-500 line-through text-xs">{formatCurrency(b.original_price)}</span>
                      )}
                      <span className="text-brand-400 font-bold">{formatCurrency(b.price)}</span>
                      {pct && <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">-{pct}%</span>}
                    </div>
                  </div>
                  <div className="flex justify-between"><span className="text-slate-400">المدة</span>
                    <span className="text-white">{b.duration_days === 0 ? '♾️ مدى الحياة' : `${b.duration_days} يوم`}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">الكورسات</span>
                    <span className="text-white">{b.course_count === 0 ? 'كل الكورسات' : `${b.course_count} كورس`}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">المشتركين</span>
                    <span className="text-white">{b.subscriber_count}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModal(false)}>
          <div className="bg-dark-800 border border-dark-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">{editing ? 'تعديل الباقة' : 'باقة جديدة'}</h2>
              <button onClick={() => setModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm text-slate-300 mb-1">اسم الباقة *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="مثلاً: باقة تحليل البيانات الشاملة" className="input" />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-slate-300 mb-1">الوصف</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2} className="input resize-none" placeholder="ادخل وصف الباقة وما تحتويه" />
              </div>

              {/* Price section */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">السعر قبل الخصم (جنيه)</label>
                  <input type="number" min={0} value={form.original_price}
                    onChange={e => setForm({ ...form, original_price: e.target.value })}
                    className="input" placeholder="اختياري" />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-1">السعر النهائي (جنيه) *</label>
                  <input type="number" min={0} value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="input" />
                </div>
              </div>
              {discountPct !== null && (
                <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                  <span className="text-green-400 font-bold text-sm">🎉 خصم {discountPct}%</span>
                  <span className="text-slate-400 text-xs">— توفير {formatCurrency(Number(form.original_price) - Number(form.price))}</span>
                </div>
              )}

              {/* Duration */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">مدة الاشتراك</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {DURATION_OPTIONS.map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => handleDurationMode(opt.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                        durationMode === opt.value
                          ? 'bg-brand-500 text-white'
                          : 'bg-dark-700 text-slate-300 hover:bg-dark-600'
                      )}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {durationMode === 'custom' && (
                  <input type="number" min={1} value={form.duration_days}
                    onChange={e => setForm({ ...form, duration_days: e.target.value })}
                    className="input" placeholder="أدخل عدد الأيام" />
                )}
                {durationMode === '0' && (
                  <p className="text-xs text-amber-400 mt-1">♾️ الطالب يحتفظ بالباقة للأبد بدون انتهاء</p>
                )}
              </div>

              {/* Thumbnail upload */}
              <div>
                <label className="block text-sm text-slate-300 mb-2">صورة الباقة</label>
                {form.thumbnail_url && (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden mb-2 bg-dark-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.thumbnail_url} alt="thumbnail" className="w-full h-full object-cover" />
                    <button onClick={() => setForm(f => ({ ...f, thumbnail_url: '' }))}
                      className="absolute top-2 right-2 p-1 bg-red-500/90 hover:bg-red-600 rounded-lg text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input type="url" value={form.thumbnail_url}
                    onChange={e => setForm({ ...form, thumbnail_url: e.target.value })}
                    className="input flex-1" placeholder="رابط الصورة (أو ارفع من الجهاز ←)" />
                  <label className={cn('btn-secondary cursor-pointer flex items-center gap-2 whitespace-nowrap', uploading && 'opacity-60 pointer-events-none')}>
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {uploading ? 'جارِ الرفع...' : 'رفع صورة'}
                    <input type="file" accept="image/*" className="sr-only"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ''; }} />
                  </label>
                </div>
              </div>

              {/* Courses */}
              <div>
                <label className="block text-sm text-slate-300 mb-1">الكورسات المشمولة</label>
                <p className="text-xs text-slate-500 mb-2">
                  {selectedCourses.length === 0
                    ? '⚡ لو ما اخترت كورسات، الباقة بتشمل كل الكورسات الحالية والمستقبلية'
                    : `${selectedCourses.length} كورس مختار`}
                </p>
                <div className="border border-dark-600 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
                  {courses.map(c => (
                    <label key={c.id} className="flex items-center gap-2 p-2 hover:bg-dark-700 rounded cursor-pointer">
                      <input type="checkbox" checked={selectedCourses.includes(c.id)}
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
