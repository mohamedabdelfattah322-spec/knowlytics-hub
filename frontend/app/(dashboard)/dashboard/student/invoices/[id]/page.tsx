'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Printer } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

export default function StudentInvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const [inv, setInv] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/payments/${id}/invoice`)
      .then(({ data }) => setInv(data))
      .catch(() => router.push('/dashboard/student'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>
  );
  if (!inv) return null;

  return (
    <div>
      {/* Controls — hidden when printing */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> رجوع
        </button>
        <button onClick={() => window.print()} className="btn-primary flex items-center gap-2">
          <Printer className="w-4 h-4" /> طباعة / حفظ PDF
        </button>
      </div>

      {/* Invoice Card */}
      <div id="invoice" className="max-w-2xl mx-auto bg-white text-gray-900 rounded-2xl p-10 shadow-xl print:shadow-none print:rounded-none print:max-w-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-indigo-600">🎓 Knowlytics Hub</h1>
            <p className="text-gray-500 text-sm mt-1">منصة التعليم الاحترافي</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-800">فاتورة</p>
            <p className="text-sm font-mono text-gray-500">{inv.invoice_number}</p>
          </div>
        </div>

        <hr className="border-gray-200 mb-8" />

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-6 mb-8 text-sm">
          <div>
            <p className="text-gray-400 text-xs uppercase font-semibold mb-1">مُصدرة لـ</p>
            <p className="font-semibold text-gray-800 text-base">{inv.customer.name}</p>
            <p className="text-gray-600">{inv.customer.email}</p>
            {inv.customer.phone && <p className="text-gray-600">{inv.customer.phone}</p>}
          </div>
          <div className="text-right">
            <div className="mb-2">
              <p className="text-gray-400 text-xs">تاريخ الإصدار</p>
              <p className="font-medium">{new Date(inv.issued_at).toLocaleDateString('ar-EG', { dateStyle: 'long' })}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">الحالة</p>
              <span className={cn(
                'inline-block px-3 py-1 rounded-full text-sm font-semibold',
                inv.status === 'refunded' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
              )}>
                {inv.status === 'refunded' ? 'مُسترد' : 'مدفوع'}
              </span>
            </div>
          </div>
        </div>

        {/* Items table */}
        <div className="rounded-xl overflow-hidden border border-gray-200 mb-8">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-right text-gray-500 font-medium">البند</th>
                <th className="py-3 px-4 text-left text-gray-500 font-medium">المبلغ</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-100">
                <td className="py-4 px-4 text-right">
                  <p className="font-medium text-gray-800">{inv.item_title}</p>
                  {inv.payment_method && <p className="text-xs text-gray-400 mt-0.5">عبر {inv.payment_method}</p>}
                </td>
                <td className="py-4 px-4 text-left font-semibold text-gray-800">
                  {inv.amount.toLocaleString('ar-EG')} جنيه
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-indigo-50 border-t-2 border-indigo-100">
              <tr>
                <td className="py-3 px-4 text-right font-bold text-gray-700">الإجمالي</td>
                <td className="py-3 px-4 text-left font-bold text-indigo-600 text-lg">
                  {inv.amount.toLocaleString('ar-EG')} جنيه
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Transaction ID */}
        {inv.paymob_txn_id && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6 text-center">
            <p className="text-xs text-gray-400 mb-1">رقم معاملة Paymob</p>
            <p className="font-mono text-sm text-gray-700">{inv.paymob_txn_id}</p>
          </div>
        )}

        <hr className="border-gray-200 mb-6" />
        <p className="text-center text-gray-400 text-xs">
          شكراً لثقتك بنا — Knowlytics Hub · knowlyticshub.com
        </p>
      </div>
    </div>
  );
}
