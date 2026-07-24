'use client';
import { useState, useEffect } from 'react';
import { Trophy, Star, Flame, Zap, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface Badge {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number;
  xp_reward: number;
  earned_at?: string;
}

interface Stats {
  xp: number;
  level: number;
  streak_days: number;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar_url: string;
  xp: number;
  level: number;
  streak_days: number;
  badge_count: number;
}

export default function BadgesPage() {
  const [myBadges, setMyBadges] = useState<Badge[]>([]);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [stats, setStats] = useState<Stats>({ xp: 0, level: 1, streak_days: 0 });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'badges' | 'leaderboard'>('badges');

  useEffect(() => {
    Promise.all([
      api.get('/badges/my'),
      api.get('/badges'),
      api.get('/badges/leaderboard'),
      api.post('/badges/check'), // Check & award new badges on visit
    ]).then(([myRes, allRes, lbRes]) => {
      setMyBadges(myRes.data.badges);
      setStats(myRes.data.stats);
      setAllBadges(allRes.data);
      setLeaderboard(lbRes.data);
    }).catch(() => toast.error('فشل تحميل الإنجازات'))
    .finally(() => setLoading(false));
  }, []);

  const earnedIds = new Set(myBadges.map(b => b.id));
  const xpToNext = ((stats.level) * 500) - stats.xp;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Trophy className="w-6 h-6 text-yellow-400" /> الإنجازات والمستوى
      </h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-white">{stats.xp}</p>
          <p className="text-slate-400 text-sm">نقاط الخبرة (XP)</p>
          <div className="mt-2 bg-dark-700 rounded-full h-2">
            <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${Math.min(100, ((stats.xp % 500) / 500) * 100)}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-1">{xpToNext > 0 ? `${xpToNext} XP للمستوى التالي` : 'مستوى جديد!'}</p>
        </div>
        <div className="card text-center">
          <Zap className="w-8 h-8 text-brand-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-white">المستوى {stats.level}</p>
          <p className="text-slate-400 text-sm">المستوى الحالي</p>
        </div>
        <div className="card text-center">
          <Flame className="w-8 h-8 text-orange-400 mx-auto mb-2" />
          <p className="text-3xl font-bold text-white">{stats.streak_days} يوم</p>
          <p className="text-slate-400 text-sm">سلسلة الحضور</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-dark-700 pb-1">
        <button onClick={() => setTab('badges')} className={`px-4 py-2 text-sm font-medium rounded-t ${tab === 'badges' ? 'text-brand-400 border-b-2 border-brand-400' : 'text-slate-400'}`}>
          الشارات ({myBadges.length}/{allBadges.length})
        </button>
        <button onClick={() => setTab('leaderboard')} className={`px-4 py-2 text-sm font-medium rounded-t ${tab === 'leaderboard' ? 'text-brand-400 border-b-2 border-brand-400' : 'text-slate-400'}`}>
          لوحة المتصدرين
        </button>
      </div>

      {tab === 'badges' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {allBadges.map((badge) => {
            const earned = earnedIds.has(badge.id);
            return (
              <div key={badge.id} className={`card text-center relative ${earned ? '' : 'opacity-40 grayscale'}`}>
                {earned && <div className="absolute top-2 right-2 w-3 h-3 bg-green-400 rounded-full" />}
                <span className="text-4xl block mb-2">{badge.icon}</span>
                <p className="text-white font-medium text-sm">{badge.name_ar || badge.name}</p>
                <p className="text-slate-500 text-xs mt-1">{badge.description}</p>
                <p className="text-brand-400 text-xs mt-2">+{badge.xp_reward} XP</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card">
          <div className="space-y-2">
            {leaderboard.map((entry, i) => (
              <div key={entry.id} className="flex items-center gap-3 py-2 border-b border-dark-700 last:border-0">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i < 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-dark-700 text-slate-400'}`}>
                  {i + 1}
                </span>
                <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-white text-sm font-bold">
                  {entry.name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{entry.name}</p>
                  <p className="text-slate-500 text-xs">المستوى {entry.level} • {entry.badge_count} شارة</p>
                </div>
                <p className="text-brand-400 font-bold">{entry.xp} XP</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
