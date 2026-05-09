'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Loader2, BookOpen, ShoppingCart, CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/utils';

interface Course {
  id: string; title: string; description: string; type: string;
  price: number; duration_hours: number;
}

interface FormValues { phone: string; }

export default function BuyCoursePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>();

  useEffect(() => {
    if (!user) { router.push(`/login?redirect=/courses/${id}/buy`); return; }
    api.get(`/courses/${id}`).then(({ data }) => {
      setCourse(data.course);
      if (data.course.type === 'live') {
        toast.error('الكورسات المباشرة لا تُشترى أونلاين');
        router.push(`/courses/${id}`);
      }
    }).finally(() => setLoading(false));
  }, [id, user, router]);

  // Poll payment status when iframe is shown
  useEffect(() => {
    if (!paymentId || !polling) return;
    const interval = setInterval(async () => {
      try {
        const { data } = await api.get('/payments/my');
        const payment = data.find((p: any) => p.id === paymentId);
        if (payment?.status === 'success') {
          clearInterval(interval);
          setPolling(false);
          toast.success('تم الدفع بنجاح! تم تسجيلك في الكورس 🎉');
          setTimeout(() => router.push(`/courses/${id}`), 1500);
        } else if (payment?.status === 'failed') {
          clearInterval(interval);
          setPolling(false);
          toast.error('فشل الدفع — حاول مرة أخرى');
          setIframeUrl(null);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [paymentId, polling, id, router]);

  const onSubmit = async (data: FormValues) => {
    try {
      const res = await api.post('/payments/initiate', {
        course_id: id,
        phone: data.phone,
      });
      setIframeUrl(res.data.iframe_url);
      setPaymentId(res.data.payment_id);
      setPolling(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'تعذر بدء عملية الدفع');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen bg-dark-900">
      <div className="border-b border-dark-700 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href={`/courses/${id}`} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4" /> رجوع
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {!iframeUrl ? (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Order summary */}
            <div className="card">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-brand-400" /> ملخص الطلب
              </h2>
              <div className="w-full h-32 bg-gradient-to-br from-brand-500/30 to-purple-500/30 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="w-10 h-10 text-brand-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{course.title}</h3>
              <p className="text-slate-400 text-sm mb-4 line-clamp-3">{course.description}</p>
              <div className="border-t border-dark-700 pt-4 space-y-2 text-sm text-slate-400">
                <div className="flex justify-between"><span>المدة</span><span className="text-white">{course.duration_hours} ساعة</span></div>
                <div className="flex justify-between"><span>النوع</span><span className="text-white capitalize">{course.type}</span></div>
                <div className="flex justify-between text-lg font-bold border-t border-dark-700 pt-3 mt-3">
                  <span className="text-slate-300">الإجمالي</span>
                  <span className="text-white">{formatPrice(course.price)}</span>
                </div>
              </div>
            </div>

            {/* Payment form */}
            <div className="card">
              <h2 className="text-lg font-bold text-white mb-4">بيانات الدفع</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">الاسم</label>
                  <input value={user?.name || ''} disabled className="input opacity-70" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">البريد الإلكتروني</label>
                  <input value={user?.email || ''} disabled className="input opacity-70" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">رقم الموبايل</label>
                  <input
                    {...register('phone', { required: 'رقم الموبايل مطلوب', pattern: { value: /^01\d{9}$/, message: 'أدخل رقم موبايل صحيح (01xxxxxxxxx)' } })}
                    type="tel"
                    placeholder="01xxxxxxxxx"
                    className="input"
                  />
                  {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-300">
                  💳 الدفع آمن عبر Paymob — فيزا، ماستركارد، فودافون كاش، فوري
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
                  {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> جارِ التحميل...</> : `ادفع ${formatPrice(course.price)}`}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="flex items-center gap-2 text-yellow-400 text-sm mb-4">
              <Loader2 className="w-4 h-4 animate-spin" /> في انتظار إكمال الدفع...
            </div>
            <iframe
              src={iframeUrl}
              className="w-full rounded-lg border border-dark-700"
              style={{ height: '700px' }}
              title="Paymob Payment"
            />
            <div className="mt-4 flex items-center justify-between">
              <p className="text-slate-400 text-xs">سيتم تسجيلك تلقائياً في الكورس بعد إتمام الدفع بنجاح</p>
              <button
                onClick={() => { setIframeUrl(null); setPolling(false); }}
                className="text-sm text-slate-400 hover:text-white"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
