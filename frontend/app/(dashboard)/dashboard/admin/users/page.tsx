'use client';
import { useEffect, useState } from 'react';
import { Search, Shield, ShieldOff, Trash2, UserPlus, X, Copy, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface User {
  id: string; name: string; email: string; role: string;
  student_type: string; is_active: boolean; created_at: string;
  enrollment_count: string;
}

interface Course {
  id: string; title: string; type: string; price: number;
}

const generatePassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pass = '';
  for (let i = 0; i < 10; i++) pass += chars[Math.floor(Math.random() * chars.length)];
  return pass + '!';
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Create user modal
  const [modal, setModal] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [form, setForm] = useState({ name: '', email: '', password: generatePassword(), student_type: 'live', course_id: '' });
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string; courseTitle?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const load = () => {
    api.get('/admin/users', { params: { search } })
      .then(({ data }) => setUsers(data.users))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  useEffect(() => {
    if (modal && courses.length === 0) {
      api.get('/courses', { params: { admin: 'true', limit: 100 } })
        .then(({ data }) => setCourses(data.courses));
    }
  }, [modal]);

  const toggleActive = async (user: User) => {
    try {
      await api.patch(`/admin/users/${user.id}`, { is_active: !user.is_active });
      toast.success(user.is_active ? 'تم تعليق الحساب' : 'تم تفعيل الحساب');
      load();
    } catch { toast.error('فشل التحديث'); }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('حذف نهائي للمستخدم؟')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('تم الحذف');
      load();
    } catch { toast.error('فشل الحذف'); }
  };

  const createUser = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error('املأ الحقول المطلوبة');
      return;
    }
    if (form.password.length < 6) {
      toast.error('كلمة السر لازم 6 حروف على الأقل');
      return;
    }
    setCreating(true);
    try {
      await api.post('/admin/users', form);
      const courseTitle = courses.find((c) => c.id === form.course_id)?.title;
      setCreated({ email: form.email, password: form.password, courseTitle });
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'فشل إنشاء الحساب');
    } finally {
      setCreating(false);
    }
  };

  const copyCreds = () => {
    const text = `Login: ${created!.email}\nPassword: ${created!.password}\n${created?.courseTitle ? `Course: ${created.courseTitle}` : ''}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeModal = () => {
    setModal(false);
    setCreated(null);
    setForm({ name: '', email: '', password: generatePassword(), student_type: 'live', course_id: '' });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">إدارة المستخدمين</h1>
          <p className="text-slate-400 text-sm mt-1">{users.length} مستخدم</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> إنشاء مستخدم
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="بحث بالاسم أو الإيميل..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-700/50">
              <tr className="text-slate-400">
                <th className="text-left px-6 py-4 font-medium">المستخدم</th>
                <th className="text-left px-4 py-4 font-medium">الدور</th>
                <th className="text-left px-4 py-4 font-medium">النوع</th>
                <th className="text-left px-4 py-4 font-medium">الكورسات</th>
                <th className="text-left px-4 py-4 font-medium">تاريخ التسجيل</th>
                <th className="text-left px-4 py-4 font-medium">الحالة</th>
                <th className="px-4 py-4 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {loading
                ? [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(7)].map((_, j) => <td key={j} className="px-4 py-4"><div className="h-4 bg-dark-700 rounded animate-pulse" /></td>)}</tr>
                ))
                : users.map((u) => (
                  <tr key={u.id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-semibold text-sm">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-200">{u.name}</p>
                          <p className="text-slate-500 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('badge', u.role === 'admin' ? 'badge-purple' : 'badge-blue')}>
                        {u.role === 'admin' ? '👑 Admin' : '🎓 Student'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-400 capitalize">{u.student_type || '—'}</td>
                    <td className="px-4 py-4 text-slate-300">{u.enrollment_count}</td>
                    <td className="px-4 py-4 text-slate-400">{format(new Date(u.created_at), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-4">
                      <span className={cn('badge', u.is_active ? 'badge-green' : 'badge-red')}>
                        {u.is_active ? 'مُفعّل' : 'موقوف'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 justify-center">
                        <button onClick={() => toggleActive(u)} title={u.is_active ? 'إيقاف' : 'تفعيل'} className={cn('p-1.5 rounded-lg transition-colors', u.is_active ? 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10' : 'text-slate-400 hover:text-green-400 hover:bg-green-500/10')}>
                          {u.is_active ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                        </button>
                        <button onClick={() => deleteUser(u.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
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

      {/* Create User Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-dark-800 border border-dark-700 rounded-xl max-w-lg w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-400" />
                {created ? 'تم إنشاء الحساب ✓' : 'إنشاء مستخدم جديد'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!created ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">الاسم بالكامل *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="أحمد محمد" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">البريد الإلكتروني *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="ahmed@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">كلمة السر *</label>
                  <div className="flex gap-2">
                    <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input flex-1 font-mono" />
                    <button type="button" onClick={() => setForm({ ...form, password: generatePassword() })} className="btn-secondary text-xs whitespace-nowrap">
                      توليد جديد
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">نوع الطالب</label>
                  <select value={form.student_type} onChange={(e) => setForm({ ...form, student_type: e.target.value })} className="input">
                    <option value="live">Live (محاضرات مباشرة)</option>
                    <option value="online">Online (محاضرات مسجلة)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">سجّله في كورس (اختياري)</label>
                  <select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} className="input">
                    <option value="">— لا يوجد —</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.type})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">لو اخترت كورس هيتسجل الطالب فيه فوراً</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button onClick={createUser} disabled={creating} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> جارِ الإنشاء...</> : 'إنشاء الحساب'}
                  </button>
                  <button onClick={closeModal} className="btn-secondary">إلغاء</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                  <p className="text-green-300 text-sm font-medium mb-3">✅ تم إنشاء الحساب بنجاح</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400">الإيميل:</span>
                      <span className="text-white font-mono">{created.email}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400">كلمة السر:</span>
                      <span className="text-white font-mono">{created.password}</span>
                    </div>
                    {created.courseTitle && (
                      <div className="flex justify-between gap-2">
                        <span className="text-slate-400">الكورس:</span>
                        <span className="text-white">{created.courseTitle}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-300">
                  ⚠️ احفظ كلمة السر الآن — لن تظهر مرة أخرى. ابعتها للطالب على واتساب أو إيميل.
                </div>

                <div className="flex gap-2">
                  <button onClick={copyCreds} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {copied ? <><Check className="w-4 h-4" /> تم النسخ</> : <><Copy className="w-4 h-4" /> نسخ البيانات</>}
                  </button>
                  <button onClick={closeModal} className="btn-secondary">تم</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
