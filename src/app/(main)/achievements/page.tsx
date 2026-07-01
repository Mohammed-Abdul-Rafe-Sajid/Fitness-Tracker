'use client';

import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useToast } from '@/context/ToastContext';
import { Trophy, Calendar } from 'lucide-react';

interface EarnedBadge {
  badgeKey: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

interface LockedBadge {
  badgeKey: string;
  name: string;
  description: string;
  icon: string;
}

export default function AchievementsPage() {
  const isOnline = useOnlineStatus();
  const { showToast } = useToast();

  const [earned, setEarned] = useState<EarnedBadge[]>([]);
  const [locked, setLocked] = useState<LockedBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAchievements = async () => {
      try {
        if (isOnline) {
          const res = await fetch('/api/achievements');
          if (res.ok) {
            const data = await res.json();
            setEarned(data.earned);
            setLocked(data.locked);
            localStorage.setItem('cached_earned_badges', JSON.stringify(data.earned));
            localStorage.setItem('cached_locked_badges', JSON.stringify(data.locked));
          } else {
            showToast('Failed to load achievements', 'error');
          }
        } else {
          const cachedEarned = localStorage.getItem('cached_earned_badges');
          const cachedLocked = localStorage.getItem('cached_locked_badges');
          if (cachedEarned) setEarned(JSON.parse(cachedEarned));
          if (cachedLocked) setLocked(JSON.parse(cachedLocked));
        }
      } catch (e) {
        console.error('Error fetching achievements:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [isOnline, showToast]);

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      <section className="glass-panel p-5 rounded-3xl bg-gradient-to-br from-purple-600/5 to-indigo-600/5 border border-purple-500/10 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-purple-600/10 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
          <Trophy size={24} className="stroke-[2.5px]" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Achievements
          </h2>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
            Earned {earned.length} of {earned.length + locked.length} available badges
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 flex flex-col items-center justify-center py-20">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 border-3 border-purple-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-3 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
          </div>
        ) : (
          <>
            {earned.map((badge) => (
              <div
                key={badge.badgeKey}
                className="glass-panel p-5 rounded-3xl flex flex-col items-center text-center gap-3 bg-white/95 dark:bg-zinc-950/95 shadow-xl border border-purple-500/20 relative overflow-hidden"
              >
                <div className="absolute -right-8 -top-8 w-16 h-16 bg-purple-500/10 rounded-full blur-xl"></div>
                
                <span className="text-4xl filter drop-shadow-md animate-pop" role="img" aria-label={badge.name}>
                  {badge.icon}
                </span>
                
                <div>
                  <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate max-w-full">
                    {badge.name}
                  </h4>
                  <p className="text-[9px] font-medium text-slate-400 dark:text-slate-500 mt-1 leading-snug">
                    {badge.description}
                  </p>
                </div>
                
                <div className="mt-1 flex items-center gap-1 text-[8px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider bg-purple-500/10 px-2.5 py-1 rounded-full">
                  <Calendar size={8} />
                  {new Date(badge.earnedAt).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </div>
              </div>
            ))}

            {locked.map((badge) => (
              <div
                key={badge.badgeKey}
                className="glass-panel p-5 rounded-3xl flex flex-col items-center text-center gap-3 bg-white/40 dark:bg-zinc-900/40 opacity-70 border border-slate-200/50 dark:border-zinc-900"
              >
                <span className="text-4xl grayscale opacity-40 select-none animate-fade-in" role="img" aria-label={badge.name}>
                  {badge.icon}
                </span>
                
                <div>
                  <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 truncate max-w-full">
                    {badge.name}
                  </h4>
                  <p className="text-[9px] font-medium text-slate-400 dark:text-slate-600 mt-1 leading-snug">
                    Hint: {badge.description}
                  </p>
                </div>
                
                <div className="mt-1 text-[8px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
                  Locked
                </div>
              </div>
            ))}
          </>
        )}
      </section>
    </div>
  );
}
