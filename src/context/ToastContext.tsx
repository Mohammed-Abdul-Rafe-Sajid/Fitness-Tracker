'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'badge';
  badgeKey?: string;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'badge', badgeKey?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' | 'badge', badgeKey?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, badgeKey }]);

    if (type === 'badge') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`glass-panel p-4 rounded-2xl shadow-xl flex items-center gap-3 cursor-pointer animate-pop transition-all hover:scale-[1.02] ${
              toast.type === 'error'
                ? 'border-red-500/30 text-red-600 dark:text-red-400 bg-red-50/90 dark:bg-red-950/20'
                : toast.type === 'badge'
                ? 'border-purple-500/30 text-purple-700 dark:text-purple-300 bg-purple-50/90 dark:bg-purple-950/30 shadow-purple-500/10'
                : 'text-slate-800 dark:text-slate-200'
            }`}
          >
            {toast.type === 'success' && <span className="text-xl text-green-500">✓</span>}
            {toast.type === 'error' && <span className="text-xl text-red-500">⚠️</span>}
            {toast.type === 'info' && <span className="text-xl text-blue-500">ℹ️</span>}
            {toast.type === 'badge' && <span className="text-xl">🎉</span>}
            <div className="flex-1">
              {toast.type === 'badge' && (
                <p className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Badge Unlocked!
                </p>
              )}
              <p className="text-sm font-medium">{toast.message}</p>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
