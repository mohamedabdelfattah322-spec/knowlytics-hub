'use client';
import { useEffect, useState } from 'react';
import { Search, Shield, ShieldOff, Trash2, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface User {
  id: string; name: string; email: string; role: string;
  student_type: string; is_active: boolean; created_at: string;
  enrollment_count: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/admin/users', { params: { search } })
      .then(({ data }) => setUsers(data.users))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  const toggleActive = async (user: User) => {
    try {
      await api.patch(`/admin/users/${user.id}`, { is_active: !user.is_active });
      toast.success(user.is_active ? 'User suspended' : 'User reactivated');
      load();
    } catch { toast.error('Failed to update user'); }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Permanently delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success('User deleted');
      load();
    } catch { toast.error('Failed to delete user'); }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 text-sm mt-1">{users.length} users</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-700/50">
              <tr className="text-slate-400">
                <th className="text-left px-6 py-4 font-medium">User</th>
                <th className="text-left px-4 py-4 font-medium">Role</th>
                <th className="text-left px-4 py-4 font-medium">Type</th>
                <th className="text-left px-4 py-4 font-medium">Enrollments</th>
                <th className="text-left px-4 py-4 font-medium">Joined</th>
                <th className="text-left px-4 py-4 font-medium">Status</th>
                <th className="px-4 py-4 font-medium">Actions</th>
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
                        {u.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 justify-center">
                        <button onClick={() => toggleActive(u)} title={u.is_active ? 'Suspend' : 'Activate'} className={cn('p-1.5 rounded-lg transition-colors', u.is_active ? 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10' : 'text-slate-400 hover:text-green-400 hover:bg-green-500/10')}>
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
    </div>
  );
}
