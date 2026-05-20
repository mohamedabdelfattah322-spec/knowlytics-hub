'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Trash2, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatPrice } from '@/lib/utils';

interface CartItem {
  id: string;
  course_id: string | null;
  bundle_id: string | null;
  course_title: string | null;
  course_thumbnail: string | null;
  course_price: number;
  course_type: string | null;
  instructor_name: string | null;
  bundle_name: string | null;
  bundle_price: number;
  bundle_thumbnail: string | null;
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const { data } = await api.get('/cart');
      setItems(data.items);
      setTotal(data.total);
    } catch { toast.error('فشل تحميل السلة'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCart(); }, []);

  const removeItem = async (id: string) => {
    try {
      await api.delete(`/cart/${id}`);
      toast.success('تم الحذف');
      fetchCart();
    } catch { toast.error('فشل الحذف'); }
  };

  const clearAll = async () => {
    try {
      await api.delete('/cart/clear');
      toast.success('تم تفريغ السلة');
      setItems([]);
      setTotal(0);
    } catch { toast.error('فشل تفريغ السلة'); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-brand-400" /> سلة المشتريات
          </h1>
          <p className="text-slate-400 text-sm mt-1">{items.length} عنصر في السلة</p>
        </div>
        {items.length > 0 && (
          <button onClick={clearAll} className="text-sm text-red-400 hover:text-red-300">
            تفريغ السلة
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card text-center py-12">
          <ShoppingCart className="w-16 h-16 mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">السلة فارغة</p>
          <Link href="/courses" className="btn-primary inline-block mt-4">تصفح الكورسات</Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="card flex items-center gap-4">
                <div className="w-20 h-14 bg-dark-700 rounded overflow-hidden flex-shrink-0">
                  {(item.course_thumbnail || item.bundle_thumbnail) && (
                    <Image
                      src={item.course_thumbnail || item.bundle_thumbnail || ''}
                      alt=""
                      width={80}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {item.course_title || item.bundle_name}
                  </p>
                  {item.instructor_name && (
                    <p className="text-slate-400 text-xs">{item.instructor_name}</p>
                  )}
                </div>
                <p className="text-brand-400 font-bold whitespace-nowrap">
                  {formatPrice(item.course_price || item.bundle_price)}
                </p>
                <button onClick={() => removeItem(item.id)} className="text-slate-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-300">الإجمالي</span>
              <span className="text-2xl font-bold text-brand-400">{formatPrice(total)}</span>
            </div>
            <Link
              href={`/courses/${items[0]?.course_id}/buy`}
              className="btn-primary w-full text-center block"
            >
              متابعة الشراء
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
