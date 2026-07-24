'use client';
import { useState, useEffect } from 'react';
import { Users, Plus, Loader2, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface Team {
  id: string;
  name: string;
  owner_name: string;
  logo_url: string;
  max_members: number;
  member_count: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const fetch = async () => {
    try {
      const { data } = await api.get('/teams/all');
      setTeams(data);
    } catch { toast.error('فشل تحميل الفرق'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const viewTeam = async (id: string) => {
    try {
      const { data } = await api.get(`/teams/${id}`);
      setSelected(data);
    } catch { toast.error('فشل تحميل تفاصيل الفريق'); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Users className="w-6 h-6 text-brand-400" /> الفرق والشركات
      </h1>

      {teams.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">لا توجد فرق حتى الآن</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700 text-slate-400">
                <th className="text-right py-3 px-4">الفريق</th>
                <th className="text-right py-3 px-4">المالك</th>
                <th className="text-right py-3 px-4">الأعضاء</th>
                <th className="text-right py-3 px-4">الحالة</th>
                <th className="text-right py-3 px-4">تاريخ الإنشاء</th>
                <th className="text-right py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {teams.map(t => (
                <tr key={t.id} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                  <td className="py-3 px-4 text-white font-medium">{t.name}</td>
                  <td className="py-3 px-4 text-slate-300">{t.owner_name}</td>
                  <td className="py-3 px-4 text-brand-400">{t.member_count}/{t.max_members}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs ${t.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {t.is_active ? 'نشط' : 'معطل'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs">{new Date(t.created_at).toLocaleDateString('ar-EG')}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => viewTeam(t.id)} className="text-slate-400 hover:text-brand-400">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Team detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setSelected(null)}>
          <div className="card w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-lg mb-4">{selected.team.name}</h3>
            <h4 className="text-slate-400 text-sm mb-2">الأعضاء ({selected.members.length})</h4>
            <div className="space-y-2 mb-4">
              {selected.members.map((m: any) => (
                <div key={m.user_id} className="flex items-center gap-3 py-2 border-b border-dark-700">
                  <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-bold">
                    {m.name?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{m.name}</p>
                    <p className="text-slate-500 text-xs">{m.email}</p>
                  </div>
                  <span className="text-xs text-slate-400 capitalize">{m.role}</span>
                </div>
              ))}
            </div>
            <h4 className="text-slate-400 text-sm mb-2">الكورسات المعينة ({selected.assignments.length})</h4>
            <div className="space-y-2">
              {selected.assignments.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b border-dark-700">
                  <span className="text-white text-sm">{a.course_title}</span>
                  {a.deadline && <span className="text-xs text-slate-500">{new Date(a.deadline).toLocaleDateString('ar-EG')}</span>}
                </div>
              ))}
            </div>
            <button onClick={() => setSelected(null)} className="btn-outline w-full mt-4">إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}
