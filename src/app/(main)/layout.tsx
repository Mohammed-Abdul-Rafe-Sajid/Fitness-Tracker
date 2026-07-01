'use client';

import React, { useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/shared/TopBar';
import BottomNav from '@/components/shared/BottomNav';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 pb-24">
      <TopBar />
      <main className="flex-1 w-full max-w-md mx-auto px-4 pb-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
