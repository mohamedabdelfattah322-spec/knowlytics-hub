'use client';
import { useEffect, useState } from 'react';
import { Tag, Plus, Trash2, X, Loader2, Copy, Check, ChevronDown, ChevronUp, Edit2, ShoppingCart, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '@/lib/api';
import { cn, formatPrice } from '@/lib/utils';

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

interface Redemption {
  created_at: string; user_id: string; name: string; email: string;
  avatar_url: string | null; course_title: string | null;
  amount: number; payment_status: string;
}

interface CartAnalytics {
  by_event: { event_type: string; count: number; total_value: number }[];
  by_course: { title: string; event_type: string; count: number }[];
  recent: { created_at: string; event_type: string; name: string; email: string; course_title: string; amount: number }[];
}

interface Course { id: string; title: string; price: number; type: string; }
interface Bundle { id: string; name: string; price: number; }

const emptyForm = {
  code: '', description: '', discount_type: 'percent', discount_value: '',
  applies_to: 'all' as 'all' | 'course' | 'bundle',
  course_id: '', bundle_id: '', audience: '', max_uses: '', max_uses_per_user: '1',
  valid_from: '', valid_until: '',
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [activeTab, setActiveTab] = useState<'coupons' | 'cart'>('coupons');
  const [cartData, setCartData] = useState<CartAnalytics | null>(null);
  const [cartLoading, setCartLoading] = useState(false);

  // Redemptions panel
  const [redemptionsFor, setRedemptionsFor] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/coupons'),
      api.get('/courses', { params: { admin: 'true', limit: 100 } }),
      api.get('/bundles'),
    ]).then(([c, co, bu]) => {
      setCoupons(c.data);
      setCourses(co.data.courses);
      setBundles(bu.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const loadCart = async () => {
    setCartLoading(true);
    try {
      const { data } = await api.get('/coupons/admin/cart-analytics');
      setCartData(data);
    } catch { toast.error('فشل تحميل تحليل السلة'); }
    finally { setCartLoading(false); }
  };

  const loadRedemptions = async (couponId: string) => {
    if (redemptionsFor === couponId) { setRedemptionsFor(null); return; }
    setRedemptionsFor(couponId);
    setRedemptionsLoading(true);
    try {
      const { data } = await api.get(`/coupons/${couponId}/redemptions`);
      setRedemptions(data);
    } catch { toast.error('فشل تحميل الاستخدامات'); }
    finally { setRedemptionsLoading(false); }
  };

  const openCreate = () => { setEditingId(null); setForm({ ...emptyForm }); setModal(true); };
  const openEdit = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      code: c.code, description: c.description || '', discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      applies_to: (c as any).bundle_id ? 'bundle' : c.course_id ? 'course' : 'all',
      course_id: c.course_id || '',
      bundle_id: (c as any).bundle_id || '',
      audience: c.audience || '', max_uses: c.max_uses ? String(c.max_uses) : '',
      max_uses_per_user: String(c.max_uses_per_user),
      valid_from: c.valid_from ? c.valid_from.slice(0, 16) : '',
      valid_until: c.valid_until ? c.valid_until.slice(0, 16) : '',
    });
    setModal(true);
  };

  const save = async () => {
    if (!form.code || !form.discount_value) { toast.error('الكود وقيمة الخصم مطلوبين'); return; }
    const payload = {
      code: form.code, description: form.description,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      max_uses_per_user: Number(form.max_uses_per_user) || 1,
      course_id: form.applies_to === 'course' ? (form.course_id || null) : null,
      bundle_id: form.applies_to === 'bundle' ? (form.bundle_id || null) : null,
      audience: form.audience || null,
      valid_from: form.valid_from || null,
      valid_until: form.valid_until || null,
    };
    try {
      if (editingId) {
        await api.patch(`/coupons/${editingId}`, payload);
        toast.success('✅ تم تحديث الكوبون');
      } else {
        await api.post('/coupons', payload);
        toast.success('✅ تم إنشاء الكوبون');
      }
      setModal(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'فشل الحفظ');
    }
  };

  const toggleActive = async (c: Coupon) => {
    try { await api.patch(`/coupons/${c.id}`, { is_active: !c.is_active }); load(); }
    catch { toast.error('فشل'); }
  };

  const remove = async (id: string) => {
    if (!confirm('حذف الكوبون؟')) return;
    try { await api.delete(`/coupons/${id}`); toast.success('تم الحذف'); load(); }
    catch { toast.error('فشل'); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Tag className="w-6 h-6 text-brand-400" /> الكوبونات والعروض
          </h1>
          <p className="text-slate-400 text-sm mt-1">{coupons.length} كوبون</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> كوبون جديد
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-dark-700">
        <button onClick={() => setActiveTab('coupons')}
          className={cn('px-4 py-2 text-sm font-medium border-b-2 transition-colors', activeTab === 'coupons' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-white')}>
          🏷 الكوبونات
        </button>
        <button onClick={() => { setActiveTab('cart'); if (!cartData) loadCart(); }}
          className={cn('px-4 py-2 text-sm font-medium border-b-2 transition-colors', activeTab === 'cart' ? 'border-brand-500 text-brand-400' : 'border-transparent text-slate-400 hover:text-white')}>
          🛒 تحليل السلة
        </button>
      </div>

      {/* ══ COUPONS TAB ══ */}
      {activeTab === 'coupons' && (
        <>
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
                    <th className="text-right px-4 py-3 font-medium">الاستخدام</th>
                    <th className="text-right px-4 py-3 font-medium">البداية</th>
                    <th className="text-right px-4 py-3 font-medium">النهاية</th>
                    <th className="text-right px-4 py-3 font-medium">الحالة</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((c) => (
                    <>
                      <tr key={c.id} className={cn('border-t border-dark-700 hover:bg-dark-700/30', !c.is_active && 'opacity-50')}>
                        <td className="px-4 py-3">
                          <button onClick={() => copyCode(c.code)}
                            className="flex items-center gap-1.5 font-mono text-brand-300 font-bold hover:text-brand-400">
                            {c.code}
                            {copied === c.code ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 opacity-50" />}
                          </button>
                          {c.description && <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>}
                          {c.audience && <p className="text-xs text-purple-400 mt-0.5">🎯 {c.audience}</p>}
                        </td>
                        <td className="px-4 py-3 text-white font-bold">
                          {c.discount_type === 'percent' ? `${c.discount_value}%` : `${c.discount_value} جنيه`}
                        </td>
                        <td className="px-4 py-3 text-slate-300 text-xs">
                          {(c as any).bundle_title
                            ? <span className="text-purple-300">📦 {(c as any).bundle_title}</span>
                            : c.course_title
                              ? <span>{c.course_title}</span>
                              : <span className="text-slate-500">كل الكورسات والباقات</span>}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => loadRedemptions(c.id)}
                            className="flex items-center gap-1 text-brand-400 hover:text-brand-300 font-bold">
                            <Users className="w-3.5 h-3.5" />
                            {c.redemption_count}{c.max_uses ? `/${c.max_uses}` : ''}
                            {redemptionsFor === c.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          <p className="text-xs text-slate-500">حد/شخص: {c.max_uses_per_user}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {c.valid_from ? format(new Date(c.valid_from), 'dd/MM/yyyy HH:mm') : <span className="text-green-400 text-xs">الآن</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {c.valid_until ? format(new Date(c.valid_until), 'dd/MM/yyyy HH:mm') : <span className="text-slate-500">بدون نهاية</span>}
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleActive(c)}
                            className={cn('badge', c.is_active ? 'badge-green' : 'badge-red')}>
                            {c.is_active ? 'مُفعّل' : 'موقوف'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:text-brand-400"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => remove(c.id)} className="p-1.5 text-slate-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>

                      {/* Redemptions expanded row */}
                      {redemptionsFor === c.id && (
                        <tr key={`${c.id}-redemptions`} className="border-t border-dark-700 bg-dark-800/60">
                          <td colSpan={8} className="px-4 py-3">
                            {redemptionsLoading ? (
                              <div className="flex items-center gap-2 text-slate-400 text-xs py-2"><Loader2 className="w-4 h-4 animate-spin" /> جاري التحميل...</div>
                            ) : redemptions.length === 0 ? (
                              <p className="text-slate-500 text-xs py-2">لا أحد استخدم الكوبون ده لحد دلوقتي.</p>
                            ) : (
                              <div className="space-y-1">
                                <p className="text-xs text-slate-400 mb-2 font-medium">المستخدمون ({redemptions.length}):</p>
                                {redemptions.map((r, i) => (
                                  <div key={i} className="flex items-center gap-3 py-1.5 border-b border-dark-700 last:border-0">
                                    <div className="w-7 h-7 rounded-full bg-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-300 flex-shrink-0">
                                      {r.name?.[0] || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white text-xs font-medium">{r.name}</p>
                                      <p className="text-slate-500 text-xs">{r.email}</p>
                                    </div>
                                    <div className="text-right text-xs">
                                      <p className="text-slate-300">{r.course_title || '—'}</p>
                                      <p className="text-slate-500">{format(new Date(r.created_at), 'dd/MM/yyyy')}</p>
                                    </div>
                                    <div className="text-right text-xs">
                                      <p className="text-green-400 font-bold">{formatPrice(r.amount)}</p>
                                      <p className={cn('text-xs', r.payment_status === 'success' ? 'text-green-500' : 'text-yellow-500')}>{r.payment_status}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ══ CART ANALYTICS TAB ══ */}
      {activeTab === 'cart' && (
        <div className="space-y-5">
          {cartLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>
          ) : !cartData ? null : (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {cartData.by_event.map((e) => (
                  <div key={e.event_type} className="card text-center">
                    <p className="text-2xl font-bold text-white">{e.count}</p>
                    <p className="text-xs text-slate-400 mt-1">{e.event_type === 'purchase' ? '✅ شراء' : e.event_type === 'add_to_cart' ? '🛒 إضافة للسلة' : e.event_type === 'remove_from_cart' ? '🗑 حذف من السلة' : e.event_type}</p>
                    {e.total_value > 0 && <p className="text-xs text-brand-400 mt-1">{formatPrice(e.total_value)}</p>}
                  </div>
                ))}
              </div>

              {/* Top courses in cart */}
              <div className="card">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-brand-400" /> أكثر الكورسات إضافة للسلة</h3>
                <div className="space-y-2">
                  {cartData.by_course.filter(b => b.event_type === 'add_to_cart').slice(0, 10).map((b, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-300 truncate flex-1">{b.title}</span>
                      <span className="text-brand-400 font-bold ml-4">{b.count} مرة</span>
                    </div>
                  ))}
                  {cartData.by_course.filter(b => b.event_type === 'add_to_cart').length === 0 && (
                    <p className="text-slate-500 text-sm">لا يوجد بيانات بعد</p>
                  )}
                </div>
              </div>

              {/* Recent events */}
              <div className="card p-0 overflow-x-auto">
                <div className="px-4 py-3 border-b border-dark-700">
                  <h3 className="font-semibold text-white">آخر أحداث السلة</h3>
                </div>
                <table className="w-full text-xs">
                  <thead className="bg-dark-700/40 text-slate-400">
                    <tr>
                      <th className="text-right px-4 py-2">الحدث</th>
                      <th className="text-right px-4 py-2">المستخدم</th>
                      <th className="text-right px-4 py-2">الكورس</th>
                      <th className="text-right px-4 py-2">المبلغ</th>
                      <th className="text-right px-4 py-2">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-700">
                    {cartData.recent.map((r, i) => (
                      <tr key={i} className="hover:bg-dark-700/20">
                        <td className="px-4 py-2">
                          <span className={cn('badge text-xs', r.event_type === 'purchase' ? 'badge-green' : r.event_type === 'add_to_cart' ? 'badge-blue' : 'badge-red')}>
                            {r.event_type === 'purchase' ? '✅ شراء' : r.event_type === 'add_to_cart' ? '🛒 إضافة' : '🗑 حذف'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-300">{r.name || '—'}<br/><span className="text-slate-500">{r.email}</span></td>
                        <td className="px-4 py-2 text-slate-300 max-w-[200px] truncate">{r.course_title || '—'}</td>
                        <td className="px-4 py-2 text-brand-400">{r.amount > 0 ? formatPrice(r.amount) : '—'}</td>
                        <td className="px-4 py-2 text-slate-400">{format(new Date(r.created_at), 'dd/MM HH:mm')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModal(false)}>
          <div className="bg-dark-800 border border-dark-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">{editingId ? '✏️ تعديل الكوبون' : 'كوبون جديد'}</h2>
              <button onClick={() => setModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-sm text-slate-300 mb-1">الكود *</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="WELCOME10" className="input font-mono" disabled={!!editingId} />
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
                <label className="block text-sm text-slate-300 mb-1">يُطبق على</label>
                <div className="flex gap-1 bg-dark-900 border border-dark-600 rounded-lg p-1 mb-2">
                  {(['all', 'course', 'bundle'] as const).map(opt => (
                    <button key={opt} type="button"
                      onClick={() => setForm({ ...form, applies_to: opt, course_id: '', bundle_id: '' })}
                      className={cn('flex-1 py-1.5 rounded-md text-xs font-medium transition-colors',
                        form.applies_to === opt ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white')}>
                      {opt === 'all' ? '🌐 كل الكورسات والباقات' : opt === 'course' ? '📚 كورس محدد' : '📦 باقة محددة'}
                    </button>
                  ))}
                </div>
                {form.applies_to === 'course' && (
                  <select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} className="input">
                    <option value="">— اختر كورس —</option>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                )}
                {form.applies_to === 'bundle' && (
                  <select value={form.bundle_id} onChange={(e) => setForm({ ...form, bundle_id: e.target.value })} className="input">
                    <option value="">— اختر باقة —</option>
                    {bundles.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm text-slate-300 mb-1">الجمهور المستهدف (اختياري)</label>
                <input value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  placeholder="شركة Acme، طلاب VIP..." className="input" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">الحد الأقصى للاستخدامات</label>
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
                <label className="block text-sm text-slate-300 mb-1">يبدأ من (اتركه فارغاً = الآن)</label>
                <input type="datetime-local" value={form.valid_from}
                  onChange={(e) => setForm({ ...form, valid_from: e.target.value })} className="input" />
                {form.valid_from && <button onClick={() => setForm({ ...form, valid_from: '' })} className="text-xs text-red-400 mt-1">× إزالة التاريخ (يبدأ الآن)</button>}
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">ينتهي في (اختياري)</label>
                <input type="datetime-local" value={form.valid_until}
                  onChange={(e) => setForm({ ...form, valid_until: e.target.value })} className="input" />
              </div>
              <div className="sm:col-span-2 flex gap-2 pt-2">
                <button onClick={save} className="btn-primary flex-1">{editingId ? 'حفظ التعديلات' : 'إنشاء الكوبون'}</button>
                <button onClick={() => setModal(false)} className="btn-secondary">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
