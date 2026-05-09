'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import {
  Loader2, BookOpen, ShoppingCart, ArrowLeft, CreditCard,
  Smartphone, Store, Wallet, Globe2, CheckCircle, Copy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice } from '@/lib/utils';

interface Course {
  id: string; title: string; description: string; type: string;
  price: number; duration_hours: number;
}

type Method = 'card' | 'wallet' | 'kiosk' | 'valu' | 'stripe';

interface MethodsResponse {
  paymob: { enabled: boolean; methods: Record<string, boolean> };
  stripe: { enabled: boolean };
}

interface FormValues { phone: string; wallet_number?: string }

const METHOD_INFO: Record<Method, { label: string; icon: any; desc: string; foreign?: boolean }> = {
  card:   { label: 'فيزا / ماستركارد / ميزة',   icon: CreditCard, desc: 'دفع آمن بالبطاقة عبر Paymob' },
  wallet: { label: 'محفظة / إنستاباي',          icon: Smartphone, desc: 'فودافون كاش، أورانج موني، إنستاباي' },
  kiosk:  { label: 'فوري / أمان (نقدي)',         icon: Store,      desc: 'ادفع نقداً في أي منفذ فوري أو أمان' },
  valu:   { label: 'ڤاليو (تقسيط)',              icon: Wallet,     desc: 'قسّط على 6/9/12/18 شهر' },
  stripe: { label: 'بطاقة دولية (خارج مصر)',    icon: Globe2,     desc: 'Visa / Mastercard / Apple Pay — بالدولار', foreign: true },
};

