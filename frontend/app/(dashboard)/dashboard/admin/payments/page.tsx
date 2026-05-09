'use client';
import { useEffect, useState } from 'react';
import {
  CreditCard, CheckCircle, XCircle, Clock as ClockIcon,
  Search, Filter, RotateCcw, FileText, X, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';

interface Payment {
  id: string;
  user_name: string;
  user_email: string;
  course_title: string | null;
  bundle_name: string | null;
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
    success:  { bg: 'bg-green-500/10',  text: 'text-green-400',  border: 'border-green-500/30',  icon: CheckCircle, label: 'ناجح' },
    pending:  { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: ClockIcon,   label: 'قيد الانتظار' },
    failed:   { bg: 'bg-red-500/10',    text: 'text-red-400',    border: 'border-red-500/30',    icon: XCircle,     label: 'فشل' },
    refunded: { bg: 'bg-slate-500/10',  text: 'text-slate-400',  border: 'border-slate-500/30',  icon: RotateCcw,   label: 'مُسترد' },
  };
  const v = variants[status] || variants.pending;
  const Icon = v.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', v.bg, v.text, v.border)}>
      <Icon className="w-3 h-3" /> {v.label}
    </span>
  );
};

// ─── Invoice Modal ────────────────────────────────────────
function InvoiceModal({ paymentId, onClose }: { paymentId: string; onClose: () => void }) {
  const [inv, setInv] = useState<any>(null);
  useEffect(() => {
    api.get(`/payments/${paymentId}/invoice`).then(({ data }) => setInv(data)).catch(() => {
      toast.error('لا يمكن تحميل الفاتورة');
      onClose();
    });
  }, [paymentId]);

  if (!inv) return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0">
      <div id="invoice-print" className="bg-white text-gray-900 rounded-xl max-w-lg w-full p-8 shadow-2xl print:shadow-none print:rounded-none print:max-w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 print:hidden-close">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">🎓 Knowlytics Hub</h1>
            <p className="text-sm text-gray-500">فاتورة رسمية</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 print:hidden">
            <X className="w-5 h-5" />
          </button>
        </div>
        <hr className="mb-4" />

        {/* Invoice Meta */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-gray-500">رقم الفاتورة</p>
            <p className="font-mono font-bold">{inv.invoice_number}</p>
          </div>
          <div>
            <p className="text-gray-500">تاريخ الإصدار</p>
            <p>{new Date(inv.issued_at).toLocaleDateString('ar-EG', { dateStyle: 'long' })}</p>
          </div>
          <div>
            <p className="text-gray-500">الحالة</p>
            <p className={cn('font-semibold', inv.status === 'refunded' ? 'text-red-500' : 'text-green-600')}>
              {inv.status === 'refunded' ? 'مُسترد' : 'مدفوع'}
            </p>
          </div>
          {inv.paymob_txn_id && (
            <div>
              <p className="text-gray-500">رقم المعاملة</p>
              <p className="font-mono text-xs">{inv.paymob_txn_id}</p>
            </div>
          )}
        </div>

        {/* Customer */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-2">بيانات العميل</p>
          <p className="font-semibold text-gray-800">{inv.customer.name}</p>
          <p className="text-sm text-gray-600">{inv.customer.email}</p>
          {inv.customer.phone && <p className="text-sm text-gray-600">{inv.customer.phone}</p>}
        </div>

        {/* Items */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-2 text-right text-gray-500 font-medium">البند</th>
              <th className="py-2 text-left text-gray-500 font-medium">المبلغ</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-3 text-right">{inv.item_title}</td>
              <td className="py-3 text-left font-semibold">{inv.amount.toLocaleString('ar-EG')} جنيه</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td className="py-3 text-right font-bold text-gray-800">الإجمالي</td>
              <td className="py-3 text-left font-bold text-indigo-600 text-lg">{inv.amount.toLocaleString('ar-EG')} جنيه</td>
            </tr>
          </tfoot>
        </table>

        <hr className="mb-4" />
        <p className="text-center text-xs text-gray-400">شكراً لثقتك بـ Knowlytics Hub — منصة التعليم المتقدم</p>

        {/* Actions */}
        <div className="flex gap-2 mt-4 print:hidden">
          <button onClick={() => window.print()} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
            🖨️ طباعة / PDF
          </button>
          <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Refund Modal ──────────────────────────────────────────
function RefundModal({ payment, onClose, onDone }: { payment: Payment; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api.post(`/payments/${payment.id}/refund`, { reason });
      toast.success('✅ تم الاسترداد بنجاح');
      onDone();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'فشل الاسترداد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-dark-600 rounded-xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
            <RotateCcw className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">استرداد المبلغ</h2>
            <p className="text-sm text-slate-400">{payment.user_name} — {formatCurrency(payment.amount)}</p>
          </div>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-red-300 text-sm">⚠️ سيتم إلغاء التسجيل وتعطيل الوصول للكورس فوراً</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-slate-300 mb-1">سبب الاسترداد (اختياري)</label>
          <textarea
            value={reason} onChange={(e) => setReason(e.target.value)}
            rows={3} className="input resize-none w-full"
            placeholder="مثلاً: طلب العميل، مشكلة تقنية..."
          />
        </div>

        <div className="flex gap-2">
          <button onClick={submit} disabled={loading} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            تأكيد الاسترداد
          </button>
          <button onClick={onClose} className="btn-secondary">إلغاء</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [refundPayment, setRefundPayment] = useState<Payment | null>(null);

  const load = () => {
    setLoading(true);
    api.get('/payments', { params: { status: statusFilter || undefined, limit: 200 } })
      .then(({ data }) => setPayments(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  const filtered = payments.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return p.user_name?.toLowerCase().includes(q) ||
           p.user_email?.toLowerCase().includes(q) ||
           (p.course_title || '').toLowerCase().includes(q) ||
           (p.bundle_name || '').toLowerCase().includes(q) ||
           p.paymob_txn_id?.includes(q);
  });

  const totalEarnings = payments.filter((p) => p.status === 'success').reduce((s, p) => s + parseFloat(String(p.amount)), 0);
  const refundedTotal = payments.filter((p) => p.status === 'refunded').reduce((s, p) => s + parseFloat(String(p.amount)), 0);

  return (
    <div>
      {invoiceId && <InvoiceModal paymentId={invoiceId} onClose={() => setInvoiceId(null)} />}
      {refundPayment && <RefundModal payment={refundPayment} onClose={() => setRefundPayment(null)} onDone={load} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-brand-400" /> المدفوعات
        </h1>
        <p className="text-slate-400 text-sm">جميع معاملات Paymob — كورسات وباقات</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <div className="card"><p className="text-slate-400 text-xs mb-1">إجمالي المعاملات</p>
          <p className="text-2xl font-bold text-white">{payments.length}</p></div>
        <div className="card"><p className="text-slate-400 text-xs mb-1">ناجحة</p>
          <p className="text-2xl font-bold text-green-400">{payments.filter((p) => p.status === 'success').length}</p></div>
        <div className="card"><p className="text-slate-400 text-xs mb-1">إجمالي الدخل</p>
          <p className="text-2xl font-bold text-brand-400">{formatCurrency(totalEarnings)}</p></div>
        <div className="card"><p className="text-slate-400 text-xs mb-1">مُسترد</p>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(refundedTotal)}</p></div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
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
              <th className="py-3 px-2">البند</th>
              <th className="py-3 px-2">المبلغ</th>
              <th className="py-3 px-2">الحالة</th>
              <th className="py-3 px-2">الموبايل</th>
              <th className="py-3 px-2">رقم العملية</th>
              <th className="py-3 px-2">التاريخ</th>
              <th className="py-3 px-2">إجراءات</th>
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
                  <td className="py-3 px-2 text-slate-300 max-w-[180px] truncate">
                    {p.course_title || p.bundle_name || '—'}
                    {p.bundle_name && <span className="ml-1 text-xs text-purple-400">باقة</span>}
                  </td>
                  <td className="py-3 px-2 text-white font-medium">{formatCurrency(p.amount)}</td>
                  <td className="py-3 px-2"><StatusBadge status={p.status} /></td>
                  <td className="py-3 px-2 text-slate-400">{p.customer_phone || '—'}</td>
                  <td className="py-3 px-2 text-slate-500 text-xs font-mono">{p.paymob_txn_id || '—'}</td>
                  <td className="py-3 px-2 text-slate-400 text-xs">
                    {new Date(p.created_at).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-1">
                      {(p.status === 'success' || p.status === 'refunded') && (
                        <button onClick={() => setInvoiceId(p.id)} className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded" title="عرض الفاتورة">
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      {p.status === 'success' && (
                        <button onClick={() => setRefundPayment(p)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded" title="استرداد">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
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
