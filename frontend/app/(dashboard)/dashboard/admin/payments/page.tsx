'use client';
import { useEffect, useState } from 'react';
import { CreditCard, CheckCircle, XCircle, Clock as ClockIcon, Search, Filter } from 'lucide-react';
import api from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';

interface Payment {
  id: string;
  user_name: string;
  user_email: string;
  course_title: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  payment_method: string;
  customer_phone: string;
  paymob_txn_id: string;
  created_at: string;
  paid_at: string | null;
}

const StatusBadge = ({ status }: { status: Payment['status'] }) => {
  const variants = {
    success: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', icon: CheckCircle, label: 'ناجح' },
    pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: ClockIcon, label: 'قيد الانتظار' },
    failed: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', icon: XCircle, label: 'فشل' },
    refunded: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30', icon: XCircle, label: 'مُسترد' },
  };
  const v = variants[status] || variants.pending;
  const Icon = v.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', v.bg, v.text, v.border)}>
      <Icon className="w-3 h-3" /> {v.label}
    </span>
  );
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/payments', { params: { status: statusFilter || undefined, limit: 200 } })
      .then(({ data }) => setPayments(data))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const filtered = payments.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return p.user_name?.toLowerCase().includes(q) ||
           p.user_email?.toLowerCase().includes(q) ||
           p.course_title?.toLowerCase().includes(q) ||
           p.paymob_txn_id?.includes(q);
  });

  const totalEarnings = payments
    .filter((p) => p.status === 'success')
    .reduce((sum, p) => sum + parseFloat(String(p.amount)), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-brand-400" /> المدفوعات
        </h1>
        <p className="text-slate-400 text-sm">جميع معاملات Paymob للكورسات</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <p className="text-slate-400 text-xs mb-1">إجمالي المعاملات</p>
          <p className="text-2xl font-bold text-white">{payments.length}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-xs mb-1">عمليات ناجحة</p>
          <p className="text-2xl font-bold text-green-400">{payments.filter((p) => p.status === 'success').length}</p>
        </div>
        <div className="card">
          <p className="text-slate-400 text-xs mb-1">إجمالي الدخل</p>
          <p className="text-2xl font-bold text-brand-400">{formatCurrency(totalEarnings)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="بحث بالاسم، الإيميل، الكورس، أو رقم العملية..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-auto">
            <option value="">كل الحالات</option>
            <option value="success">ناجح</option>
            <option value="pending">قيد الانتظار</option>
            <option value="failed">فشل</option>
            <option value="refunded">مُسترد</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-dark-700">
              <th className="py-3 px-2">الطالب</th>
              <th className="py-3 px-2">الكورس</th>
              <th className="py-3 px-2">المبلغ</th>
              <th className="py-3 px-2">الحالة</th>
              <th className="py-3 px-2">طريقة الدفع</th>
              <th className="py-3 px-2">الموبايل</th>
              <th className="py-3 px-2">رقم العملية</th>
              <th className="py-3 px-2">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse border-b border-dark-700">
                  <td colSpan={8} className="py-4"><div className="h-4 bg-dark-700 rounded" /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="py-12 text-center text-slate-400">لا توجد معاملات</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b border-dark-700/60 hover:bg-dark-800/50">
                  <td className="py-3 px-2">
                    <div className="text-white font-medium">{p.user_name}</div>
                    <div className="text-slate-500 text-xs">{p.user_email}</div>
                  </td>
                  <td className="py-3 px-2 text-slate-300 max-w-xs truncate">{p.course_title}</td>
                  <td className="py-3 px-2 text-white font-medium">{formatCurrency(p.amount)}</td>
                  <td className="py-3 px-2"><StatusBadge status={p.status} /></td>
                  <td className="py-3 px-2 text-slate-400 capitalize">{p.payment_method || '—'}</td>
                  <td className="py-3 px-2 text-slate-400">{p.customer_phone || '—'}</td>
                  <td className="py-3 px-2 text-slate-500 text-xs font-mono">{p.paymob_txn_id || '—'}</td>
                  <td className="py-3 px-2 text-slate-400 text-xs">
                    {new Date(p.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
