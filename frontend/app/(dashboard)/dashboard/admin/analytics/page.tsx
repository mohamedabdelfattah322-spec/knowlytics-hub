'use client';
import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '@/lib/api';
import { BarChart2 } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => setStats(data)).finally(() => setLoading(false));
  }, []);

  const enrollmentData = stats ? [
    { name: 'Total', value: parseInt(stats.stats.enrollments.total) },
    { name: 'Completed', value: parseInt(stats.stats.enrollments.completed) },
    { name: 'In Progress', value: parseInt(stats.stats.enrollments.total) - parseInt(stats.stats.enrollments.completed) },
  ] : [];

  const userTypeData = stats ? [
    { name: 'Students', value: parseInt(stats.stats.users.students) },
    { name: 'Admins', value: parseInt(stats.stats.users.total) - parseInt(stats.stats.users.students) },
  ] : [];

  const recentData = stats?.recent_enrollments?.slice(0, 7).map((e: any, i: number) => ({
    name: `Day ${i + 1}`,
    enrollments: 1,
  })).reduce((acc: any[], cur: any) => {
    const last = acc[acc.length - 1];
    if (last?.name === cur.name) { last.enrollments++; return acc; }
    return [...acc, cur];
  }, []) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-dark-700 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-2 gap-6">
          {[1, 2].map((i) => <div key={i} className="card h-64 animate-pulse bg-dark-700" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-brand-400" /> Analytics
        </h1>
        <p className="text-slate-400 text-sm mt-1">Platform-wide performance metrics</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats?.stats.users.total },
          { label: 'Published Courses', value: stats?.stats.courses.published },
          { label: 'Total Enrollments', value: stats?.stats.enrollments.total },
          { label: 'Completion Rate', value: `${stats?.stats.enrollments.total > 0 ? Math.round((stats?.stats.enrollments.completed / stats?.stats.enrollments.total) * 100) : 0}%` },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center">
            <p className="text-3xl font-bold text-brand-400">{value}</p>
            <p className="text-slate-400 text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Enrollment Breakdown */}
        <div className="card">
          <h2 className="text-base font-semibold text-white mb-6">Enrollment Breakdown</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={enrollmentData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f8fafc' }} />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Distribution */}
        <div className="card">
          <h2 className="text-base font-semibold text-white mb-6">User Distribution</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={userTypeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                {userTypeData.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f8fafc' }} />
              <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
