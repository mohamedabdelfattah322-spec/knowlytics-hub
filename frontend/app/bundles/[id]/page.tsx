'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import {
  Loader2, Package, BookOpen, Clock, Users, CreditCard, Smartphone,
  Store, Wallet, Globe2, CheckCircle, ArrowRight, Infinity, Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, cn } from '@/lib/utils';
import PublicNavbar from '@/components/PublicNavbar';
import PublicFooter from '@/components/PublicFooter';

interface BundleDetail {
  id: string; name: string; description: string;
  price: number; original_price: number | null;
  duration_days: number; thumbnail_url: string | null;
  is_active: boolean;
}

interface BundleCourse {
  id: string; title: string; thumbnail_url: string | null;
  type: string; level: string;
}

type Method = 'card' | 'wallet' | 'kiosk' | 'valu' | 'stripe' | 'easykash';
interface MethodsResponse {
  paymob: { enabled: boolean; methods: Record<string, boolean> };
  stripe: { enabled: boolean };
  easykash: { enabled: boolean };
}

const METHOD_INFO: Record<Method, { label: string; icon: any; desc: string }> = {
  card:     { label: 'فيزا / ماستركارد / ميزة', icon: CreditCard, desc: 'دفع آمن بالبطاقة عبر Paymob' },
  wallet:   { label: 'محفظة / إنستاباي',        icon: Smartphone, desc: 'فودافون كاش، أورانج موني، إنستاباي' },
  kiosk:    { label: 'فوري / أمان (نقدي)',       icon: Store,      desc: 'ادفع نقداً في أي منفذ فوري أو أمان' },
  valu:     { label: 'ڤاليو (تقسيط)',            icon: Wallet,     desc: 'قسّط على 6/9/12/18 شهر' },
  stripe:   { label: 'بطاقة دولية',             icon: Globe2,     desc: 'Visa / Mastercard — بالدولار' },
  easykash: { label: 'EasyKash',                 icon: CreditCard, desc: 'فيزا، فوري، محفظة، أمان' },
};

interface FormValues { phone: string; wallet_number?: string }

