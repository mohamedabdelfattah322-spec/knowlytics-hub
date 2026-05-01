'use client';
import { useEffect, useState } from 'react';
import { Users, BookOpen, TrendingUp, DollarSign, Activity, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import { format } from 'date-fns';

interface Stats {
  users: { total: string; students: string; new_this_month: string };
  courses: { total: string; published: string };
  enrollments: { total: string; completed: string };
  monthly_revenue: string;
}

interface RecentEnrollment {
  student_name: string;
  email: string;
  course_title: string;
  enrolled_at: string;
}

const StatCard = ({ icon: Icon, label, value, sub, color }: any) => (
  <div className="card flex items-start gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-slate-400 text-sm">{label}</p>
      <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<RecentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(({ data }) => {
      setStats(data.stats);
      setRecent(data.recent_enrollments);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-dark-700 rounded w-64 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-dark-700" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Platform overview — {format(new Date(), 'MMMM d, yyyy')}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats?.users.total} sub={`${stats?.users.new_this_month} new this month`} color="bg-blue-600" />
        <StatCard icon={BookOpen} label="Courses" value={stats?.courses.total} sub={`${stats?.courses.published} published`} color="bg-purple-600" />
        <StatCard icon={TrendingUp} label="Enrollments" value={stats?.enrollments.total} sub={`${stats?.enrollments.completed} completed`} color="bg-green-600" />
        <StatCard icon={DollarSign} label="Monthly Revenue" value={formatCurrency(parseFloat(stats?.monthly_revenue || '0'))} color="bg-brand-600" />
      </div>

      {/* Recent Enrollments */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-400" />
            Recent Enrollments
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-dark-700">
                <th className="text-left pb-3 font-medium">Student</th>
                <th className="text-left pb-3 font-medium">Course</th>
                <th className="text-left pb-3 font-medium">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {recent.map((r, i) => (
                <tr key={i} className="hover:bg-dark-700/50 transition-colors">
                  <td className="py-3">
                    <div>
                      <p className="font-medium text-slate-200">{r.student_name}</p>
                      <p className="text-slate-500 text-xs">{r.email}</p>
                    </div>
                  </td>
                  <td className="py-3 text-slate-300">{r.course_title}</td>
                  <td className="py-3 text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(r.enrolled_at), 'MMM d, yyyy')}
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td colSpan={3} className="py-8 text-center text-slate-500">No enrollments yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
