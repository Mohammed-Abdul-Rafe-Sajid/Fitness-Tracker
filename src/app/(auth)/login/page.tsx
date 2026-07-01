'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/context/SessionContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const { user, loading, login } = useSession();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const res = await login(username, password);
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Invalid username or password');
    }
  };

  if (loading || user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-purple-600 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center min-h-screen bg-slate-50 dark:bg-zinc-950 p-4">
      <div className="w-full max-w-sm mx-auto glass-panel p-8 rounded-3xl shadow-2xl border border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 animate-pop">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg mx-auto mb-3">
            C
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Welcome Back</h2>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
            Log in as someone else or track your consistency
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">
              Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full py-3.5 px-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5 ml-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-3.5 px-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              placeholder="Enter your password"
            />
          </div>

          {error && (
            <div className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/10 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer mt-2"
          >
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="text-purple-600 dark:text-purple-400 font-bold hover:underline"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
