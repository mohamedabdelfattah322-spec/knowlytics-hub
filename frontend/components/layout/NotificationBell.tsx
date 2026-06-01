'use client';
import { useEffect, useRef, useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import Link from 'next/link';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'inactivity';
  is_read: boolean;
  link: string | null;
  created_at: string;
}

const typeIcon = {
  info: <Info className="w-3.5 h-3.5 text-blue-400" />,
  success: <CheckCircle className="w-3.5 h-3.5 text-green-400" />,
  warning: <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />,
  inactivity: <Bell className="w-3.5 h-3.5 text-orange-400" />,
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnread(data.unread_count || 0);
    } catch {}
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    await api.post('/notifications/mark-all-read');
    setNotifications((n) => n.map((x) => ({ ...x, is_read: true })));
    setUnread(0);
  };

  const markOne = async (id: string) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((n) => n.map((x) => x.id === id ? { ...x, is_read: true } : x));
    setUnread((c) => Math.max(0, c - 1));
  };

  const deleteOne = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await api.delete(`/notifications/${id}`);
    const notif = notifications.find((n) => n.id === id);
    setNotifications((n) => n.filter((x) => x.id !== id));
    if (notif && !notif.is_read) setUnread((c) => Math.max(0, c - 1));
  };

  const timeAgo = (date: string) => {
    const diff = (Date.now() - new Date(date).getTime()) / 1000;
    if (diff < 60) return 'الآن';
    if (diff < 3600) return `${Math.floor(diff / 60)} دقيقة`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ساعة`;
    return `${Math.floor(diff / 86400)} يوم`;
  };

  return (
    <div className="relative" ref={ref} data-guide="notifications">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-dark-800 border border-dark-600 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
            <h3 className="text-sm font-semibold text-white">الإشعارات</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" /> قراءة الكل
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">لا توجد إشعارات</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => { if (!n.is_read) markOne(n.id); }}
                  className={cn(
                    'group flex items-start gap-3 px-4 py-3 border-b border-dark-700/60 cursor-pointer hover:bg-dark-700/50 transition-colors',
                    !n.is_read && 'bg-brand-500/5'
                  )}
                >
                  <div className="mt-0.5 shrink-0">{typeIcon[n.type] || typeIcon.info}</div>
                  <div className="flex-1 min-w-0">
                    {n.link ? (
                      <Link
                        href={n.link}
                        className="text-sm text-slate-200 leading-snug hover:text-white"
                        onClick={() => setOpen(false)}
                      >
                        {n.message}
                      </Link>
                    ) : (
                      <p className="text-sm text-slate-200 leading-snug">{n.message}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!n.is_read && (
                      <span className="w-2 h-2 bg-brand-500 rounded-full" />
                    )}
                    <button
                      onClick={(e) => deleteOne(n.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
