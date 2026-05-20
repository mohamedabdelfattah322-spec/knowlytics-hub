'use client';
import { useEffect, useState } from 'react';
import { Share2, Copy, CheckCircle, DollarSign, Users, Gift, Loader2, Send, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { cn, formatPrice } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

interface ReferralData {
  referral_code: string;
  referral_link: string;
  stats: {
    total_referrals: number;
    purchased: number;
    rewarded: number;
    total_earned: number;
    available_balance: number;
    referral_count: number;
  };
  referrals: Array<{
    id: string; status: string; referrer_reward_amount: number;
    created_at: string; rewarded_at: string | null;
    referee_name: string; course_title: string | null;
  }>;
  reward_info: {
    referrer_reward: string;
    referee_discount: string;
    reward_on: string;
  };
}

export default function ReferralsPage() {
  const { t, isAr } = useLanguage();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showPayout, setShowPayout] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('vodafone_cash');
  const [payoutPhone, setPayoutPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/referrals/my').then(({ data }) => setData(data)).finally(() => setLoading(false));
  }, []);

  const copyLink = () => {
    if (data?.referral_link) {
      navigator.clipboard.writeText(data.referral_link);
      setCopied(true);
      toast.success(isAr ? 'تم نسخ الرابط!' : 'Link copied!');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const shareWhatsApp = () => {
    if (data?.referral_link) {
      const msg = isAr
        ? `🎓 انضم لـ Knowlytics Hub واحصل على خصم! ${data.referral_link}`
        : `🎓 Join Knowlytics Hub and get a discount! ${data.referral_link}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    }
  };

  const requestPayout = async () => {
    if (!payoutAmount || !payoutPhone) return;
    setSubmitting(true);
    try {
      await api.post('/referrals/payout', {
        amount: parseFloat(payoutAmount),
        payment_method: payoutMethod,
        payment_details: { phone: payoutPhone },
      });
      toast.success(isAr ? 'تم إرسال طلب السحب!' : 'Payout request sent!');
      setShowPayout(false);
      setPayoutAmount('');
      setPayoutPhone('');
      // Refresh data
      const { data: fresh } = await api.get('/referrals/my');
      setData(fresh);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed');
    } finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>
  );

  if (!data) return null;
  const { stats, referrals, reward_info } = data;

  return (
    <div className="space-y-6 max-w-3xl animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Share2 className="w-6 h-6 text-brand-400" />
          {isAr ? 'برنامج الإحالة' : 'Referral Program'}
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {isAr
            ? `ادعو أصدقاءك واحصل على ${reward_info.referrer_reward} مكافأة عن كل عملية شراء!`
            : `Invite friends and earn ${reward_info.referrer_reward} reward per purchase!`}
        </p>
      </div>

      {/* Referral Link Card */}
      <div className="card bg-gradient-to-br from-brand-500/10 to-purple-500/10 border-brand-500/30">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-5 h-5 text-brand-400" />
          <span className="text-white font-semibold">
            {isAr ? 'رابط الإحالة الخاص بك' : 'Your Referral Link'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={data.referral_link}
            className="input flex-1 text-sm bg-dark-900/50"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button onClick={copyLink}
            className={cn('btn-primary flex items-center gap-1.5 whitespace-nowrap',
              copied && 'bg-green-600 hover:bg-green-600')}>
            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? (isAr ? 'تم!' : 'Copied!') : (isAr ? 'نسخ' : 'Copy')}
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-slate-400">
            {isAr ? 'الكود:' : 'Code:'} <span className="text-brand-400 font-mono font-bold">{data.referral_code}</span>
          </span>
          <span className="text-slate-600">·</span>
          <button onClick={shareWhatsApp}
            className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
            💬 {isAr ? 'مشاركة واتساب' : 'Share on WhatsApp'}
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="card">
        <h2 className="font-semibold text-white mb-3">{isAr ? 'كيف يعمل؟' : 'How it works'}</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { step: '1', text: isAr ? 'شارك رابطك مع أصدقاءك' : 'Share your link', icon: Share2, color: 'text-blue-400' },
            { step: '2', text: isAr ? 'صديقك يسجل ويشتري كورس' : 'Friend registers & buys', icon: Users, color: 'text-purple-400' },
            { step: '3', text: isAr ? `تحصل على ${reward_info.referrer_reward} مكافأة` : `You earn ${reward_info.referrer_reward}`, icon: DollarSign, color: 'text-green-400' },
          ].map(({ step, text, icon: Icon, color }) => (
            <div key={step}>
              <div className={cn('w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center mx-auto mb-2', color)}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-300">{text}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 text-center mt-3">
          {isAr
            ? `صديقك يحصل على ${reward_info.referee_discount} خصم على أول شراء!`
            : `Your friend gets ${reward_info.referee_discount} off their first purchase!`}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: isAr ? 'إجمالي الإحالات' : 'Total Referrals', value: stats.total_referrals, color: 'text-blue-400', bg: 'bg-blue-500/15' },
          { icon: CheckCircle, label: isAr ? 'اشتروا' : 'Purchased', value: stats.rewarded, color: 'text-green-400', bg: 'bg-green-500/15' },
          { icon: DollarSign, label: isAr ? 'إجمالي الأرباح' : 'Total Earned', value: formatPrice(parseFloat(String(stats.total_earned))), color: 'text-yellow-400', bg: 'bg-yellow-500/15' },
          { icon: Wallet, label: isAr ? 'رصيد متاح' : 'Available', value: formatPrice(parseFloat(String(stats.available_balance))), color: 'text-brand-400', bg: 'bg-brand-500/15' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="card text-center">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2', bg)}>
              <Icon className={cn('w-4 h-4', color)} />
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-slate-400 text-[10px] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Payout Section */}
      {parseFloat(String(stats.available_balance)) > 0 && (
        <div className="card">
          {!showPayout ? (
            <button onClick={() => setShowPayout(true)}
              className="btn-primary flex items-center gap-2 w-full justify-center">
              <Send className="w-4 h-4" /> {isAr ? 'سحب الأرباح' : 'Request Payout'}
            </button>
          ) : (
            <div className="space-y-3">
              <h3 className="font-semibold text-white">{isAr ? 'طلب سحب' : 'Payout Request'}</h3>
              <input type="number" placeholder={isAr ? 'المبلغ (جنيه)' : 'Amount (EGP)'}
                value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)}
                max={stats.available_balance} className="input" />
              <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)} className="input">
                <option value="vodafone_cash">Vodafone Cash</option>
                <option value="instapay">InstaPay</option>
                <option value="bank_transfer">{isAr ? 'تحويل بنكي' : 'Bank Transfer'}</option>
              </select>
              <input type="text" placeholder={isAr ? 'رقم الهاتف / التفاصيل' : 'Phone / Details'}
                value={payoutPhone} onChange={(e) => setPayoutPhone(e.target.value)} className="input" />
              <div className="flex gap-2">
                <button onClick={requestPayout} disabled={submitting}
                  className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isAr ? 'إرسال' : 'Submit'}
                </button>
                <button onClick={() => setShowPayout(false)} className="btn-secondary">
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Referral History */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">{isAr ? 'سجل الإحالات' : 'Referral History'}</h2>
        {referrals.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">
            {isAr ? 'لا توجد إحالات بعد. شارك رابطك!' : 'No referrals yet. Share your link!'}
          </p>
        ) : (
          <div className="space-y-3">
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center gap-3 py-2 border-b border-dark-700 last:border-0">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                  r.status === 'rewarded' ? 'bg-green-500/20 text-green-400' :
                  r.status === 'purchased' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-slate-500/20 text-slate-400'
                )}>
                  {r.referee_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{r.referee_name}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(r.created_at).toLocaleDateString()}
                    {r.course_title && ` · ${r.course_title}`}
                  </p>
                </div>
                <div className="text-right">
                  <span className={cn('badge text-xs',
                    r.status === 'rewarded' ? 'badge-green' :
                    r.status === 'purchased' ? 'badge-blue' : 'badge-yellow'
                  )}>
                    {r.status === 'rewarded' ? (isAr ? 'تم المكافأة' : 'Rewarded') :
                     r.status === 'purchased' ? (isAr ? 'اشترى' : 'Purchased') :
                     (isAr ? 'مسجل' : 'Registered')}
                  </span>
                  {r.referrer_reward_amount > 0 && (
                    <p className="text-xs text-green-400 mt-0.5">+{formatPrice(r.referrer_reward_amount)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