export default function BundleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [bundle, setBundle] = useState<BundleDetail | null>(null);
  const [courses, setCourses] = useState<BundleCourse[]>([]);
  const [methods, setMethods] = useState<MethodsResponse | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<Method>('card');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [kioskRef, setKioskRef] = useState<string | null>(null);
  const [walletMsg, setWalletMsg] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<{ valid: boolean; discount_type: string; discount_value: number; amount_off: number; final_price: number; coupon_id: string; error?: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormValues>();

  useEffect(() => {
    Promise.all([
      api.get(`/bundles/${id}`),
      api.get('/payments/methods'),
      user ? api.get('/bundles/my') : Promise.resolve({ data: [] }),
    ]).then(([bRes, mRes, myRes]) => {
      setBundle(bRes.data.bundle);
      setCourses(bRes.data.courses || []);
      setMethods(mRes.data);
      const m = mRes.data as MethodsResponse;
      if (m.paymob?.enabled) {
        const first = (['card', 'wallet', 'kiosk', 'valu'] as Method[]).find(k => m.paymob.methods[k]);
        if (first) setSelectedMethod(first);
      } else if (m.stripe?.enabled) setSelectedMethod('stripe');
      else if (m.easykash?.enabled) setSelectedMethod('easykash');
      const myBundles: any[] = myRes.data || [];
      setIsSubscribed(myBundles.some((b: any) => b.bundle_id === id && b.active_now));
    }).catch(() => toast.error('حدث خطأ في تحميل الباقة'))
      .finally(() => setLoading(false));
  }, [id, user]);

  // Poll payment status
  useEffect(() => {
    if (!paymentId || !polling) return;
    const iv = setInterval(async () => {
      try {
        const { data } = await api.get('/payments/my');
        const p = data.find((x: any) => x.id === paymentId);
        if (p?.status === 'success') {
          clearInterval(iv); setPolling(false);
          toast.success('🎉 تم الاشتراك في الباقة بنجاح!');
          setTimeout(() => router.push('/dashboard/student/courses'), 1500);
        } else if (p?.status === 'failed') {
          clearInterval(iv); setPolling(false);
          toast.error('فشل الدفع — حاول مرة أخرى');
          setIframeUrl(null); setKioskRef(null); setWalletMsg(null);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(iv);
  }, [paymentId, polling, router]);

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponResult(null);
    try {
      const { data } = await api.post('/coupons/validate', { code: couponCode.trim(), bundle_id: id });
      setCouponResult(data);
      if (data.valid) toast.success('✅ كوبون صالح!');
      else toast.error(data.error || 'كوبون غير صالح');
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'كوبون غير صالح';
      setCouponResult({ valid: false, error: msg } as any);
      toast.error(msg);
    } finally { setCouponLoading(false); }
  };

  const finalPrice = couponResult?.valid ? couponResult.final_price : (bundle?.price ?? 0);

  const onSubmit = async (data: FormValues) => {
    if (!user) { router.push(`/login?redirect=/bundles/${id}`); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/payments/initiate', {
        bundle_id: id,
        phone: data.phone,
        method: selectedMethod,
        wallet_number: data.wallet_number,
        coupon_id: couponResult?.valid ? couponResult.coupon_id : undefined,
      });
      const { type, iframe_url, redirect_url, url, reference, message, payment_id } = res.data;
      if (type === 'free') {
        toast.success(message || '🎉 تم الاشتراك مجاناً!');
        setTimeout(() => router.push('/dashboard/student/courses'), 1500);
        return;
      }
      setPaymentId(payment_id);
      setPolling(true);
      if (type === 'iframe') setIframeUrl(iframe_url);
      else if (type === 'redirect') window.location.href = url;
      else if (type === 'wallet') {
        setWalletMsg(message);
        if (redirect_url) window.open(redirect_url, '_blank');
      }
      else if (type === 'kiosk') setKioskRef(reference);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'تعذر بدء عملية الدفع');
    } finally { setSubmitting(false); }
  };

  const discountPct = bundle?.original_price && bundle.original_price > bundle.price
    ? Math.round((bundle.original_price - bundle.price) / bundle.original_price * 100)
    : null;

  const availableMethods: Method[] = [];
  if (methods?.paymob?.enabled) {
    if (methods.paymob.methods.card)   availableMethods.push('card');
    if (methods.paymob.methods.wallet) availableMethods.push('wallet');
    if (methods.paymob.methods.kiosk)  availableMethods.push('kiosk');
    if (methods.paymob.methods.valu)   availableMethods.push('valu');
  }
  if (methods?.stripe?.enabled) availableMethods.push('stripe');
  if (methods?.easykash?.enabled) availableMethods.push('easykash');

  if (loading) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
    </div>
  );
  if (!bundle) return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <p className="text-slate-400">الباقة غير موجودة</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-900">
      <PublicNavbar />

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Back */}
        <Link href="/courses" className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors">
          <ArrowRight className="w-4 h-4" /> العودة للكورسات
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Bundle info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div className="card">
              {bundle.thumbnail_url && (
                <div className="w-full h-56 rounded-xl overflow-hidden mb-5 bg-dark-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bundle.thumbnail_url} alt={bundle.name} className="w-full h-full object-contain" />
                </div>
              )}
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-brand-500/20 rounded-lg">
                  <Package className="w-6 h-6 text-brand-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{bundle.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400">باقة شاملة</span>
                    {bundle.duration_days === 0
                      ? <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 flex items-center gap-1"><Infinity className="w-3 h-3" /> مدى الحياة</span>
                      : <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">{bundle.duration_days} يوم</span>
                    }
                    {discountPct && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">خصم {discountPct}%</span>
                    )}
                  </div>
                </div>
              </div>
              {bundle.description && (
                <p className="text-slate-300 text-sm leading-relaxed">{bundle.description}</p>
              )}
            </div>

            {/* Courses included */}
            <div className="card">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-brand-400" />
                الكورسات المشمولة
                {courses.length > 0 && <span className="text-sm font-normal text-slate-400">({courses.length} كورس)</span>}
              </h2>
              {courses.length === 0 ? (
                <div className="flex items-center gap-3 p-3 bg-brand-500/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-brand-400 shrink-0" />
                  <p className="text-sm text-slate-300">الباقة تشمل <strong className="text-brand-400">جميع الكورسات</strong> الحالية والمستقبلية</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {courses.map(c => (
                    <Link key={c.id} href={`/courses/${c.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-dark-700 transition-colors group">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-dark-700 shrink-0">
                        {c.thumbnail_url
                          ? <img src={c.thumbnail_url} alt={c.title} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-5 h-5 text-slate-500" /></div>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white group-hover:text-brand-300 truncate transition-colors">{c.title}</p>
                        <p className="text-xs text-slate-500">{c.type} · {c.level}</p>
                      </div>
                      <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Purchase card */}
          <div className="lg:col-span-1">
            <div className="card sticky top-6">
              {/* Price */}
              <div className="text-center mb-5 pb-5 border-b border-dark-700">
                {bundle.original_price && bundle.original_price > bundle.price && (
                  <p className="text-slate-500 line-through text-sm mb-1">{formatPrice(bundle.original_price)}</p>
                )}
                <p className="text-4xl font-bold text-brand-400">{formatPrice(bundle.price)}</p>
                {discountPct && (
                  <div className="mt-2 inline-flex items-center gap-1 bg-red-500/15 text-red-400 text-xs px-3 py-1 rounded-full">
                    <Tag className="w-3 h-3" /> توفير {discountPct}% — {formatPrice((bundle.original_price || 0) - bundle.price)}
                  </div>
                )}
                <p className="text-slate-400 text-xs mt-2">
                  {bundle.duration_days === 0 ? '♾️ وصول مدى الحياة' : `وصول لمدة ${bundle.duration_days} يوم`}
                </p>
              </div>

              {isSubscribed ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 justify-center text-green-400 font-medium">
                    <CheckCircle className="w-5 h-5" /> أنت مشترك في هذه الباقة
                  </div>
                  <Link href="/dashboard/student/courses" className="btn-primary w-full text-center block">
                    عرض الكورسات
                  </Link>
                </div>
              ) : iframeUrl ? (
                <div className="space-y-3">
                  <iframe src={iframeUrl} className="w-full rounded-lg border border-dark-600" style={{ height: 520 }} />
                  <button onClick={() => { setIframeUrl(null); setPolling(false); }} className="btn-secondary w-full text-sm">إلغاء</button>
                </div>
              ) : kioskRef ? (
                <div className="space-y-3 text-center">
                  <p className="text-slate-300 text-sm">ادفع نقداً في أي منفذ فوري أو أمان بالرقم المرجعي:</p>
                  <p className="text-2xl font-bold text-brand-400 font-mono">{kioskRef}</p>
                  <p className="text-xs text-slate-500">سيتم تفعيل اشتراكك تلقائياً بعد الدفع</p>
                </div>
              ) : walletMsg ? (
                <div className="space-y-3 text-center">
                  <p className="text-slate-300 text-sm">{walletMsg}</p>
                  <p className="text-xs text-slate-500">بعد الدفع من المحفظة، سيتم تفعيل اشتراكك تلقائياً</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Payment method */}
                  {availableMethods.length > 0 && (
                    <div>
                      <label className="block text-sm text-slate-300 mb-2">طريقة الدفع</label>
                      <div className="space-y-2">
                        {availableMethods.map(m => {
                          const info = METHOD_INFO[m];
                          return (
                            <button key={m} type="button"
                              onClick={() => setSelectedMethod(m)}
                              className={cn(
                                'w-full flex items-center gap-3 p-3 rounded-lg border text-right transition-colors',
                                selectedMethod === m
                                  ? 'border-brand-500 bg-brand-500/10 text-white'
                                  : 'border-dark-600 bg-dark-700 text-slate-300 hover:border-dark-500'
                              )}>
                              <info.icon className="w-4 h-4 shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-medium">{info.label}</p>
                                <p className="text-xs text-slate-500">{info.desc}</p>
                              </div>
                              {selectedMethod === m && <CheckCircle className="w-4 h-4 text-brand-400 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">رقم الهاتف</label>
                    <input {...register('phone', { required: 'مطلوب', pattern: { value: /^01[0-9]{9}$/, message: 'رقم غير صالح' } })}
                      className="input" placeholder="01XXXXXXXXX" />
                    {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
                  </div>

                  {/* Wallet number */}
                  {selectedMethod === 'wallet' && (
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">رقم المحفظة</label>
                      <input {...register('wallet_number')} className="input" placeholder="رقم فودافون كاش / إنستاباي" />
                    </div>
                  )}

                  {/* Coupon */}
                  <div>
                    <label className="block text-sm text-slate-300 mb-1 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-brand-400" /> كوبون خصم (اختياري)
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); }}
                        className="input flex-1 font-mono text-sm"
                        placeholder="أدخل كود الخصم"
                      />
                      <button type="button" onClick={validateCoupon} disabled={couponLoading || !couponCode.trim()}
                        className="btn-secondary px-3 text-sm whitespace-nowrap">
                        {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تحقق'}
                      </button>
                    </div>
                    {couponResult?.valid && (
                      <div className="mt-2 flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                        <span className="text-green-400 text-xs font-medium">
                          ✅ خصم {couponResult.discount_type === 'percent' ? `${couponResult.discount_value}%` : formatPrice(couponResult.discount_value)}
                        </span>
                        <span className="text-green-400 text-sm font-bold">{formatPrice(couponResult.final_price)}</span>
                      </div>
                    )}
                    {couponResult && !couponResult.valid && (
                      <p className="text-red-400 text-xs mt-1">❌ {couponResult.error}</p>
                    )}
                  </div>

                  {!user ? (
                    <Link href={`/login?redirect=/bundles/${id}`} className="btn-primary w-full text-center block">
                      سجل دخول للاشتراك
                    </Link>
                  ) : (
                    <button type="submit" disabled={submitting} className="btn-primary w-full flex items-center justify-center gap-2">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                      {submitting ? 'جارِ المعالجة...' : `اشترك الآن — ${formatPrice(finalPrice)}`}
                    </button>
                  )}

                  {polling && !iframeUrl && !kioskRef && !walletMsg && (
                    <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" /> جارِ التحقق من الدفع...
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
