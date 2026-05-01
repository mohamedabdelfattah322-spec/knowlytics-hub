'use client';
import { useEffect, useState } from 'react';
import { Shield, RefreshCw, Monitor } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/lib/api';

interface Session {
  id: string; name: string; email: string;
  device_id: string; ip_address: string; created_at: string;
}

export default function ActiveSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/admin/sessions').then(({ data }) => setSessions(data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-400" /> Active Sessions
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor all currently logged-in users · Max {process.env.NEXT_PUBLIC_MAX_SESSIONS || 2} sessions per user enforced
          </p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-700/50">
              <tr className="text-slate-400">
                <th className="text-left px-6 py-4 font-medium">User</th>
                <th className="text-left px-4 py-4 font-medium">Device ID</th>
                <th className="text-left px-4 py-4 font-medium">IP Address</th>
                <th className="text-left px-4 py-4 font-medium">Started</th>
                <th className="px-4 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {loading
                ? [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(5)].map((_, j) => <td key={j} className="px-4 py-4"><div className="h-4 bg-dark-700 rounded animate-pulse" /></td>)}</tr>
                ))
                : sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-200">{s.name}</p>
                      <p className="text-slate-500 text-xs">{s.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Monitor className="w-3.5 h-3.5" />
                        <span className="font-mono text-xs truncate max-w-[120px]">{s.device_id?.slice(0, 16)}…</span>
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs text-slate-300">{s.ip_address}</td>
                    <td className="px-4 py-4 text-slate-400 text-xs">
                      {format(new Date(s.created_at), 'MMM d, HH:mm')}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="badge badge-green">● Active</span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {!loading && sessions.length === 0 && (
            <div className="text-center py-12 text-slate-500">No active sessions</div>
          )}
        </div>
      </div>
    </div>
  );
}
