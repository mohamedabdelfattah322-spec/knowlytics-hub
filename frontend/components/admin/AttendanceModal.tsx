'use client';
import { useEffect, useState } from 'react';
import { X, Loader2, Check, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

interface AttRow {
  user_id: string; name: string; email: string;
  attendance_id: string | null; attended: boolean | null; notes: string | null;
}

export default function AttendanceModal({
  batchId, recording, onClose,
}: {
  batchId: string;
  recording: { id: string; title: string };
  onClose: () => void;
}) {
  const [rows, setRows] = useState<AttRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/batches/${batchId}/recordings/${recording.id}/attendance`)
      .then(({ data }) => {
        setRows(data.map((r: AttRow) => ({
          ...r,
          attended: r.attended ?? false,
        })));
      }).finally(() => setLoading(false));
  }, [batchId, recording.id]);

  const toggle = (uid: string) => {
    setRows((p) => p.map((r) => r.user_id === uid ? { ...r, attended: !r.attended } : r));
  };

  const updateNotes = (uid: string, notes: string) => {
    setRows((p) => p.map((r) => r.user_id === uid ? { ...r, notes } : r));
  };

  const markAll = (val: boolean) => {
    setRows((p) => p.map((r) => ({ ...r, attended: val })));
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.post(`/batches/${batchId}/recordings/${recording.id}/attendance`, {
        records: rows.map((r) => ({ user_id: r.user_id, attended: r.attended, notes: r.notes })),
      });
      toast.success('✅ تم حفظ الحضور');
      onClose();
    } catch { toast.error('فشل الحفظ'); }
    finally { setSaving(false); }
  };

  const presentCount = rows.filter((r) => r.attended).length;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-dark-800 border border-dark-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">📋 تسجيل الحضور</h2>
            <p className="text-slate-400 text-sm">{recording.title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="badge badge-green">✅ {presentCount} حاضر</span>
          <span className="badge badge-red">❌ {rows.length - presentCount} غائب</span>
          <button onClick={() => markAll(true)} className="text-xs text-green-400 hover:underline mr-auto">حدد الكل حاضر</button>
          <button onClick={() => markAll(false)} className="text-xs text-red-400 hover:underline">حدد الكل غائب</button>
        </div>

        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>
          ) : rows.length === 0 ? (
            <div className="text-center py-10 text-slate-400">لا يوجد طلاب في الدفعة</div>
          ) : (
            <div className="space-y-1.5">
              {rows.map((r) => (
                <div key={r.user_id} className={cn('flex items-center gap-3 p-2.5 rounded-lg border transition-colors',
                  r.attended ? 'border-green-500/30 bg-green-500/5' : 'border-dark-700 bg-dark-900/30'
                )}>
                  <button onClick={() => toggle(r.user_id)}
                    className={cn('w-8 h-8 rounded-lg flex items-center justify-center transition-colors flex-shrink-0',
                      r.attended ? 'bg-green-500/20 text-green-400' : 'bg-red-500/10 text-red-400'
                    )}>
                    {r.attended ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{r.name}</p>
                    <p className="text-xs text-slate-500 truncate">{r.email}</p>
                  </div>
                  <input type="text" value={r.notes || ''}
                    onChange={(e) => updateNotes(r.user_id, e.target.value)}
                    placeholder="ملاحظات..."
                    className="input text-xs py-1 w-32 hidden sm:block" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4 pt-4 border-t border-dark-700">
          <button onClick={save} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            حفظ الحضور
          </button>
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
        </div>
      </div>
    </div>
  );
}