export default function BuyCoursePage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [methods, setMethods] = useState<MethodsResponse | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<Method>('card');

  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [kioskRef, setKioskRef] = useState<string | null>(null);
  const [walletMessage, setWalletMessage] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormValues>();

  // Stripe success / cancel return handler
  useEffect(() => {
    const status = searchParams.get('status');
    const pid = searchParams.get('payment_id');
    if (status === 'success' && pid) {
      toast.success('تم الدفع بنجاح! 🎉');
      setTimeout(() => router.push(`/courses/${id}`), 1500);
    } else if (status === 'cancel') {
      toast.error('تم إلغاء الدفع');
    }
  }, [searchParams, id, router]);

  useEffect(() => {
    if (!user) { router.push(`/login?redirect=/courses/${id}/buy`); return; }
    Promise.all([
      api.get(`/courses/${id}`),
      api.get('/payments/methods'),
    ]).then(([cRes, mRes]) => {
      setCourse(cRes.data.course);
      setMethods(mRes.data);
      // Pick first enabled method as default
      const m = mRes.data as MethodsResponse;
      if (m.paymob.enabled) {
        const first = (['card', 'wallet', 'kiosk', 'valu'] as Method[]).find((k) => m.paymob.methods[k]);
        if (first) setSelectedMethod(first);
      } else if (m.stripe.enabled) {
        setSelectedMethod('stripe');
      }
      if (cRes.data.course.type === 'live') {
        toast.error('الكورسات المباشرة لا تُشترى أونلاين');
        router.push(`/courses/${id}`);
      }
    }).finally(() => setLoading(false));
  }, [id, user, router]);

  // Poll payment status
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
          setKioskRef(null);
          setWalletMessage(null);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [paymentId, polling, id, router]);

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    try {
      const res = await api.post('/payments/initiate', {
        course_id: id,
        phone: data.phone,
        method: selectedMethod,
        wallet_number: data.wallet_number,
      });
      const { type, iframe_url, redirect_url, url, reference, message, payment_id } = res.data;
      setPaymentId(payment_id);
      setPolling(true);

      if (type === 'iframe') setIframeUrl(iframe_url);
      else if (type === 'redirect') window.location.href = url;
      else if (type === 'wallet') {
        setWalletMessage(message);
        if (redirect_url) window.open(redirect_url, '_blank');
      }
      else if (type === 'kiosk') setKioskRef(reference);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'تعذر بدء عملية الدفع');
    } finally {
      setSubmitting(false);
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

  const availableMethods: Method[] = [];
  if (methods?.paymob.enabled) {
    if (methods.paymob.methods.card)   availableMethods.push('card');
    if (methods.paymob.methods.wallet) availableMethods.push('wallet');
    if (methods.paymob.methods.kiosk)  availableMethods.push('kiosk');
    if (methods.paymob.methods.valu)   availableMethods.push('valu');
  }
  if (methods?.stripe.enabled) availableMethods.push('stripe');

  // ─── Show payment-in-progress UI ───
  if (iframeUrl || kioskRef || walletMessage) {
    return (
      <div className="min-h-screen bg-dark-900">
        <div className="max-w-3xl mx-auto px-6 py-10">
          {iframeUrl && (
            <div className="card">
              <div className="flex items-center gap-2 text-yellow-400 text-sm mb-4">
                <Loader2 className="w-4 h-4 animate-spin" /> في انتظار إكمال الدفع...
              </div>
              <iframe src={iframeUrl} className="w-full rounded-lg border border-dark-700" style={{ height: '700px' }} title="Payment" />
              <div className="mt-4 flex items-center justify-between">
                <p className="text-slate-400 text-xs">سيتم تسجيلك تلقائياً في الكورس بعد إتمام الدفع</p>
                <button onClick={() => { setIframeUrl(null); setPolling(false); }} className="text-sm text-slate-400 hover:text-white">إلغاء</button>
              </div>
            </div>
          )}

          {kioskRef && (
            <div className="card">
              <div className="text-center py-6">
                <Store className="w-14 h-14 text-brand-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-3">رقم الدفع المرجعي</h2>
                <p className="text-slate-400 text-sm mb-4">اذهب لأقرب فرع <strong className="text-white">فوري</strong> أو <strong className="text-white">أمان</strong> وادفع باستخدام الرقم التالي:</p>
                <div className="bg-dark-800 border-2 border-brand-500 rounded-xl p-6 mb-4 inline-block">
                  <p className="text-3xl font-mono font-bold text-brand-400 tracking-wider">{kioskRef}</p>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(kioskRef); toast.success('تم النسخ'); }}
                  className="btn-secondary flex items-center gap-2 mx-auto"
                >
                  <Copy className="w-4 h-4" /> نسخ الرقم
                </button>
                <p className="text-slate-500 text-xs mt-6">سيتم تسجيلك تلقائياً في الكورس بمجرد إتمام الدفع. الرقم صالح لمدة 24 ساعة.</p>
              </div>
            </div>
          )}

          {walletMessage && (
            <div className="card">
              <div className="text-center py-6">
                <Smartphone className="w-14 h-14 text-brand-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-3">أكمل الدفع على محفظتك</h2>
                <p className="text-slate-300 text-sm">{walletMessage}</p>
                <p className="text-slate-500 text-xs mt-6">سيتم تأكيد الدفع تلقائياً بعد إكماله من تطبيق محفظتك.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Main checkout form ───
  return (
    <div className="min-h-screen bg-dark-900">
      <div className="border-b border-dark-700 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href={`/courses/${id}`} className="text-slate-400 hover:text-white flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4" /> رجوع
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order summary */}
          <div className="card lg:col-span-1 h-fit">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-brand-400" /> ملخص الطلب
            </h2>
            <div className="w-full h-28 bg-gradient-to-br from-brand-500/30 to-purple-500/30 rounded-lg flex items-center justify-center mb-3">
              <BookOpen className="w-8 h-8 text-brand-400" />
            </div>
            <h3 className="font-semibold text-white text-sm mb-2 line-clamp-2">{course.title}</h3>
            <p className="text-slate-400 text-xs mb-4 line-clamp-2">{course.description}</p>
            <div className="border-t border-dark-700 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-400"><span>المدة</span><span className="text-white">{course.duration_hours} ساعة</span></div>
              <div className="flex justify-between text-slate-400"><span>النوع</span><span className="text-white capitalize">{course.type}</span></div>
              <div className="flex justify-between font-bold border-t border-dark-700 pt-3 mt-3">
                <span className="text-slate-300">الإجمالي</span>
                <span className="text-white text-lg">{formatPrice(course.price)}</span>
              </div>
              {selectedMethod === 'stripe' && (
                <p className="text-xs text-blue-400 mt-2">💱 سيُحوَّل إلى الدولار عند الدفع</p>
              )}
            </div>
          </div>

          {/* Payment method selector + form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Method cards */}
            <div>
              <h2 className="text-base font-bold text-white mb-3">اختر وسيلة الدفع</h2>
              {availableMethods.length === 0 ? (
                <div className="card text-center py-6">
                  <p className="text-slate-400 text-sm">لا توجد وسائل دفع متاحة حالياً.</p>
                  <p className="text-slate-500 text-xs mt-1">يرجى التواصل مع الإدارة لتفعيل الدفع.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {availableMethods.map((m) => {
                    const info = METHOD_INFO[m];
                    const Icon = info.icon;
                    const active = selectedMethod === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSelectedMethod(m)}
                        className={`p-4 rounded-xl border-2 text-right transition-all ${
                          active
                            ? 'border-brand-500 bg-brand-500/10'
                            : 'border-dark-700 bg-dark-800 hover:border-dark-600'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${active ? 'bg-brand-500/20' : 'bg-dark-700'}`}>
                            <Icon className={`w-5 h-5 ${active ? 'text-brand-400' : 'text-slate-400'}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-sm">{info.label}</span>
                              {active && <CheckCircle className="w-4 h-4 text-brand-400" />}
                              {info.foreign && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">دولي</span>}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">{info.desc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Form */}
            {availableMethods.length > 0 && (
              <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
                <h3 className="font-semibold text-white text-sm">بيانات الدفع</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">الاسم</label>
                    <input value={user?.name || ''} disabled className="input opacity-60 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">البريد</label>
                    <input value={user?.email || ''} disabled className="input opacity-60 text-sm" />
                  </div>
                </div>

                {selectedMethod !== 'stripe' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">رقم الموبايل *</label>
                    <input
                      {...register('phone', {
                        required: 'رقم الموبايل مطلوب',
                        pattern: { value: /^01\d{9}$/, message: 'أدخل رقم موبايل مصري صحيح' },
                      })}
                      type="tel"
                      placeholder="01xxxxxxxxx"
                      className="input"
                    />
                    {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
                  </div>
                )}

                {selectedMethod === 'wallet' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">رقم المحفظة *</label>
                    <input
                      {...register('wallet_number', {
                        required: selectedMethod === 'wallet' ? 'رقم المحفظة مطلوب' : false,
                        pattern: { value: /^01\d{9}$/, message: 'أدخل رقم محفظة صحيح' },
                      })}
                      type="tel"
                      placeholder="01xxxxxxxxx"
                      className="input"
                    />
                    {errors.wallet_number && <p className="text-red-400 text-xs mt-1">{errors.wallet_number.message}</p>}
                    <p className="text-xs text-slate-500 mt-1">سيُرسل طلب الدفع لهذا الرقم — أكمله من تطبيق المحفظة.</p>
                  </div>
                )}

                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-300">
                  🔒 الدفع آمن ومشفّر. لن يتم خصم أي مبلغ إلا بعد تأكيدك.
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> جارِ التحويل...</>
                    : `ادفع ${formatPrice(course.price)}`
                  }
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
