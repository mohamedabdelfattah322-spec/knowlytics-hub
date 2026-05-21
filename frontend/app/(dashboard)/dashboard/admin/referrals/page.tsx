'use client';
import { useEffect, useState } from 'react';
import { Share2, Users, DollarSign, TrendingUp, CheckCircle, XCircle, Clock, Settings, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';

interface Overview {
  total_referrals: string;
  registered: string;
  purchased: string;
  rewarded: string;
  total_rewards_paid: string;
  total_discounts_given: string;
}

interface TopReferrer {
  id: string; name: string; email: string; referral_code: string;
  referral_count: number; referral_earnings: string;
  total_referrals: string; successful: string; earned: string;
}

interface Payout {
  id: string; user_id: string; name: string; email: string;
  amount: string; status: string; payment_method: string;
  payment_details: any; created_at: string;
}

interface ReferralSettings {
  referrer_reward_type: string; referrer_reward_value: number;
  referee_discount_type: string; referee_discount_value: number;
  min_purchase_amount: number; max_reward_per_referral: number;
  is_active: boolean; require_purchase: boolean; reward_on: string;
}

export default function AdminReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<Payout[]>([]);
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'overview' | 'payouts' | 'settings'>('overview');

  const fetchData = async () => {
    try {
      const { data } = await api.get('/referrals/admin/stats');
      setOverview(data.overview);
      setTopReferrers(data.top_referrers || []);
      setPendingPayouts(data.pending_payouts || []);
      setSettings(data.settings || null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to load referral data');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePayout = async (id: string, status: 'approved' | 'paid' | 'rejected', notes?: string) => {
    try {
      await api.put(`/referrals/admin/payouts/${id}`, { status, admin_notes: notes });
      toast.success(status === 'rejected' ? 'Payout rejected' : 'Payout approved');
      fetchData();
    } catch { toast.error('Failed to process payout'); }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await api.put('/referrals/admin/settings', settings);
      toast.success('Settings saved');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-brand-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Referral Management</h1>
          <p className="text-slate-400 text-sm mt-1">Track referrals, manage payouts, and configure settings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800 p-1 rounded-lg w-fit">
        {(['overview', 'payouts', 'settings'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize',
              tab === t ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white')}>
            {t === 'overview' ? 'Overview & Referrers' : t === 'payouts' ? `Payouts (${pendingPayouts.length})` : 'Settings'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{overview?.total_referrals || 0}</p>
                  <p className="text-xs text-slate-400">Total Referrals</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{overview?.rewarded || 0}</p>
                  <p className="text-xs text-slate-400">Successful (Rewarded)</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{formatPrice(Number(overview?.total_rewards_paid || 0))}</p>
                  <p className="text-xs text-slate-400">Total Rewards Paid</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{formatPrice(Number(overview?.total_discounts_given || 0))}</p>
                  <p className="text-xs text-slate-400">Total Discounts Given</p>
                </div>
              </div>
            </div>
          </div>

          {/* Funnel */}
          <div className="card">
            <h3 className="text-white font-semibold mb-3">Referral Funnel</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 text-center">
                <p className="text-3xl font-bold text-blue-400">{overview?.registered || 0}</p>
                <p className="text-xs text-slate-400 mt-1">Registered</p>
              </div>
              <div className="text-slate-600 text-2xl">&rarr;</div>
              <div className="flex-1 text-center">
                <p className="text-3xl font-bold text-yellow-400">{overview?.purchased || 0}</p>
                <p className="text-xs text-slate-400 mt-1">Purchased</p>
              </div>
              <div className="text-slate-600 text-2xl">&rarr;</div>
              <div className="flex-1 text-center">
                <p className="text-3xl font-bold text-green-400">{overview?.rewarded || 0}</p>
                <p className="text-xs text-slate-400 mt-1">Rewarded</p>
              </div>
            </div>
          </div>

          {/* Top Referrers Table */}
          <div className="card">
            <h3 className="text-white font-semibold mb-4">Top Referrers</h3>
            {topReferrers.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No referrers yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-700">
                      <th className="text-left py-3 px-2 text-slate-400 font-medium">User</th>
                      <th className="text-left py-3 px-2 text-slate-400 font-medium">Code</th>
                      <th className="text-center py-3 px-2 text-slate-400 font-medium">Referrals</th>
                      <th className="text-center py-3 px-2 text-slate-400 font-medium">Successful</th>
                      <th className="text-right py-3 px-2 text-slate-400 font-medium">Earned</th>
                      <th className="text-right py-3 px-2 text-slate-400 font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topReferrers.map((r) => (
                      <tr key={r.id} className="border-b border-dark-700/50 hover:bg-dark-700/30">
                        <td className="py-3 px-2">
                          <p className="text-white font-medium">{r.name}</p>
                          <p className="text-xs text-slate-500">{r.email}</p>
                        </td>
                        <td className="py-3 px-2">
                          <span className="bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded text-xs font-mono">
                            {r.referral_code}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center text-white">{r.total_referrals}</td>
                        <td className="py-3 px-2 text-center text-green-400">{r.successful}</td>
                        <td className="py-3 px-2 text-right text-white">{formatPrice(Number(r.earned))}</td>
                        <td className="py-3 px-2 text-right text-yellow-400">{formatPrice(Number(r.referral_earnings))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'payouts' && (
        <div className="card">
          <h3 className="text-white font-semibold mb-4">Pending Payout Requests</h3>
          {pendingPayouts.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No pending payouts</p>
          ) : (
            <div className="space-y-3">
              {pendingPayouts.map((p) => (
                <div key={p.id} className="border border-dark-700 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{p.name}</p>
                      <span className="text-xs text-slate-500">{p.email}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm">
                      <span className="text-yellow-400 font-bold">{formatPrice(Number(p.amount))}</span>
                      <span className="text-slate-400">via {p.payment_method}</span>
                      {p.payment_details?.phone && (
                        <span className="text-slate-400">Tel: {p.payment_details.phone}</span>
                      )}
                      <span className="text-slate-500 text-xs">{new Date(p.created_at).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handlePayout(p.id, 'paid')}
                      className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Approve & Pay
                    </button>
                    <button onClick={() => handlePayout(p.id, 'rejected', 'Rejected by admin')}
                      className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'settings' && settings && (
        <div className="card max-w-2xl">
          <h3 className="text-white font-semibold mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-400" /> Referral Settings
          </h3>
          <div className="space-y-5">
            {/* Active toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white text-sm font-medium">Referral System Active</p>
                <p className="text-xs text-slate-400">Enable or disable the entire referral system</p>
              </div>
              <button onClick={() => setSettings({ ...settings, is_active: !settings.is_active })}
                className={cn('w-12 h-6 rounded-full transition-colors relative',
                  settings.is_active ? 'bg-green-500' : 'bg-dark-600')}>
                <div className={cn('w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all',
                  settings.is_active ? 'left-6' : 'left-0.5')} />
              </button>
            </div>

            <hr className="border-dark-700" />

            {/* Referrer Reward */}
            <div>
              <p className="text-white text-sm font-medium mb-2">Referrer Reward (who shares)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Type</label>
                  <select value={settings.referrer_reward_type}
                    onChange={(e) => setSettings({ ...settings, referrer_reward_type: e.target.value })}
                    className="input mt-1">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (EGP)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Value</label>
                  <input type="number" value={settings.referrer_reward_value}
                    onChange={(e) => setSettings({ ...settings, referrer_reward_value: Number(e.target.value) })}
                    className="input mt-1" />
                </div>
              </div>
            </div>

            {/* Referee Discount */}
            <div>
              <p className="text-white text-sm font-medium mb-2">Referee Discount (new user)</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Type</label>
                  <select value={settings.referee_discount_type}
                    onChange={(e) => setSettings({ ...settings, referee_discount_type: e.target.value })}
                    className="input mt-1">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (EGP)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Value</label>
                  <input type="number" value={settings.referee_discount_value}
                    onChange={(e) => setSettings({ ...settings, referee_discount_value: Number(e.target.value) })}
                    className="input mt-1" />
                </div>
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">Max Reward Per Referral (EGP)</label>
                <input type="number" value={settings.max_reward_per_referral}
                  onChange={(e) => setSettings({ ...settings, max_reward_per_referral: Number(e.target.value) })}
                  className="input mt-1" />
              </div>
              <div>
                <label className="text-xs text-slate-400">Min Purchase Amount (EGP)</label>
                <input type="number" value={settings.min_purchase_amount}
                  onChange={(e) => setSettings({ ...settings, min_purchase_amount: Number(e.target.value) })}
                  className="input mt-1" />
              </div>
            </div>

            {/* Reward On */}
            <div>
              <label className="text-xs text-slate-400">Reward On</label>
              <select value={settings.reward_on}
                onChange={(e) => setSettings({ ...settings, reward_on: e.target.value })}
                className="input mt-1">
                <option value="first_purchase">First Purchase Only</option>
                <option value="every_purchase">Every Purchase</option>
                <option value="registration">Registration (no purchase needed)</option>
              </select>
            </div>

            <button onClick={saveSettings} disabled={saving}
              className="btn-primary flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
