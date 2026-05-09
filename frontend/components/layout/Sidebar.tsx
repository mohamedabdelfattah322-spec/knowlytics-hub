'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard, BookOpen, Users, BarChart2, Video,
  Settings, LogOut, Bell, FolderOpen, GraduationCap, CreditCard, Tag, Package, Mail,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const adminNav = [
  { href: '/dashboard/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/admin/courses', icon: BookOpen, label: 'Courses' },
  { href: '/dashboard/admin/users', icon: Users, label: 'Users' },
  { href: '/dashboard/admin/payments', icon: CreditCard, label: 'Payments' },
  { href: '/dashboard/admin/coupons', icon: Tag, label: 'Coupons' },
  { href: '/dashboard/admin/bundles', icon: Package, label: 'Bundles' },
  { href: '/dashboard/admin/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/dashboard/admin/newsletter', icon: Mail, label: 'Newsletter' },
  { href: '/dashboard/admin/sessions', icon: Settings, label: 'Sessions' },
];

const studentNav = [
  { href: '/dashboard/student', icon: LayoutDashboard, label: 'Overview' },
  { href: '/dashboard/student/courses', icon: BookOpen, label: 'My Courses' },
  { href: '/dashboard/student/progress', icon: BarChart2, label: 'Progress' },
  { href: '/dashboard/student/notes', icon: FolderOpen, label: 'Notes & Bookmarks' },
  { href: '/courses', icon: GraduationCap, label: 'Browse Courses' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const nav = user?.role === 'admin' ? adminNav : studentNav;

  return (
    <aside className="w-64 bg-dark-800 border-r border-dark-700 flex flex-col h-screen sticky top-0">
      {/* Logo - links to user's dashboard */}
      <Link href={user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/student'}
            className="px-5 py-4 border-b border-dark-700 flex items-center justify-center hover:bg-dark-700/30 transition-colors">
        <Image
          src="/logo.png"
          alt="Knowlytics Hub"
          width={180}
          height={50}
          className="object-contain"
          priority
        />
      </Link>

      {/* User info */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white font-semibold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400 capitalize">
              {user?.role === 'admin' ? '👑 Admin' : `🎓 ${user?.student_type} Student`}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/dashboard/admin' && href !== '/dashboard/student' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-dark-700'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-dark-700">
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-900/20 w-full transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
