'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useToast } from '@/context/ToastContext';
import { queueOfflineLog, getPendingLogs, deletePendingLog } from '@/lib/offlineQueue';
import { getLocalDateString, getDaysInMonth, getDayOfWeek, getMonthName } from '@/lib/dates';
import { getNextMilestone } from '@/lib/points';
import QuoteBanner from '@/components/shared/QuoteBanner';
import { Flame, Star, Award, TrendingUp, Check, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface HabitStatus {
  habitId: string;
  key: string;
  name: string;
  question: string;
  emoji: string;
  colorHex: string;
  completed: boolean | null;
}

interface StatsSummary {
  stats: {
    lifetimePoints: number;
    gymCurrentStreak: number;
    gymMaxStreak: number;
    maidaCurrentStreak: number;
    maidaMaxStreak: number;
    combinedCurrentStreak: number;
    combinedMaxStreak: number;
    totalActiveDays: number;
    perfectDays: number;
  };
  completionPercentage: number;
  weeklyProgress: {
    date: string;
    dayName: string;
    gymCompleted: boolean | null;
    maidaCompleted: boolean | null;
    color: 'gray' | 'green' | 'blue' | 'purple' | 'red';
  }[];
  monthlyProgress: {
    completed: number;
    totalDaysSoFar: number;
    totalDaysInMonth: number;
    percentage: number;
  };
}

export default function Dashboard() {
  const isOnline = useOnlineStatus();
  const { showToast } = useToast();
  const router = useRouter();

  const [dateStr, setDateStr] = useState('');
  const [habits, setHabits] = useState<HabitStatus[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Fetch habits today and stats summary
  const fetchData = useCallback(async () => {
    try {
      const today = getLocalDateString();
      setDateStr(today);

      // Load from server if online
      if (isOnline) {
        const [habitsRes, statsRes] = await Promise.all([
          fetch(`/api/habits/today?date=${today}`),
          fetch('/api/stats/summary'),
        ]);

        if (habitsRes.ok && statsRes.ok) {
          const habitsData = await habitsRes.json();
          const statsData = await statsRes.json();

          setHabits(habitsData.habits);
          setStats(statsData);

          // Cache in local storage for offline use
          localStorage.setItem('cached_habits', JSON.stringify(habitsData.habits));
          localStorage.setItem('cached_stats', JSON.stringify(statsData));
        }
      } else {
        // Read from cache when offline
        const cachedHabits = localStorage.getItem('cached_habits');
        const cachedStats = localStorage.getItem('cached_stats');

        if (cachedHabits) setHabits(JSON.parse(cachedHabits));
        if (cachedStats) setStats(JSON.parse(cachedStats));
      }
    } catch (e) {
      console.error('Error fetching dashboard data:', e);
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync offline queue when coming back online
  useEffect(() => {
    const syncLogs = async () => {
      if (isOnline) {
        setSyncing(true);
        const pending = await getPendingLogs();
        if (pending.length > 0) {
          let syncedCount = 0;
          for (const log of pending) {
            try {
              const res = await fetch('/api/habits/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: log.date, entries: log.entries }),
              });
              if (res.ok) {
                await deletePendingLog(log.date);
                syncedCount++;
              }
            } catch (err) {
              console.error('Error syncing log:', log.date, err);
              break;
            }
          }
          if (syncedCount > 0) {
            showToast(`Synced ${syncedCount} pending logs!`, 'success');
            fetchData();
          }
        }
        setSyncing(false);
      }
    };

    syncLogs();
  }, [isOnline, fetchData, showToast]);

  // Toggle habit checkbox locally
  const handleToggleHabit = (habitId: string) => {
    setHabits((prev) =>
      prev.map((h) => (h.habitId === habitId ? { ...h, completed: !h.completed } : h))
    );
  };

  // Save/Update logs
  const handleSave = async () => {
    setSaving(true);
    const entries = habits.map((h) => ({
      habitId: h.habitId,
      completed: h.completed || false,
    }));

    if (isOnline) {
      try {
        const res = await fetch('/api/habits/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: dateStr, entries }),
        });

        const data = await res.json();
        if (res.ok) {
          showToast('Progress saved!', 'success');
          // Update stats dynamically
          fetchData();

          // Check if any badges unlocked
          if (data.newAchievements && data.newAchievements.length > 0) {
            data.newAchievements.forEach((badgeKey: string) => {
              // Convert key to display name
              const badgeName = badgeKey
                .split('_')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
              showToast(`Unlocked badge: ${badgeName}!`, 'badge', badgeKey);
            });
          }
        } else {
          showToast(data.error || 'Failed to save progress.', 'error');
        }
      } catch (err) {
        showToast('Network error saving progress.', 'error');
      }
    } else {
      // Offline queueing
      try {
        await queueOfflineLog({ date: dateStr, entries });
        showToast('Progress saved offline!', 'success');
        
        // Optimistic UI updates
        const cachedStatsStr = localStorage.getItem('cached_stats');
        if (cachedStatsStr) {
          const cachedStats = JSON.parse(cachedStatsStr) as StatsSummary;
          // Simple local increment of points for response visualization
          const pointsDiff = entries.filter((e) => e.completed).length * 10;
          cachedStats.stats.lifetimePoints += pointsDiff;
          setStats(cachedStats);
        }
      } catch (err) {
        showToast('Failed to write offline logs.', 'error');
      }
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Determine Save Button label (Save vs Update vs Saved offline)
  const isAlreadyLogged = habits.some((h) => h.completed !== null);
  let saveBtnLabel = isAlreadyLogged ? 'Update today\'s progress' : 'Save today\'s progress';
  if (!isOnline) {
    saveBtnLabel = 'Save (offline)';
  }

  // Calculate Points milestone values
  const currentStreak = stats?.stats.combinedCurrentStreak || 0;
  const milestone = getNextMilestone(currentStreak);
  const milestoneProgress = currentStreak - milestone.prev;
  const milestoneTotal = milestone.target - milestone.prev;
  const milestonePercent = Math.min(100, Math.max(0, (milestoneProgress / milestoneTotal) * 100));

  // Determine current month calendar heatmap parameters
  const getHeatmapGrid = () => {
    const todayVal = new Date();
    const year = todayVal.getFullYear();
    const month = todayVal.getMonth(); // 0-indexed
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
    const daysInMonth = getDaysInMonth(year, month + 1);

    const cells = [];
    // Add empty spacer cells for calendar start offset
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ date: '', color: 'bg-transparent' });
    }

    // Weekly progress map for color checks
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${monthPrefix}-${String(day).padStart(2, '0')}`;
      
      let colorClass = 'bg-slate-200/50 dark:bg-zinc-800/80'; // Default gray
      if (stats && stats.weeklyProgress) {
        // If it's this week, check the color in weekly progress
        const weekDay = stats.weeklyProgress.find((w) => w.date === dateString);
        if (weekDay) {
          if (weekDay.color === 'purple') colorClass = 'bg-purple-500';
          else if (weekDay.color === 'green') colorClass = 'bg-green-500';
          else if (weekDay.color === 'blue') colorClass = 'bg-blue-500';
          else if (weekDay.color === 'red') colorClass = 'bg-red-500';
        }
      }
      
      cells.push({ date: dateString, color: colorClass });
    }

    return { cells, monthName: getMonthName(month + 1), year };
  };

  const heatmapConfig = getHeatmapGrid();

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      {/* Offline Sync Banner */}
      {!isOnline && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs font-bold shadow-sm">
          <AlertCircle size={16} />
          You are offline. Logs will be stored locally and synced when online.
        </div>
      )}

      {syncing && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold shadow-sm animate-pulse-slow">
          <RefreshCw size={16} className="animate-spin" />
          Syncing local logs with database...
        </div>
      )}

      {/* Today's Habits Card */}
      <section className="glass-panel p-6 rounded-3xl shadow-xl flex flex-col gap-5 bg-white/95 dark:bg-zinc-950/95">
        <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Today's Habits
        </h2>
        
        <div className="flex flex-col gap-4">
          {habits.map((habit) => (
            <div
              key={habit.habitId}
              onClick={() => handleToggleHabit(habit.habitId)}
              className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer border transition-all duration-300 ${
                habit.completed
                  ? 'border-purple-500/20 bg-purple-500/5 shadow-purple-500/5'
                  : 'border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl" role="img" aria-label={habit.name}>
                  {habit.emoji}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {habit.name}
                  </p>
                  <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    {habit.question}
                  </p>
                </div>
              </div>
              
              {/* Checkbox visual block with 44x44 target area */}
              <div className="min-w-[44px] min-h-[44px] flex items-center justify-center">
                <div
                  className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all ${
                    habit.completed
                      ? 'bg-purple-600 border-purple-600 text-white scale-105 shadow-md shadow-purple-500/20'
                      : 'border-slate-300 dark:border-zinc-700 bg-transparent'
                  }`}
                >
                  {habit.completed && <Check size={16} className="stroke-[3px]" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Saving...' : saveBtnLabel}
        </button>
      </section>

      {/* Quick Stats Grid */}
      {stats && (
        <section className="grid grid-cols-2 gap-4">
          <div className="glass-panel p-4 rounded-3xl flex flex-col gap-2 relative overflow-hidden bg-white/70 dark:bg-zinc-900/70">
            <div className="text-orange-500 dark:text-orange-400">
              <Flame size={20} className="fill-orange-500/15" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Current Streak
              </p>
              <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                {stats.stats.combinedCurrentStreak} days
              </p>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-3xl flex flex-col gap-2 bg-white/70 dark:bg-zinc-900/70">
            <div className="text-amber-500 dark:text-amber-400">
              <Award size={20} className="fill-amber-500/10" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Max Streak
              </p>
              <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                {stats.stats.combinedMaxStreak} days
              </p>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-3xl flex flex-col gap-2 bg-white/70 dark:bg-zinc-900/70">
            <div className="text-purple-600 dark:text-purple-400">
              <Star size={20} className="fill-purple-500/10" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Reward Points
              </p>
              <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                {stats.stats.lifetimePoints} XP
              </p>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-3xl flex flex-col gap-2 bg-white/70 dark:bg-zinc-900/70">
            <div className="text-emerald-500 dark:text-emerald-400">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Completion %
              </p>
              <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
                {stats.completionPercentage}%
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Weekly Progress */}
      {stats && (
        <section className="glass-panel p-5 rounded-3xl bg-white/70 dark:bg-zinc-900/70 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Weekly Progress
            </h3>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
              {stats.weeklyProgress.filter((w) => w.color === 'purple').length}/7 days done
            </span>
          </div>

          {/* Mon-Sun Grid Row */}
          <div className="grid grid-cols-7 gap-2">
            {stats.weeklyProgress.map((w, index) => {
              let dotColor = 'bg-slate-200 dark:bg-zinc-800/80';
              if (w.color === 'purple') dotColor = 'bg-purple-500';
              else if (w.color === 'green') dotColor = 'bg-green-500';
              else if (w.color === 'blue') dotColor = 'bg-blue-500';
              else if (w.color === 'red') dotColor = 'bg-red-500';

              return (
                <div key={index} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    {w.dayName}
                  </span>
                  <div className={`w-7 h-7 rounded-xl ${dotColor} flex items-center justify-center transition-all`} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Monthly Progress */}
      {stats && (
        <section className="glass-panel p-5 rounded-3xl bg-white/70 dark:bg-zinc-900/70 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Monthly Progress
            </h3>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {stats.monthlyProgress.completed}/{stats.monthlyProgress.totalDaysInMonth} perfect days ({stats.monthlyProgress.percentage}%)
            </span>
          </div>
          
          {/* Progress bar container */}
          <div className="w-full bg-slate-200/50 dark:bg-zinc-800/80 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-purple-600 dark:bg-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.monthlyProgress.percentage}%` }}
            />
          </div>
        </section>
      )}

      {/* Current Month Calendar Heatmap */}
      <Link href="/heatmap" className="block cursor-pointer">
        <section className="glass-panel p-5 rounded-3xl bg-white/70 dark:bg-zinc-900/70 flex flex-col gap-4 hover:scale-[1.01] transition-all">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {heatmapConfig.monthName} {heatmapConfig.year} Heatmap
            </h3>
            <span className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline">
              View Calendar
            </span>
          </div>

          {/* Calendar 7-column grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <span key={index} className="text-[9px] font-bold text-slate-400 dark:text-slate-500 text-center uppercase">
                {day}
              </span>
            ))}
            {heatmapConfig.cells.map((cell, index) => (
              <div
                key={index}
                className={`aspect-square rounded-md ${cell.color} transition-all`}
              />
            ))}
          </div>
        </section>
      </Link>

      {/* Points Progress / Milestone Tracker */}
      <section className="glass-panel p-5 rounded-3xl bg-white/70 dark:bg-zinc-900/70 flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Streak Milestone
            </h3>
            <p className="text-[11px] font-bold text-purple-600 dark:text-purple-400 mt-0.5">
              Awarding +{milestone.bonus} XP at {milestone.target} days
            </p>
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {currentStreak}/{milestone.target} days
          </span>
        </div>

        <div className="w-full bg-slate-200/50 dark:bg-zinc-800/80 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${milestonePercent}%` }}
          />
        </div>
      </section>

      {/* Motivational Quote */}
      <QuoteBanner />
    </div>
  );
}
