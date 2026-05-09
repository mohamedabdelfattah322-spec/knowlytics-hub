'use client';
import { useEffect, useState } from 'react';
import { Tag, Plus, Trash2, X, Loader2, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface Coupon {
  id: string; code: string; description: string;
  discount_type: 'percent' | 'fixed'; discount_value: number;
  course_id: string | null; course_title: string | null;
  audience: string | null;
  max_uses: number | null; max_uses_per_user: number;
  used_count: number; redemption_count: number;
  valid_from: string | null; valid_until: string | null;
  is_active: boolean;
}

interface Course { id: string; title: string; price: number; type: string; }

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: '',
    description: '',
    discount_type: 'percent',
    discount_value: '',
    course_id: '',
    audience: '',
    max_uses: '',
    max_uses_per_user: '1',
    valid_from: '',
    valid_until: '',
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/coupons'),
      api.get('/courses', { params: { admin: 'true', limit: 100 } }),
    ]).then(([c, co]) => {
      setCoupons(c.data);
      setCourses(co.data.courses);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.code || !form.discount_value) {
      toast.error('الكود وقيمة الخصم مطلوبين');
      return;
    }
    try {
      await api.post('/coupons', {
        ...form,
        discount_value: Number(form.discount_value),
        max_uses: form.max_uses ? Number(form.max_uses) : null,
        max_uses_per_user: Number(form.max_uses_per_user) || 1,
        course_id: form.course_id || null,
      });
      toast.success('✅ تم إنشاء الكوبون');
      setModal(false);
      setForm({ code: '', description: '', discount_type: 'percent', discount_value: '', course_id: '', audience: '', max_uses: '', max_uses_per_user: '1', valid_from: '', valid_until: '' });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'فشل الإنشاء');
    }
  };

  const toggleActive = async (c: Coupon) => {
    try {
      await api.patch(`/coupons/${c.id}`, { is_active: !c.is_active });
      load();
    } catch { toast.error('فشل'); }
  };

  const remove = async (id: string) => {
    if (!confirm('حذف الكوبون؟')) return;
    try {
      await api.delete(`/coupons/${id}`);
      toast.success('تم الحذف');
      load();
    } catch { toast.error('فشل'); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-brand-400" /> الكوبونات والعروض
          </h1>
          <p className="text-slate-400 text-sm mt-1">{coupons.length} كوبون</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> كوبون جديد
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>
      ) : coupons.length === 0 ? (
        <div className="card text-center py-12">
          <Tag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">لا توجد كوبونات. أنشئ كوبون لإطلاق عرض.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-700/40 text-slate-400">
              <tr>
                <th className="text-right px-4 py-3 font-medium">الكود</th>
                <th className="text-right px-4 py-3 font-medium">الخصم</th>
                <th className="text-right px-4 py-3 font-medium">الكورس</th>
                <th className="text-right px-4 py-3 font-medium">الجمهور</th>
                <th className="text-right px-4 py-3 font-medium">الاستخدام</th>
                <th className="text-right px-4 py-3 font-medium">الصلاحية</th>
                <th className="text-right px-4 py-3 font-medium">الحالة</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {coupons.map((c) => (
                <tr key={c.id} className={cn('hover:bg-dark-700/30', !c.is_active && 'opacity-50')}>
                  <td className="px-4 py-3">
                    <button onClick={() => copyCode(c.code)}
                      className="flex items-center gap-1.5 font-mono text-brand-300 font-bold hover:text-brand-400">
                      {c.code}
                      {copied === c.code ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 opacity-50" />}
                    </button>
                    {c.description && <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-white font-bold">
                    {c.discount_type === 'percent' ? `${c.discount_value}%` : `${c.discount_value} EGP`}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{c.course_title || <span className="text-slate-500">كل الكورسات</span>}</td>
                  <td className="px-4 py-3 text-slate-300">{c.audience || <span className="text-slate-500">للجميع</span>}</td>
                  <td className="px-4 py-3 text-slate-300">
                    {c.redemption_count} {c.max_uses ? `/ ${c.max_uses}` : ''}
                    <p className="text-xs text-slate-500">حد لكل شخص: {c.max_uses_per_user}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {c.valid_until ? `حتى ${format(new Date(c.valid_until), 'MMM d, yyyy')}` : 'بدون نهاية'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(c)}
                      className={cn('badge', c.is_active ? 'badge-green' : 'badge-red')}>
                      {c.is_active ? 'مُفعّل' : 'موقوف'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => remove(c.id)} className="p-1.5 text-slate-400 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModal(false)}>
          <div className="bg-dark-800 border border-dark-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">كوبون جديد</h2>
              <button onClick={() => setModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-sm text-slate-300 mb-1">الكود *</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="WELCOME10" className="input font-mono" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-slate-300 mb-1">وصف</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="عرض رمضان، خصم لشركة Acme..." className="input" />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">نوع الخصم</label>
                <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className="input">
                  <option value="percent">نسبة %</option>
                  <option value="fixed">قيمة ثابتة (جنيه)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">القيمة *</label>
                <input type="number" min={0} step="0.01" value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  placeholder={form.discount_type === 'percent' ? '25' : '50'} className="input" />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm text-slate-300 mb-1">الكورس (اختياري)</label>
                <select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} className="input">
                  <option value="">— كل الكورسات —</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm text-slate-300 mb-1">الجمهور المستهدف (اختياري)</label>
                <input value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  placeholder="مثلاً: شركة Acme، طلاب VIP..." className="input" />
                <p className="text-xs text-slate-500 mt-1">للتنظيم الداخلي فقط</p>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">الحد الأقصى للاستخدامات (اختياري)</label>
                <input type="number" min={0} value={form.max_uses}
                  onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                  placeholder="بدون حد" className="input" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">الحد الأقصى لكل شخص</label>
                <input type="number" min={1} value={form.max_uses_per_user}
                  onChange={(e) => setForm({ ...form, max_uses_per_user: e.target.value })} className="input" />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1">يبدأ من (اختياري)</label>
                <input type="datetime-local" value={form.valid_from}
                  onChange={(e) => setForm({ ...form, valid_from: e.target.value })} className="input" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">ينتهي في (اختياري)</label>
                <input type="datetime-local" value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="input" />
              </div>

              <div className="sm:col-span-2 flex gap-2 pt-2">
                <button onClick={create} className="btn-primary flex-1">إنشاء الكوبون</button>
                <button onClick={() => setModal(false)} className="btn-secondary">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
