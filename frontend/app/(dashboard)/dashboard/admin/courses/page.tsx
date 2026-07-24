'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Eye, EyeOff, Search, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { formatPrice, levelColor } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Course {
  id: string; title: string; type: string; level: string;
  price: number; is_published: boolean; enrollment_count: string;
  duration_hours: number;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get('/courses', { params: { search, limit: 100, admin: 'true' } })
      .then(({ data }) => setCourses(data.courses))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  const togglePublish = async (course: Course) => {
    try {
      await api.put(`/courses/${course.id}`, { is_published: !course.is_published });
      toast.success(course.is_published ? 'Course unpublished' : 'Course published');
      load();
    } catch { toast.error('Failed to update course'); }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm('Delete this course and all its content?')) return;
    try {
      await api.delete(`/courses/${id}`);
      toast.success('Course deleted');
      load();
    } catch { toast.error('Failed to delete course'); }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Courses</h1>
          <p className="text-slate-400 text-sm mt-1">{courses.length} courses total</p>
        </div>
        <Link href="/dashboard/admin/courses/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Course
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-700/50">
              <tr className="text-slate-400">
                <th className="text-left px-6 py-4 font-medium">Course</th>
                <th className="text-left px-4 py-4 font-medium">Type</th>
                <th className="text-left px-4 py-4 font-medium">Level</th>
                <th className="text-left px-4 py-4 font-medium">Price</th>
                <th className="text-left px-4 py-4 font-medium">Students</th>
                <th className="text-left px-4 py-4 font-medium">Status</th>
                <th className="px-4 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {loading
                ? [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-dark-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
                : courses.map((c) => (
                  <tr key={c.id} className="hover:bg-dark-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-500/20 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-4 h-4 text-brand-400" />
                        </div>
                        <span className="font-medium text-slate-200">{c.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('badge', c.type === 'live' ? 'badge-purple' : 'badge-blue')}>
                        {c.type}
                      </span>
                    </td>
                    <td className="px-4 py-4"><span className={levelColor(c.level)}>{c.level}</span></td>
                    <td className="px-4 py-4 text-slate-300">{formatPrice(c.price)}</td>
                    <td className="px-4 py-4 text-slate-300">{c.enrollment_count}</td>
                    <td className="px-4 py-4">
                      <span className={cn('badge', c.is_published ? 'badge-green' : 'badge-yellow')}>
                        {c.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 justify-center">
                        <Link href={`/dashboard/admin/courses/${c.id}`} className="p-1.5 text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button onClick={() => togglePublish(c)} className="p-1.5 text-slate-400 hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-colors">
                          {c.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button onClick={() => deleteCourse(c.id)} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
