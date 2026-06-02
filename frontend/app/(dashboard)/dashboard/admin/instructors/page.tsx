'use client';
import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Users, Star, Briefcase, Loader2, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface Instructor {
  id: string; name: string; name_ar: string; title: string; title_ar: string;
  bio: string; bio_ar: string; photo_url: string; experience_years: number;
  trainees_count: number; rating: number; specialties: string[];
  linkedin_url: string; youtube_url: string; is_active: boolean;
  course_count?: number;
}

const EMPTY: Partial<Instructor> = {
  name: '', name_ar: '', title: '', title_ar: '', bio: '', bio_ar: '',
  photo_url: '', experience_years: 0, trainees_count: 0, rating: 5.0,
  specialties: [], linkedin_url: '', youtube_url: '', is_active: true,
};

export default function AdminInstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Instructor> | null>(null);
  const [saving, setSaving] = useState(false);
  const [specInput, setSpecInput] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/instructors').then(({ data }) => setInstructors(data)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSave = async () => {
    if (!editing?.name) { toast.error('الاسم مطلوب'); return; }
    setSaving(true);
    try {
      if (editing.id) {
        await api.put(`/instructors/${editing.id}`, editing);
        toast.success('تم التحديث');
      } else {
        await api.post('/instructors', editing);
        toast.success('تم إضافة المدرب');
      }
      setEditing(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'حدث خطأ');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف هذا المدرب؟')) return;
    await api.delete(`/instructors/${id}`);
    toast.success('تم الحذف');
    load();
  };

  const addSpec = () => {
    if (!specInput.trim() || !editing) return;
    setEditing({ ...editing, specialties: [...(editing.specialties || []), specInput.trim()] });
    setSpecInput('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">المدربين</h1>
          <p className="text-sm text-slate-400">إدارة المدربين وبياناتهم</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> إضافة مدرب
        </button>
      </div>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="bg-dark-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 border border-dark-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">{editing.id ? 'تعديل المدرب' : 'إضافة مدرب جديد'}</h2>
              <button onClick={() => setEditing(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">الاسم (إنجليزي) *</label>
                <input className="input" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">الاسم (عربي)</label>
                <input className="input" value={editing.name_ar || ''} onChange={e => setEditing({ ...editing, name_ar: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">المسمى الوظيفي (إنجليزي)</label>
                <input className="input" value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} placeholder="Data Analysis Expert" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">المسمى الوظيفي (عربي)</label>
                <input className="input" value={editing.title_ar || ''} onChange={e => setEditing({ ...editing, title_ar: e.target.value })} placeholder="خبير تحليل البيانات" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1">النبذة (إنجليزي)</label>
                <textarea className="input resize-none" rows={3} value={editing.bio || ''} onChange={e => setEditing({ ...editing, bio: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1">النبذة (عربي)</label>
                <textarea className="input resize-none" rows={3} value={editing.bio_ar || ''} onChange={e => setEditing({ ...editing, bio_ar: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1">رابط الصورة</label>
                <input className="input" type="url" value={editing.photo_url || ''} onChange={e => setEditing({ ...editing, photo_url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">سنوات الخبرة</label>
                <input className="input" type="number" value={editing.experience_years || 0} onChange={e => setEditing({ ...editing, experience_years: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">عدد المتدربين</label>
                <input className="input" type="number" value={editing.trainees_count || 0} onChange={e => setEditing({ ...editing, trainees_count: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">التقييم (1-5)</label>
                <input className="input" type="number" step="0.1" min="1" max="5" value={editing.rating || 5} onChange={e => setEditing({ ...editing, rating: parseFloat(e.target.value) || 5 })} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">نشط</label>
                <select className="input" value={editing.is_active ? 'true' : 'false'} onChange={e => setEditing({ ...editing, is_active: e.target.value === 'true' })}>
                  <option value="true">نعم</option>
                  <option value="false">لا</option>
                </select>
              </div>

              {/* Specialties */}
              <div className="col-span-2">
                <label className="block text-xs text-slate-400 mb-1">التخصصات</label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {(editing.specialties || []).map((s, i) => (
                    <span key={i} className="badge badge-blue flex items-center gap-1">
                      {s}
                      <button onClick={() => setEditing({ ...editing, specialties: (editing.specialties || []).filter((_, j) => j !== i) })}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className="input flex-1" value={specInput} onChange={e => setSpecInput(e.target.value)}
                    placeholder="Excel, Power BI, SQL..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpec())} />
                  <button onClick={addSpec} className="btn-secondary text-sm">أضف</button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">LinkedIn</label>
                <input className="input" type="url" value={editing.linkedin_url || ''} onChange={e => setEditing({ ...editing, linkedin_url: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">YouTube</label>
                <input className="input" type="url" value={editing.youtube_url || ''} onChange={e => setEditing({ ...editing, youtube_url: e.target.value })} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditing(null)} className="btn-secondary">إلغاء</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" /> {saving ? 'جارِ الحفظ...' : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-brand-500 animate-spin" /></div>
      ) : instructors.length === 0 ? (
        <div className="card text-center py-16">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">لا يوجد مدربين بعد</p>
          <p className="text-sm text-slate-500 mt-1">أضف أول مدرب من الزرار أعلاه</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instructors.map(inst => (
            <div key={inst.id} className="card hover:border-brand-500/30 transition-colors">
              <div className="flex items-start gap-4 mb-4">
                {inst.photo_url ? (
                  <img src={inst.photo_url} alt={inst.name} className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-brand-500/20 flex items-center justify-center text-lg font-bold text-brand-400">
                    {inst.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate">{inst.name}</h3>
                  {inst.name_ar && <p className="text-xs text-slate-400 truncate">{inst.name_ar}</p>}
                  <p className="text-xs text-brand-400 truncate">{inst.title || inst.title_ar}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-3 text-xs">
                <span className="flex items-center gap-1 text-slate-400"><Briefcase className="w-3 h-3" /> {inst.experience_years} سنة</span>
                <span className="flex items-center gap-1 text-slate-400"><Users className="w-3 h-3" /> {inst.trainees_count}+ متدرب</span>
                <span className="flex items-center gap-1 text-yellow-400"><Star className="w-3 h-3 fill-yellow-400" /> {inst.rating}</span>
                <span className="text-slate-500">{inst.course_count} كورس</span>
              </div>

              {(inst.specialties || []).length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {inst.specialties.slice(0, 4).map((s, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-dark-700 text-slate-300">{s}</span>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-dark-700">
                <button onClick={() => setEditing(inst)} className="btn-secondary text-xs flex-1 flex items-center justify-center gap-1">
                  <Edit2 className="w-3 h-3" /> تعديل
                </button>
                <button onClick={() => handleDelete(inst.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
