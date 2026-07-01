'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useToast } from '@/context/ToastContext';
import { getLocalDateString, isWithinLast7Days } from '@/lib/dates';
import { Check, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface RouteParams {
  params: {
    date: string;
  };
}

interface HabitEntry {
  habitId: string;
  key: string;
  name: string;
  question: string;
  emoji: string;
  completed: boolean | null;
}

export default function HistoryEditPage({ params }: RouteParams) {
  const isOnline = useOnlineStatus();
  const { showToast } = useToast();
  const router = useRouter();
  const { date } = params;

  const [habits, setHabits] = useState<HabitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const today = getLocalDateString();
    if (!isWithinLast7Days(date, today)) {
      showToast('This entry is read-only', 'error');
      router.replace('/history');
      return;
    }

    const fetchDayHabits = async () => {
      try {
        const res = await fetch(`/api/habits/${date}`);
        if (res.ok) {
          const data = await res.json();
          setHabits(data.habits);
        } else {
          showToast('Failed to load logs for this date', 'error');
          router.push('/history');
        }
      } catch (e) {
        console.error('Error fetching logs:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchDayHabits();
  }, [date, router, showToast]);

  const handleToggleHabit = (habitId: string) => {
    setHabits((prev) =>
      prev.map((h) => (h.habitId === habitId ? { ...h, completed: !h.completed } : h))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const entries = habits.map((h) => ({
      habitId: h.habitId,
      completed: h.completed || false,
    }));

    try {
      const res = await fetch('/api/habits/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, entries }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Logs updated successfully!', 'success');
        router.push('/history');
        
        if (data.newAchievements && data.newAchievements.length > 0) {
          data.newAchievements.forEach((badgeKey: string) => {
            const badgeName = badgeKey
              .split('_')
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            showToast(`Unlocked badge: ${badgeName}!`, 'badge', badgeKey);
          });
        }
      } else {
        showToast(data.error || 'Failed to update logs', 'error');
      }
    } catch (e) {
      showToast('Network error updating logs', 'error');
    } finally {
      setSaving(false);
    }
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

  const dateVal = new Date(date + 'T00:00:00');
  const formattedDate = dateVal.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      <div className="flex items-center gap-3">
        <Link
          href="/history"
          className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer"
        >
          <ArrowLeft size={16} />
        </Link>
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Back to History</span>
      </div>

      <section className="glass-panel p-6 rounded-3xl shadow-xl flex flex-col gap-5 bg-white/95 dark:bg-zinc-950/95">
        <div>
          <h2 className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            Edit Habit Log
          </h2>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-1 leading-snug">
            {formattedDate}
          </p>
        </div>

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
          {saving ? 'Updating...' : 'Update Logs'}
        </button>
      </section>
    </div>
  );
}
