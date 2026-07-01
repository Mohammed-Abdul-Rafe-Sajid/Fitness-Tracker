'use client';

import React, { useState, useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useToast } from '@/context/ToastContext';
import SimpleBarChart from '@/components/analytics/SimpleBarChart';
import PercentRing from '@/components/analytics/PercentRing';
import { TrendingUp, BarChart2 } from 'lucide-react';

interface AnalyticsData {
  weeklyCompletion: { weekStart: string; percent: number }[];
  monthlyCompletion: { month: string; monthName: string; percent: number }[];
  gymCompletionPercent: number;
  maidaCompletionPercent: number;
  totalGymDays: number;
  totalMaidaDays: number;
  perfectDays: number;
  missedDays: number;
}

export default function AnalyticsPage() {
  const isOnline = useOnlineStatus();
  const { showToast } = useToast();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        if (isOnline) {
          const res = await fetch('/api/stats/analytics');
          if (res.ok) {
            const result = await res.json();
            setData(result);
            localStorage.setItem('cached_analytics', JSON.stringify(result));
          } else {
            showToast('Failed to load analytics', 'error');
          }
        } else {
          const cached = localStorage.getItem('cached_analytics');
          if (cached) {
            setData(JSON.parse(cached));
          }
        }
      } catch (e) {
        console.error('Error fetching analytics:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [isOnline, showToast]);

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

  if (!data) return null;

  const weeklyChartData = data.weeklyCompletion.map((w) => {
    const date = new Date(w.weekStart + 'T00:00:00');
    const label = date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
    return {
      label,
      percent: w.percent,
    };
  });

  const monthlyChartData = data.monthlyCompletion.map((m) => ({
    label: m.monthName,
    percent: m.percent,
  }));

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      <section className="glass-panel p-6 rounded-3xl bg-white/95 dark:bg-zinc-950/95 shadow-xl flex justify-around items-center">
        <PercentRing
          percent={data.gymCompletionPercent}
          color="stroke-green-500"
          label="Gym"
        />
        <div className="w-[1px] h-12 bg-slate-200 dark:bg-zinc-800/80" />
        <PercentRing
          percent={data.maidaCompletionPercent}
          color="stroke-blue-500"
          label="No Maida"
        />
      </section>

      <section className="glass-panel p-5 rounded-3xl bg-white/70 dark:bg-zinc-900/70 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          <TrendingUp size={14} />
          Weekly Completion %
        </div>
        <SimpleBarChart data={weeklyChartData} barColor="bg-purple-500 dark:bg-purple-600" />
      </section>

      <section className="glass-panel p-5 rounded-3xl bg-white/70 dark:bg-zinc-900/70 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          <BarChart2 size={14} />
          Monthly Completion %
        </div>
        <SimpleBarChart data={monthlyChartData} barColor="bg-indigo-500 dark:bg-indigo-600" />
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="glass-panel p-4 rounded-3xl flex flex-col gap-2 bg-white/70 dark:bg-zinc-900/70">
          <span className="text-xl">🏋️</span>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Total Gym Days
            </p>
            <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
              {data.totalGymDays} days
            </p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-3xl flex flex-col gap-2 bg-white/70 dark:bg-zinc-900/70">
          <span className="text-xl">🚫</span>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Maida-Free Days
            </p>
            <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
              {data.totalMaidaDays} days
            </p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-3xl flex flex-col gap-2 bg-white/70 dark:bg-zinc-900/70">
          <span className="text-xl">⭐</span>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Perfect Days
            </p>
            <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
              {data.perfectDays} days
            </p>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-3xl flex flex-col gap-2 bg-white/70 dark:bg-zinc-900/70">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Missed Days
            </p>
            <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">
              {data.missedDays} days
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
