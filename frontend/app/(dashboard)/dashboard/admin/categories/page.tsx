'use client';
import { useState, useEffect } from 'react';
import { FolderOpen, Plus, Edit2, Trash2, Loader2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface Category {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  icon: string;
  parent_id: string | null;
  order_index: number;
  course_count: number;
}

const emptyForm = { name: '', name_ar: '', slug: '', icon: '📚', order_index: 0 };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showNew, setShowNew] = useState(false);

  const fetch = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data);
    } catch { toast.error('فشل تحميل الأقسام'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const save = async () => {
    try {
      if (editing) {
        await api.put(`/categories/${editing}`, form);
        toast.success('تم التعديل');
      } else {
        await api.post('/categories', { ...form, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-') });
        toast.success('تم الإضافة');
      }
      setEditing(null);
      setShowNew(false);
      setForm(emptyForm);
      fetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'فشل الحفظ');
    }
  };

  const del = async (id: string) => {
    if (!confirm('هل تريد حذف هذا القسم؟')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('تم الحذف');
      fetch();
    } catch { toast.error('فشل الحذف'); }
  };

  const startEdit = (cat: Category) => {
    setEditing(cat.id);
    setShowNew(false);
    setForm({ name: cat.name, name_ar: cat.name_ar, slug: cat.slug, icon: cat.icon, order_index: cat.order_index });
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FolderOpen className="w-6 h-6 text-brand-400" /> الأقسام
        </h1>
        <button onClick={() => { setShowNew(true); setEditing(null); setForm(emptyForm); }}
          className="btn-primary flex items-center gap-1 text-sm">
          <Plus className="w-4 h-4" /> إضافة قسم
        </button>
      </div>

      {/* Add/Edit form */}
      {(showNew || editing) && (
        <div className="card border border-brand-500/30">
          <h3 className="text-white font-semibold mb-3">{editing ? 'تعديل القسم' : 'قسم جديد'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Name (English)" className="input" />
            <input value={form.name_ar} onChange={e => setForm({ ...form, name_ar: e.target.value })}
              placeholder="الاسم (عربي)" className="input" />
            <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
              placeholder="slug (auto-generated)" className="input" />
            <input value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })}
              placeholder="Icon emoji" className="input" />
            <input type="number" value={form.order_index} onChange={e => setForm({ ...form, order_index: parseInt(e.target.value) || 0 })}
              placeholder="الترتيب" className="input" />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={save} className="btn-primary flex items-center gap-1 text-sm">
              <Save className="w-4 h-4" /> حفظ
            </button>
            <button onClick={() => { setShowNew(false); setEditing(null); }}
              className="btn-outline flex items-center gap-1 text-sm">
              <X className="w-4 h-4" /> إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Categories table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-700 text-slate-400">
              <th className="text-right py-3 px-4">الأيقونة</th>
              <th className="text-right py-3 px-4">الاسم</th>
              <th className="text-right py-3 px-4">Name</th>
              <th className="text-right py-3 px-4">Slug</th>
              <th className="text-right py-3 px-4">الكورسات</th>
              <th className="text-right py-3 px-4">الترتيب</th>
              <th className="text-right py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                <td className="py-3 px-4 text-2xl">{cat.icon}</td>
                <td className="py-3 px-4 text-white font-medium">{cat.name_ar}</td>
                <td className="py-3 px-4 text-slate-300">{cat.name}</td>
                <td className="py-3 px-4 text-slate-500 font-mono text-xs">{cat.slug}</td>
                <td className="py-3 px-4 text-brand-400">{cat.course_count}</td>
                <td className="py-3 px-4 text-slate-400">{cat.order_index}</td>
                <td className="py-3 px-4">
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(cat)} className="text-slate-400 hover:text-brand-400">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => del(cat.id)} className="text-slate-400 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
