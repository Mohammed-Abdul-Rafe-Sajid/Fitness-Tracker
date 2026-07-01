'use client';

import React, { useState } from 'react';
import { useSession } from '@/context/SessionContext';
import { LogOut, Settings, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function TopBar() {
  const { user, logout } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (!user) return null;

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user.username.charAt(0).toUpperCase() + user.username.slice(1);

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <header className="relative flex justify-between items-center px-4 py-5 max-w-md mx-auto z-30">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
          {getGreeting()}, <span className="text-purple-600 dark:text-purple-400">{displayName}</span>
        </h1>
        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-0.5">{dateStr}</p>
      </div>

      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-1.5 p-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-zinc-900/50 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <ChevronDown size={14} className="text-slate-400 mr-1" />
        </button>

        {dropdownOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)}></div>
            <div className="absolute right-0 mt-2 w-48 rounded-2xl glass-panel shadow-2xl z-50 p-1.5 animate-pop">
              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all"
              >
                <Settings size={16} />
                Settings
              </Link>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-all w-full text-left cursor-pointer"
              >
                <LogOut size={16} />
                Switch Account
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
