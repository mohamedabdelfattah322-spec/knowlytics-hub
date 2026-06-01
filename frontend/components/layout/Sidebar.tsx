'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, BookOpen, Users, BarChart2, Video,
  Settings, LogOut, Bell, FolderOpen, GraduationCap, CreditCard, Tag, Package, Mail,
  ShoppingCart, Trophy, Calendar, UserCheck, Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import ThemeLogo from '@/components/ThemeLogo';
import ThemeSwitcher from './ThemeSwitcher';
import LanguageSwitcher from './LanguageSwitcher';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const adminNav = [
    { href: '/dashboard/admin', icon: LayoutDashboard, label: t('nav.dashboard') },
    { href: '/dashboard/admin/courses', icon: BookOpen, label: t('nav.courses') },
    { href: '/dashboard/admin/users', icon: Users, label: t('nav.users') },
    { href: '/dashboard/admin/payments', icon: CreditCard, label: t('nav.payments') },
    { href: '/dashboard/admin/coupons', icon: Tag, label: t('nav.coupons') },
    { href: '/dashboard/admin/bundles', icon: Package, label: t('nav.bundles') },
    { href: '/dashboard/admin/analytics', icon: BarChart2, label: t('nav.analytics') },
    { href: '/dashboard/admin/newsletter', icon: Mail, label: t('nav.newsletter') },
    { href: '/dashboard/admin/categories', icon: FolderOpen, label: t('nav.categories') },
    { href: '/dashboard/admin/subscriptions', icon: CreditCard, label: t('nav.subscriptions') },
    { href: '/dashboard/admin/referrals', icon: Share2, label: t('nav.referrals') },
    { href: '/dashboard/admin/teams', icon: UserCheck, label: t('nav.teams') },
    { href: '/dashboard/admin/sessions', icon: Settings, label: t('nav.sessions') },
    { href: '/dashboard/admin/settings', icon: Settings, label: t('nav.settings') },
  ];

  const studentNav = [
    { href: '/dashboard/student', icon: LayoutDashboard, label: t('nav.overview') },
    { href: '/dashboard/student/courses', icon: BookOpen, label: t('nav.myCourses') },
    { href: '/dashboard/student/progress', icon: BarChart2, label: t('nav.progress') },
    { href: '/dashboard/student/notes', icon: FolderOpen, label: t('nav.notes') },
    { href: '/dashboard/student/badges', icon: Trophy, label: t('nav.badges') },
    { href: '/dashboard/student/cart', icon: ShoppingCart, label: t('nav.cart') },
    { href: '/dashboard/student/calendar', icon: Calendar, label: t('nav.calendar') },
    { href: '/dashboard/student/referrals', icon: Share2, label: t('nav.referrals') },
    { href: '/courses', icon: GraduationCap, label: t('nav.browse') },
    { href: '/dashboard/student/settings', icon: Settings, label: t('nav.settings') },
  ];

  const nav = user?.role === 'admin' ? adminNav : studentNav;

  return (
    <aside className="w-64 bg-[#0c1a30] border-r border-[#1a3050] flex flex-col h-screen sticky top-0" data-guide="sidebar">
      {/* Logo */}
      <Link href={user?.role === 'admin' ? '/dashboard/admin' : '/dashboard/student'}
            className="px-5 py-4 border-b border-[#1a3050] flex items-center justify-center hover:bg-[#142640] transition-colors">
        <Image src="/logo-white.png" alt="Knowlytics Hub" width={180} height={50} className="object-contain" priority />
      </Link>

      {/* User info */}
      <div className="p-4 border-b border-[#1a3050]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-blue-300/70 capitalize">
              {user?.role === 'admin' ? '👑 Admin' : `🎓 ${user?.student_type}`}
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
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                  : 'text-blue-100/70 hover:text-white hover:bg-[#142640]'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Theme + Language + Logout */}
      <div className="p-4 border-t border-[#1a3050] space-y-1">
        <ThemeSwitcher />
        <LanguageSwitcher />
        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-100/70 hover:text-red-400 hover:bg-red-900/20 w-full transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          {t('common.signOut')}
        </button>
      </div>
    </aside>
  );
}
