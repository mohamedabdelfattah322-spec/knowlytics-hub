'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  type: z.enum(['online', 'live', 'hybrid']),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  price: z.coerce.number().min(0),
  duration_hours: z.coerce.number().min(0),
});
type FormValues = z.infer<typeof schema>;

export default function NewCoursePage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'online', level: 'Beginner', price: 0, duration_hours: 0 },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const { data: course } = await api.post('/courses', data);
      toast.success('Course created!');
      router.push(`/dashboard/admin/courses/${course.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to create course');
    }
  };

  return (
    <div className="max-w-2xl space-y-6 animate-slide-up">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/courses" className="p-2 text-slate-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Create New Course</h1>
          <p className="text-slate-400 text-sm mt-0.5">Fill in the course details below</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Course Title *</label>
          <input {...register('title')} className="input" placeholder="e.g. Full-Stack Web Development Bootcamp" />
          {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Description *</label>
          <textarea {...register('description')} rows={4} className="input resize-none" placeholder="Describe what students will learn..." />
          {errors.description && <p className="text-red-400 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Course Type</label>
            <select {...register('type')} className="input">
              <option value="online">Online (Recorded)</option>
              <option value="live">Live (Zoom)</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Level</label>
            <select {...register('level')} className="input">
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">السعر (جنيه)</label>
            <input {...register('price')} type="number" step="0.01" min="0" className="input" placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Duration (hours)</label>
            <input {...register('duration_hours')} type="number" step="0.5" min="0" className="input" placeholder="0" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center gap-2">
            {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Course'}
          </button>
          <Link href="/dashboard/admin/courses" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
