'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, History, Trophy, Settings } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Heatmap', href: '/heatmap', icon: Calendar },
    { label: 'History', href: '/history', icon: History },
    { label: 'Badges', href: '/achievements', icon: Trophy },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-nav h-20 flex justify-around items-center px-4 max-w-md mx-auto md:rounded-t-3xl md:shadow-2xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        // Exact match for home, startsWith for others
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname === item.href || pathname.startsWith(item.href + '/');

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-2xl transition-all ${
              isActive
                ? 'text-purple-600 dark:text-purple-400 bg-purple-500/10 scale-105'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Icon size={20} className={isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'} />
            <span className="text-[10px] font-semibold tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
