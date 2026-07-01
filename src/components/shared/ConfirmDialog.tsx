'use client';

import React from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'purple' | 'red';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'purple',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const btnColor =
    confirmColor === 'red'
      ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/10'
      : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/10';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/40 dark:bg-black/70 backdrop-blur-sm" onClick={onCancel}></div>
      
      {/* Modal */}
      <div className="glass-panel w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 animate-pop border border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          {message}
        </p>

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 dark:border-zinc-800 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 rounded-2xl text-sm font-semibold transition-all shadow-lg cursor-pointer ${btnColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
