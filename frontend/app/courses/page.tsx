'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, BookOpen, Clock, Users, Filter } from 'lucide-react';
import api from '@/lib/api';
import { formatPrice, levelColor, cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface Course {
  id: string; title: string; description: string; type: string;
  level: string; price: number; thumbnail_url: string;
  duration_hours: number; enrollment_count: string; instructor_name: string;
}

export default function CoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get('/courses', { params: { search, type: typeFilter || undefined, limit: 50 } })
      .then(({ data }) => setCourses(data.courses))
      .finally(() => setLoading(false));
  }, [search, typeFilter]);

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <div className="border-b border-dark-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
            <Image src="/logo.png" alt="Knowlytics Hub" width={150} height={42} className="object-contain" priority />
          </Link>
          <div className="flex items-center gap-3">
            <a href="https://wa.me/201226929392" target="_blank" rel="noreferrer"
               className="hidden sm:inline-flex items-center gap-1.5 text-sm text-green-400 hover:text-green-300 font-medium">
              💬 واتساب
            </a>
            {user
              ? <Link href={user.role === 'admin' ? '/dashboard/admin' : '/dashboard/student'} className="btn-primary text-sm">Dashboard</Link>
              : <><Link href="/login" className="btn-secondary text-sm">Sign In</Link><Link href="/register" className="btn-primary text-sm">Get Started</Link></>
            }
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Course Catalog</h1>
          <p className="text-slate-400">Explore our library of expert-led courses</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search courses..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input w-auto">
              <option value="">All Types</option>
              <option value="online">Online</option>
              <option value="live">Live</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {loading
            ? [...Array(8)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="w-full h-36 bg-dark-700 rounded-lg mb-3" />
                <div className="h-4 bg-dark-700 rounded mb-2" />
                <div className="h-3 bg-dark-700 rounded w-2/3" />
              </div>
            ))
            : courses.map((c) => (
              <Link key={c.id} href={`/courses/${c.id}`} className="card hover:border-brand-500/50 transition-all duration-200 group flex flex-col">
                {/* Thumbnail */}
                <div className="w-full h-36 bg-gradient-to-br from-brand-500/20 to-purple-500/20 rounded-lg mb-4 flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-brand-400" />
                </div>
                {/* Badges */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn('badge', c.type === 'live' ? 'badge-purple' : 'badge-blue')}>{c.type}</span>
                  <span className={levelColor(c.level)}>{c.level}</span>
                </div>
                <h3 className="font-semibold text-white text-sm mb-1 line-clamp-2 group-hover:text-brand-300 transition-colors">{c.title}</h3>
                <p className="text-slate-400 text-xs line-clamp-2 mb-3 flex-1">{c.description}</p>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{c.duration_hours}h</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{c.enrollment_count}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-dark-700">
                  <span className="text-white font-bold">{formatPrice(c.price)}</span>
                  <span className="text-xs text-slate-400">{c.instructor_name}</span>
                </div>
              </Link>
            ))}
        </div>

        {!loading && courses.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No courses found. Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
