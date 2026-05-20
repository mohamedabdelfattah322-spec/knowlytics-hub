'use client';
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line, AreaChart, Area,
} from 'recharts';
import api from '@/lib/api';
import {
  BarChart2, Play, ShoppingCart, TrendingUp, Users, Clock, Eye,
  Monitor, Smartphone, Tablet, RefreshCw, Rewind, FastForward,
  DollarSign, Activity, Zap, CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

function formatSeconds(s: number): string {
  if (s < 60) return `${Math.round(s)}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatK(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [basic, setBasic] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<'overview' | 'video' | 'cart' | 'revenue'>('overview');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/analytics/overview', { params: { days } }),
      api.get('/admin/dashboard'),
    ]).then(([a, b]) => {
      setData(a.data);
      setBasic(b.data);
    }).finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-dark-700 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="card h-28 animate-pulse bg-dark-700" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          {[1,2].map(i => <div key={i} className="card h-72 animate-pulse bg-dark-700" />)}
        </div>
      </div>
    );
  }

  const video = data?.video || {};
  const cart = data?.cart || {};
  const dailyActivity = data?.daily_activity || [];
  const peakHours = data?.peak_hours || [];
  const deviceBreakdown = data?.device_breakdown || [];
  const paymentMethods = data?.payment_methods || [];
  const topByWatch = data?.top_courses_by_watch || [];
  const topByEnroll = data?.top_courses_by_enrollment || [];
  const cartAbandonment = data?.cart_abandonment || [];
  const revenueByDay = data?.revenue_by_day || [];
  const engagement = data?.user_engagement || {};

  const conversionRate = cart.total_adds > 0
    ? ((cart.total_purchases / cart.total_adds) * 100).toFixed(1)
    : '0';

  const abandonRate = cart.total_adds > 0
    ? (((parseInt(cart.total_adds) - parseInt(cart.total_purchases)) / parseInt(cart.total_adds)) * 100).toFixed(1)
    : '0';

  const tabs = [
    { key: 'overview', label: 'Overview', icon: BarChart2 },
    { key: 'video', label: 'Video Analytics', icon: Play },
    { key: 'cart', label: 'Cart & Conversion', icon: ShoppingCart },
    { key: 'revenue', label: 'Revenue', icon: DollarSign },
  ] as const;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-6 h-6 text-brand-400" /> Advanced Analytics
          </h1>
          <p className="text-slate-400 text-sm mt-1">Comprehensive insights into platform performance</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 14, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                days === d ? 'bg-brand-500 text-white' : 'bg-dark-700 text-slate-400 hover:text-white'
              )}>
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800 p-1 rounded-xl border border-dark-700">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center',
              tab === key ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white hover:bg-dark-700'
            )}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════ OVERVIEW TAB ═══════════════════════ */}
      {tab === 'overview' && (
        <>
          {/* Top KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Users, label: 'Total Users', value: basic?.stats?.users?.total || 0, color: 'text-blue-400', bg: 'bg-blue-500/15' },
              { icon: Eye, label: 'Video Sessions', value: formatK(parseInt(video.total_sessions || 0)), color: 'text-purple-400', bg: 'bg-purple-500/15' },
              { icon: Clock, label: 'Total Watch Time', value: formatSeconds(parseInt(video.total_watch_seconds || 0)), color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
              { icon: TrendingUp, label: 'Conversion Rate', value: `${conversionRate}%`, color: 'text-green-400', bg: 'bg-green-500/15' },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="card">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
                    <Icon className={cn('w-5 h-5', color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-slate-400 text-xs">{label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Daily Activity Chart */}
          <div className="card">
            <h2 className="text-base font-semibold text-white mb-4">Daily Activity</h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f8fafc' }} />
                <Area type="monotone" dataKey="video_sessions" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} name="Video Sessions" />
                <Area type="monotone" dataKey="enrollments" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Enrollments" />
                <Area type="monotone" dataKey="page_views" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} name="Page Views" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Courses by Watch Time */}
            <div className="card">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Play className="w-4 h-4 text-purple-400" /> Top Courses by Watch Time
              </h2>
              <div className="space-y-3">
                {topByWatch.map((c: any, i: number) => (
                  <div key={c.course_id} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{c.title}</p>
                      <p className="text-xs text-slate-500">{c.unique_viewers} viewers · {c.session_count} sessions</p>
                    </div>
                    <span className="text-sm font-medium text-brand-400">{formatSeconds(parseInt(c.total_watch_seconds))}</span>
                  </div>
                ))}
                {topByWatch.length === 0 && <p className="text-slate-500 text-sm">No data yet</p>}
              </div>
            </div>

            {/* Top Courses by Enrollment */}
            <div className="card">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-green-400" /> Top Courses by Enrollment
              </h2>
              <div className="space-y-3">
                {topByEnroll.map((c: any, i: number) => (
                  <div key={c.course_id} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{c.title}</p>
                      <p className="text-xs text-slate-500">{c.price > 0 ? `EGP ${c.price}` : 'Free'}</p>
                    </div>
                    <span className="text-sm font-medium text-green-400">{c.enrollment_count} enrolled</span>
                  </div>
                ))}
                {topByEnroll.length === 0 && <p className="text-slate-500 text-sm">No data yet</p>}
              </div>
            </div>
          </div>

          {/* Device Breakdown + Peak Hours */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-base font-semibold text-white mb-4">Device Breakdown</h2>
              {deviceBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={deviceBreakdown.map((d: any) => ({ name: d.device_type, value: parseInt(d.count) }))}
                      cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                      {deviceBreakdown.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f8fafc' }} />
                    <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-500 text-sm text-center py-8">No data yet</p>}
            </div>

            <div className="card">
              <h2 className="text-base font-semibold text-white mb-4">Peak Viewing Hours</h2>
              {peakHours.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={peakHours.map((h: any) => ({ hour: `${h.hour}:00`, sessions: parseInt(h.session_count) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={2} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f8fafc' }} />
                    <Bar dataKey="sessions" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-500 text-sm text-center py-8">No data yet</p>}
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════ VIDEO TAB ═══════════════════════ */}
      {tab === 'video' && (
        <>
          {/* Video KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Play, label: 'Total Sessions', value: formatK(parseInt(video.total_sessions || 0)), color: 'text-purple-400', bg: 'bg-purple-500/15' },
              { icon: Clock, label: 'Total Watch Time', value: formatSeconds(parseInt(video.total_watch_seconds || 0)), color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
              { icon: Users, label: 'Unique Viewers', value: video.unique_viewers || 0, color: 'text-blue-400', bg: 'bg-blue-500/15' },
              { icon: Activity, label: 'Avg Session', value: formatSeconds(parseInt(video.avg_session_seconds || 0)), color: 'text-green-400', bg: 'bg-green-500/15' },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="card">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
                    <Icon className={cn('w-5 h-5', color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-slate-400 text-xs">{label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Interaction Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              { icon: FastForward, label: 'Seeks Forward', value: video.total_seeks_forward || 0, color: 'text-orange-400' },
              { icon: Rewind, label: 'Seeks Backward', value: video.total_seeks_backward || 0, color: 'text-yellow-400' },
              { icon: RefreshCw, label: 'Replays', value: video.total_replays || 0, color: 'text-pink-400' },
              { icon: Zap, label: 'Pauses', value: video.total_pauses || 0, color: 'text-red-400' },
              { icon: Eye, label: 'Completed', value: video.completed_videos || 0, color: 'text-green-400' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="card text-center py-4">
                <Icon className={cn('w-5 h-5 mx-auto mb-2', color)} />
                <p className="text-xl font-bold text-white">{formatK(parseInt(value))}</p>
                <p className="text-slate-400 text-[10px] mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* User Engagement */}
          <div className="card">
            <h2 className="text-base font-semibold text-white mb-4">User Engagement</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-brand-400">{engagement.active_users || 0}</p>
                <p className="text-slate-400 text-xs">Active Users</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-cyan-400">
                  {formatSeconds(parseInt(engagement.avg_watch_per_user || 0))}
                </p>
                <p className="text-slate-400 text-xs">Avg Watch / User</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-400">
                  {formatSeconds(parseInt(engagement.max_watch_user || 0))}
                </p>
                <p className="text-slate-400 text-xs">Most Active User</p>
              </div>
            </div>
          </div>

          {/* Daily Watch Time */}
          <div className="card">
            <h2 className="text-base font-semibold text-white mb-4">Daily Watch Time (minutes)</h2>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={dailyActivity.map((d: any) => ({ ...d, watch_minutes: Math.round(d.watch_seconds / 60) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f8fafc' }} />
                <Area type="monotone" dataKey="watch_minutes" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name="Watch (min)" />
                <Area type="monotone" dataKey="video_sessions" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} name="Sessions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* ═══════════════════════ CART TAB ═══════════════════════ */}
      {tab === 'cart' && (
        <>
          {/* Cart KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: ShoppingCart, label: 'Added to Cart', value: cart.total_adds || 0, color: 'text-blue-400', bg: 'bg-blue-500/15' },
              { icon: TrendingUp, label: 'Purchases', value: cart.total_purchases || 0, color: 'text-green-400', bg: 'bg-green-500/15' },
              { icon: Activity, label: 'Conversion Rate', value: `${conversionRate}%`, color: 'text-purple-400', bg: 'bg-purple-500/15' },
              { icon: Zap, label: 'Abandon Rate', value: `${abandonRate}%`, color: 'text-red-400', bg: 'bg-red-500/15' },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="card">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
                    <Icon className={cn('w-5 h-5', color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-slate-400 text-xs">{label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Funnel */}
          <div className="card">
            <h2 className="text-base font-semibold text-white mb-4">Cart Funnel</h2>
            <div className="space-y-3">
              {[
                { label: 'Added to Cart', value: parseInt(cart.total_adds || 0), color: 'bg-blue-500' },
                { label: 'Unique Users', value: parseInt(cart.unique_adders || 0), color: 'bg-purple-500' },
                { label: 'Started Checkout', value: parseInt(cart.total_purchases || 0) + parseInt(cart.total_abandons || 0), color: 'bg-yellow-500' },
                { label: 'Completed Purchase', value: parseInt(cart.total_purchases || 0), color: 'bg-green-500' },
              ].map(({ label, value, color }) => {
                const maxVal = parseInt(cart.total_adds || 1);
                const pct = maxVal > 0 ? (value / maxVal) * 100 : 0;
                return (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-300">{label}</span>
                      <span className="text-white font-medium">{value} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart Abandonment — courses added but not purchased */}
          <div className="card">
            <h2 className="text-base font-semibold text-white mb-4">Cart Abandonment by Course</h2>
            <div className="space-y-3">
              {cartAbandonment.map((c: any) => {
                const abandoned = parseInt(c.adds) - parseInt(c.purchases);
                const rate = parseInt(c.adds) > 0 ? ((abandoned / parseInt(c.adds)) * 100).toFixed(0) : '0';
                return (
                  <div key={c.course_id} className="flex items-center gap-3 py-2 border-b border-dark-700 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{c.title}</p>
                      <p className="text-xs text-slate-500">EGP {c.price} · {c.adds} adds · {c.purchases} purchases</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-red-400">{abandoned} abandoned</span>
                      <p className="text-[10px] text-slate-500">{rate}% abandon rate</p>
                    </div>
                  </div>
                );
              })}
              {cartAbandonment.length === 0 && <p className="text-slate-500 text-sm">No cart data yet</p>}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="card">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-green-400" /> Payment Methods
            </h2>
            {paymentMethods.length > 0 ? (
              <div className="grid lg:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={paymentMethods.map((p: any) => ({ name: p.payment_method, value: parseInt(p.count) }))}
                      cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {paymentMethods.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f8fafc' }} />
                    <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {paymentMethods.map((p: any, i: number) => (
                    <div key={p.payment_method} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm text-slate-300 flex-1">{p.payment_method}</span>
                      <span className="text-sm text-white font-medium">{p.count} txns</span>
                      <span className="text-sm text-brand-400">EGP {parseFloat(p.total_amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <p className="text-slate-500 text-sm text-center py-8">No payment data yet</p>}
          </div>
        </>
      )}

      {/* ═══════════════════════ REVENUE TAB ═══════════════════════ */}
      {tab === 'revenue' && (
        <>
          {/* Revenue KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: DollarSign, label: 'Total Revenue', value: `EGP ${parseFloat(cart.total_revenue || 0).toLocaleString()}`, color: 'text-green-400', bg: 'bg-green-500/15' },
              { icon: ShoppingCart, label: 'Total Transactions', value: cart.total_purchases || 0, color: 'text-blue-400', bg: 'bg-blue-500/15' },
              { icon: Users, label: 'Unique Buyers', value: cart.unique_buyers || 0, color: 'text-purple-400', bg: 'bg-purple-500/15' },
              { icon: TrendingUp, label: 'Avg Order Value', value: `EGP ${cart.total_purchases > 0 ? (parseFloat(cart.total_revenue || 0) / parseInt(cart.total_purchases)).toFixed(0) : 0}`, color: 'text-cyan-400', bg: 'bg-cyan-500/15' },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className="card">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
                    <Icon className={cn('w-5 h-5', color)} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-slate-400 text-xs">{label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Revenue Chart */}
          <div className="card">
            <h2 className="text-base font-semibold text-white mb-4">Daily Revenue</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(v) => `${v}`} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f8fafc' }}
                  formatter={(v: any) => [`EGP ${parseFloat(v).toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.2} name="Revenue (EGP)" />
                <Line type="monotone" dataKey="transactions" stroke="#8b5cf6" strokeWidth={2} name="Transactions" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
