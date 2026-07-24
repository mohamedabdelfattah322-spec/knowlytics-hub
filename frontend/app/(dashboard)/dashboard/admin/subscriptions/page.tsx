'use client';
import { useState, useEffect } from 'react';
import { CreditCard, Plus, Edit2, Loader2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  max_courses: number | null;
  is_active: boolean;
}

export default function SubscriptionsAdminPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    name: '', name_ar: '', description: '', price_monthly: 0, price_yearly: 0,
    features: '', max_courses: '', is_active: true,
  });

  const fetch = async () => {
    try {
      const { data } = await api.get('/subscriptions/plans/all');
      setPlans(data);
    } catch { toast.error('فشل تحميل الخطط'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const save = async () => {
    try {
      const payload = {
        ...form,
        features: form.features.split('\n').filter(Boolean),
        max_courses: form.max_courses ? parseInt(form.max_courses) : null,
      };
      if (editing) {
        await api.put(`/subscriptions/plans/${editing}`, payload);
        toast.success('تم التعديل');
      } else {
        await api.post('/subscriptions/plans', payload);
        toast.success('تم الإضافة');
      }
      setEditing(null);
      setShowNew(false);
      fetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'فشل الحفظ');
    }
  };

  const startEdit = (p: Plan) => {
    setEditing(p.id);
    setShowNew(false);
    const features = Array.isArray(p.features) ? p.features : JSON.parse(p.features as any || '[]');
    setForm({
      name: p.name, name_ar: p.name_ar, description: p.description || '',
      price_monthly: p.price_monthly, price_yearly: p.price_yearly || 0,
      features: features.join('\n'),
      max_courses: p.max_courses?.toString() || '',
      is_active: p.is_active,
    });
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-brand-400" /> خطط الاشتراك
        </h1>
        <button onClick={() => { setShowNew(true); setEditing(null); setForm({ name: '', name_ar: '', description: '', price_monthly: 0, price_yearly: 0, features: '', max_courses: '', is_active: true }); }}
          className="btn-primary flex items-center gap-1 text-sm">
          <Plus className="w-4 h-4" /> خطة جديدة
        </button>
      </div>

      {(showNew || editing) && (
        <div className="card border border-brand-500/30">
          <h3 className="text-white font-semibold mb-3">{editing ? 'تعديل الخطة' : 'خطة جديدة'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Plan Name" className="input" />
            <input value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })} placeholder="اسم الخطة" className="input" />
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="الوصف" className="input sm:col-span-2" />
            <input type="number" value={form.price_monthly} onChange={e => setForm({ ...form, price_monthly: parseFloat(e.target.value) || 0 })} placeholder="السعر الشهري" className="input" />
            <input type="number" value={form.price_yearly} onChange={e => setForm({ ...form, price_yearly: parseFloat(e.target.value) || 0 })} placeholder="السعر السنوي" className="input" />
            <input value={form.max_courses} onChange={e => setForm({ ...form, max_courses: e.target.value })} placeholder="عدد الكورسات (فارغ = غير محدود)" className="input" />
            <textarea value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} placeholder="المميزات (سطر لكل ميزة)" className="input sm:col-span-2" rows={3} />
            <label className="flex items-center gap-2 text-slate-300 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              نشطة
            </label>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={save} className="btn-primary flex items-center gap-1 text-sm"><Save className="w-4 h-4" /> حفظ</button>
            <button onClick={() => { setShowNew(false); setEditing(null); }} className="btn-outline text-sm"><X className="w-4 h-4" /> إلغاء</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map(plan => {
          const features = Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features as any || '[]');
          return (
            <div key={plan.id} className={`card relative ${!plan.is_active ? 'opacity-50' : ''}`}>
              <button onClick={() => startEdit(plan)} className="absolute top-3 left-3 text-slate-400 hover:text-brand-400">
                <Edit2 className="w-4 h-4" />
              </button>
              <h3 className="text-white font-bold text-lg">{plan.name_ar || plan.name}</h3>
              <p className="text-slate-400 text-sm mt-1">{plan.description}</p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-brand-400">{formatCurrency(plan.price_monthly)}</span>
                <span className="text-slate-500 text-sm">/شهر</span>
              </div>
              {plan.price_yearly > 0 && (
                <p className="text-slate-500 text-sm">{formatCurrency(plan.price_yearly)}/سنة</p>
              )}
              <ul className="mt-4 space-y-1">
                {features.map((f: string, i: number) => (
                  <li key={i} className="text-slate-300 text-sm flex items-center gap-2">
                    <span className="text-green-400">✓</span> {f}
                  </li>
                ))}
              </ul>
              {!plan.is_active && <span className="text-xs text-red-400 mt-2 block">معطلة</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
