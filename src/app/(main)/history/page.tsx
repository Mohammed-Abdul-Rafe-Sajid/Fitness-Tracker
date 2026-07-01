'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getLocalDateString } from '@/lib/dates';
import { useToast } from '@/context/ToastContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Filter, ChevronRight, X, Info } from 'lucide-react';

interface HistoryItem {
  date: string;
  gym: boolean | null;
  no_maida: boolean | null;
}

export default function HistoryPage() {
  const isOnline = useOnlineStatus();
  const { showToast } = useToast();
  const router = useRouter();

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(30);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        if (isOnline) {
          const res = await fetch('/api/habits');
          if (res.ok) {
            const data = await res.json();
            setHistory(data);
            localStorage.setItem('cached_history', JSON.stringify(data));
          } else {
            showToast('Failed to load history', 'error');
          }
        } else {
          const cached = localStorage.getItem('cached_history');
          if (cached) {
            setHistory(JSON.parse(cached));
          }
        }
      } catch (e) {
        console.error('Error fetching history:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [isOnline, showToast]);

  const toggleFilter = (filter: string) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(filter)) {
      newFilters.delete(filter);
    } else {
      newFilters.add(filter);
    }
    setActiveFilters(newFilters);
    setLimit(30);
  };

  const getHeatmapColor = (gym: boolean | null, maida: boolean | null) => {
    if (gym === true && maida === true) return 'bg-purple-500';
    if (gym === true && (maida === false || maida === null)) return 'bg-green-500';
    if (maida === true && (gym === false || gym === null)) return 'bg-blue-500';
    if (gym === false && maida === false) return 'bg-red-500';
    return 'bg-slate-200 dark:bg-zinc-800';
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

  const filteredHistory = history.filter((item) => {
    let match = true;
    if (activeFilters.has('gym') && item.gym !== true) match = false;
    if (activeFilters.has('maida') && item.no_maida !== true) match = false;
    if (activeFilters.has('completed') && !(item.gym === true && item.no_maida === true)) match = false;
    if (activeFilters.has('missed') && !(item.gym === false || item.no_maida === false)) match = false;
    return match;
  });

  const paginatedHistory = filteredHistory.slice(0, limit);

  return (
    <div className="flex flex-col gap-5 w-full animate-slide-up">
      <section className="glass-panel p-4 rounded-3xl bg-white/70 dark:bg-zinc-900/70 shadow-sm flex flex-col gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          <Filter size={14} />
          Filter Logs
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'gym', label: '🏋️ Gym Done' },
            { key: 'maida', label: '🚫 Maida Avoided' },
            { key: 'completed', label: '⭐ Perfect Days' },
            { key: 'missed', label: '⚠️ Missed Days' },
          ].map((chip) => {
            const active = activeFilters.has(chip.key);
            return (
              <button
                key={chip.key}
                onClick={() => toggleFilter(chip.key)}
                className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                  active
                    ? 'bg-purple-600 border-purple-600 text-white shadow-md'
                    : 'bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="glass-panel rounded-3xl bg-white/95 dark:bg-zinc-950/95 shadow-xl overflow-hidden p-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 border-3 border-purple-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-3 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
          </div>
        ) : paginatedHistory.length === 0 ? (
          <div className="text-center py-16 px-4">
            <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">
              No logged days match active filters.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {paginatedHistory.map((item, index) => {
              const editable = isEditable(item.date);
              const dateVal = new Date(item.date + 'T00:00:00');
              const dateLabel = dateVal.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
              const dayName = dateVal.toLocaleDateString('en-US', { weekday: 'short' });

              return (
                <div
                  key={item.date}
                  onClick={() => {
                    if (editable) {
                      router.push(`/history/${item.date}`);
                    } else {
                      setSelectedItem(item);
                    }
                  }}
                  className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900/50 transition-all rounded-2xl ${
                    index < paginatedHistory.length - 1 ? 'border-b border-slate-100 dark:border-zinc-900/40' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3.5 h-3.5 rounded-full ${getHeatmapColor(item.gym, item.no_maida)}`} />
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {dateLabel}
                      </p>
                      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                        {dayName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                          item.gym ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        Gym {item.gym ? '✓' : '✗'}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                          item.no_maida ? 'bg-blue-500/10 text-blue-500' : 'bg-red-500/10 text-red-500'
                        }`}
                      >
                        Maida {item.no_maida ? '✓' : '✗'}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 dark:text-zinc-700" />
                  </div>
                </div>
              );
            })}

            {filteredHistory.length > limit && (
              <button
                onClick={() => setLimit((prev) => prev + 30)}
                className="w-full py-4 text-xs font-bold text-purple-600 dark:text-purple-400 hover:bg-slate-50 dark:hover:bg-zinc-900/50 text-center border-t border-slate-100 dark:border-zinc-900/40 cursor-pointer"
              >
                Load Older Entries
              </button>
            )}
          </div>
        )}
      </section>

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm" onClick={() => setSelectedItem(null)}></div>
          
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 animate-pop border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Log Details — {new Date(selectedItem.date + 'T00:00:00').toLocaleDateString('en-US', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
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
                    selectedItem.gym === true
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}
                >
                  {selectedItem.gym === true ? '✓ Succeeded' : '✗ Failed'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/40">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">🚫 Avoided Maida</span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-xl ${
                    selectedItem.no_maida === true
                      ? 'bg-blue-500/10 text-blue-500'
                      : 'bg-red-500/10 text-red-500'
                  }`}
                >
                  {selectedItem.no_maida === true ? '✓ Succeeded' : '✗ Failed'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 justify-center mt-6 p-2">
              <Info size={14} />
              This entry falls outside the 7-day edit window and is read-only.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
