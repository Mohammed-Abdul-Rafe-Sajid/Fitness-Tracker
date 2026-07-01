'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getLocalDateString, getDaysInMonth, getMonthName } from '@/lib/dates';
import { ChevronLeft, ChevronRight, Edit2, Info, X } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

interface DayCell {
  date: string;
  gymCompleted: boolean | null;
  maidaCompleted: boolean | null;
}

export default function HeatmapPage() {
  const isOnline = useOnlineStatus();
  const { showToast } = useToast();
  const router = useRouter();

  const [currentView, setCurrentView] = useState(() => {
    const today = getLocalDateString();
    return today.substring(0, 7);
  });

  const [days, setDays] = useState<DayCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayCell | null>(null);

  const fetchHeatmap = useCallback(async (month: string) => {
    setLoading(true);
    try {
      if (isOnline) {
        const res = await fetch(`/api/stats/heatmap?month=${month}`);
        if (res.ok) {
          const data = await res.json();
          setDays(data.days);
          localStorage.setItem(`heatmap_${month}`, JSON.stringify(data.days));
        } else {
          const data = await res.json();
          showToast(data.error || 'Failed to fetch heatmap', 'error');
        }
      } else {
        const cached = localStorage.getItem(`heatmap_${month}`);
        if (cached) {
          setDays(JSON.parse(cached));
        } else {
          setDays([]);
        }
      }
    } catch (e) {
      console.error('Error fetching heatmap:', e);
    } finally {
      setLoading(false);
    }
  }, [isOnline, showToast]);

  useEffect(() => {
    fetchHeatmap(currentView);
  }, [currentView, fetchHeatmap]);

  const handlePrevMonth = () => {
    const [year, month] = currentView.split('-').map(Number);
    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = year - 1;
    }
    const prevView = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    setCurrentView(prevView);
  };

  const handleNextMonth = () => {
    const todayMonth = getLocalDateString().substring(0, 7);
    if (currentView >= todayMonth) return;

    const [year, month] = currentView.split('-').map(Number);
    let nextYear = year;
    let nextMonth = month + 1;
    if (nextMonth === 13) {
      nextMonth = 1;
      nextYear = year + 1;
    }
    const nextView = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
    setCurrentView(nextView);
  };

  const getCellColor = (gym: boolean | null, maida: boolean | null) => {
    if (gym === null && maida === null) return 'bg-slate-200/50 dark:bg-zinc-800/80 hover:ring-2 hover:ring-slate-300 dark:hover:ring-zinc-700';
    if (gym === true && maida === true) return 'bg-purple-500 text-white hover:ring-2 hover:ring-purple-300';
    if (gym === true && (maida === false || maida === null)) return 'bg-green-500 text-white hover:ring-2 hover:ring-green-300';
    if (maida === true && (gym === false || gym === null)) return 'bg-blue-500 text-white hover:ring-2 hover:ring-blue-300';
    if (gym === false && maida === false) return 'bg-red-500 text-white hover:ring-2 hover:ring-red-300';
    return 'bg-slate-200/50 dark:bg-zinc-800/80';
  };

  const isEditable = (dateStr: string) => {
    const todayStr = getLocalDateString();
    let current = todayStr;
    const allowed = new Set<string>();
    for (let i = 0; i < 7; i++) {
      allowed.add(current);
      const d = new Date(current + 'T00:00:00');
      d.setDate(d.getDate() - 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dy = String(d.getDate()).padStart(2, '0');
      current = `${y}-${m}-${dy}`;
    }
    return allowed.has(dateStr);
  };

  const [yearStr, monthStr] = currentView.split('-');
  const viewYear = Number(yearStr);
  const viewMonth = Number(monthStr);
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay();
  
  const gridCells: (DayCell | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    gridCells.push(null);
  }
  days.forEach((d) => {
    gridCells.push(d);
  });

  const todayMonth = getLocalDateString().substring(0, 7);
  const isNextDisabled = currentView >= todayMonth;

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      <section className="glass-panel p-5 rounded-3xl bg-white/70 dark:bg-zinc-900/70 flex justify-between items-center shadow-sm">
        <button
          onClick={handlePrevMonth}
          className="p-2 rounded-xl bg-slate-50 dark:bg-zinc-850 border border-slate-100 dark:border-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
        
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          {getMonthName(viewMonth)} {viewYear}
        </h2>
        
        <button
          onClick={handleNextMonth}
          disabled={isNextDisabled}
          className={`p-2 rounded-xl bg-slate-50 dark:bg-zinc-850 border border-slate-100 dark:border-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer ${
            isNextDisabled ? 'opacity-40 cursor-not-allowed' : ''
          }`}
        >
          <ChevronRight size={18} />
        </button>
      </section>

      <section className="glass-panel p-6 rounded-3xl bg-white/95 dark:bg-zinc-950/95 shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 border-3 border-purple-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-3 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <span key={d} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 text-center uppercase tracking-wide">
                  {d.slice(0, 1)}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {gridCells.map((cell, index) => {
                if (cell === null) {
                  return <div key={`spacer-${index}`} className="aspect-square bg-transparent" />;
                }
                const cellDay = cell.date.split('-')[2];
                return (
                  <button
                    key={cell.date}
                    onClick={() => setSelectedDay(cell)}
                    className={`aspect-square rounded-xl flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all ${getCellColor(
                      cell.gymCompleted,
                      cell.maidaCompleted
                    )}`}
                  >
                    <span>{Number(cellDay)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="glass-panel p-5 rounded-3xl bg-white/70 dark:bg-zinc-900/70 flex flex-col gap-3 shadow-sm">
        <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Legend
        </h3>
        <div className="flex flex-wrap gap-x-4 gap-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-slate-200/50 dark:bg-zinc-800/80" />
            <span className="text-[11px] font-semibold text-slate-500">No Data / Skipped</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-green-500" />
            <span className="text-[11px] font-semibold text-slate-500">Gym Only</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-blue-500" />
            <span className="text-[11px] font-semibold text-slate-500">No Maida Only</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-purple-500" />
            <span className="text-[11px] font-semibold text-slate-500">Both Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-md bg-red-500" />
            <span className="text-[11px] font-semibold text-slate-500">Both Failed</span>
          </div>
        </div>
      </section>

      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => setSelectedDay(null)}></div>
          
          <div className="glass-panel w-full max-w-md rounded-t-[32px] p-6 shadow-2xl relative z-10 animate-slide-up border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Log Details — {new Date(selectedDay.date + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-3 py-2">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/40">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">🏋️ Went to Gym</span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-xl ${
                    selectedDay.gymCompleted === true
                      ? 'bg-green-500/10 text-green-500'
                      : selectedDay.gymCompleted === false
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'
                  }`}
                >
                  {selectedDay.gymCompleted === true ? '✓ Succeeded' : selectedDay.gymCompleted === false ? '✗ Failed' : 'No Data'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/40">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">🚫 Avoided Maida</span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-xl ${
                    selectedDay.maidaCompleted === true
                      ? 'bg-blue-500/10 text-blue-500'
                      : selectedDay.maidaCompleted === false
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'
                  }`}
                >
                  {selectedDay.maidaCompleted === true ? '✓ Succeeded' : selectedDay.maidaCompleted === false ? '✗ Failed' : 'No Data'}
                </span>
              </div>
            </div>

            <div className="mt-6">
              {isEditable(selectedDay.date) ? (
                <button
                  onClick={() => {
                    setSelectedDay(null);
                    router.push(`/history/${selectedDay.date}`);
                  }}
                  className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-purple-500/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Edit2 size={16} />
                  Edit Day
                </button>
              ) : (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 justify-center p-3">
                  <Info size={14} />
                  This entry falls outside the 7-day edit window and is read-only.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
