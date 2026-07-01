'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useSession } from '@/context/SessionContext';
import { useToast } from '@/context/ToastContext';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { Sun, Moon, Laptop, Bell, Key, Download, Upload, RotateCcw, AlertTriangle, LogOut, Info, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useSession();
  const { showToast } = useToast();

  const [reminderTime, setReminderTime] = useState<string | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // Change Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Modal confirmations states
  const [resetPointsOpen, setResetPointsOpen] = useState(false);
  const [resetStatsOpen, setResetStatsOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  // Delete account verification states
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isStatsResetChecked, setIsStatsResetChecked] = useState(false);

  // Fetch settings from server on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setReminderTime(data.reminderTime);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  // Update theme setting on backend as well (silent sync)
  const handleThemeChange = async (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    try {
      await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: newTheme }),
      });
    } catch (e) {
      // Ignore background errors
    }
  };

  // Update notification reminder time
  const handleReminderChange = async (time: string | null) => {
    setReminderTime(time);
    
    if (time) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          showToast('Notification permission denied. Enable in system settings.', 'error');
        } else {
          showToast('Notifications enabled for this time!', 'success');
        }
      }
    }

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderTime: time }),
      });
      if (res.ok) {
        showToast('Reminder schedule updated!', 'success');
      } else {
        showToast('Failed to update schedule', 'error');
      }
    } catch (e) {
      showToast('Network error updating reminder', 'error');
    }
  };

  // Change password submission
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/settings/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Password changed successfully!', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast(data.error || 'Password change failed.', 'error');
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  // Export data
  const handleExportData = () => {
    window.open('/api/data/export', '_blank');
    showToast('Exporting data...', 'info');
  };

  // Import data JSON file upload
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(reader.result as string);
        showToast('Importing data file...', 'info');

        const res = await fetch('/api/data/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(json),
        });

        if (res.ok) {
          showToast('Data imported successfully!', 'success');
          // Reload page to re-render calculations
          window.location.reload();
        } else {
          const errData = await res.json();
          showToast(errData.error || 'Import validation failed.', 'error');
        }
      } catch (err) {
        showToast('Invalid JSON file structure.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Reset Points
  const handleConfirmResetPoints = async () => {
    setResetPointsOpen(false);
    try {
      const res = await fetch('/api/settings/reset-points', { method: 'POST' });
      if (res.ok) {
        showToast('Lifetime points reset to 0!', 'success');
      } else {
        showToast('Reset failed', 'error');
      }
    } catch (e) {
      showToast('Network error resetting points', 'error');
    }
  };

  // Reset Statistics
  const handleConfirmResetStats = async () => {
    if (!isStatsResetChecked) {
      showToast('Confirm the checkbox to proceed.', 'error');
      return;
    }
    setResetStatsOpen(false);
    try {
      const res = await fetch('/api/settings/reset-statistics', { method: 'POST' });
      if (res.ok) {
        showToast('All logs and stats reset!', 'success');
        setIsStatsResetChecked(false);
      } else {
        showToast('Reset stats failed.', 'error');
      }
    } catch (e) {
      showToast('Network error resetting stats.', 'error');
    }
  };

  // Delete Account
  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      showToast('Type DELETE to confirm account deletion.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/settings/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword, confirmation: deleteConfirmationText }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeleteAccountOpen(false);
        showToast('Account deleted permanently.', 'success');
        logout();
      } else {
        showToast(data.error || 'Incorrect password.', 'error');
      }
    } catch (e) {
      showToast('Network error deleting account.', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up pb-12">
      {/* 1. Theme Configuration segment */}
      <section className="glass-panel p-5 rounded-3xl bg-white/75 dark:bg-zinc-900/70 shadow-sm flex flex-col gap-4">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Visual Theme
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'light', icon: Sun, label: 'Light' },
            { key: 'dark', icon: Moon, label: 'Dark' },
            { key: 'system', icon: Laptop, label: 'System' },
          ].map((mode) => {
            const active = theme === mode.key;
            const Icon = mode.icon;
            return (
              <button
                key={mode.key}
                onClick={() => handleThemeChange(mode.key as any)}
                className={`py-3 rounded-2xl border font-bold flex flex-col items-center gap-1.5 transition-all text-xs cursor-pointer ${
                  active
                    ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-500/10'
                    : 'bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Icon size={16} />
                {mode.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Notification Reminder segment */}
      <section className="glass-panel p-5 rounded-3xl bg-white/75 dark:bg-zinc-900/70 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-purple-600 dark:text-purple-400" />
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Daily Reminder
          </h3>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { value: null, label: 'Off' },
            { value: '19:00', label: '7 PM' },
            { value: '20:00', label: '8 PM' },
            { value: '21:00', label: '9 PM' },
          ].map((time) => {
            const active = reminderTime === time.value;
            return (
              <button
                key={time.label}
                onClick={() => handleReminderChange(time.value)}
                className={`py-2.5 rounded-xl border font-bold text-xs transition-all cursor-pointer ${
                  active
                    ? 'bg-purple-600 border-purple-600 text-white shadow-md'
                    : 'bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {time.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Change Password Form */}
      <section className="glass-panel p-5 rounded-3xl bg-white/75 dark:bg-zinc-900/70 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Key size={16} className="text-purple-600" />
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Change Password
          </h3>
        </div>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-3">
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
            placeholder="Current Password"
          />
          <input
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
            placeholder="New Password (min 6 chars)"
          />
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
            placeholder="Confirm New Password"
          />
          <button
            type="submit"
            disabled={changingPassword}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all disabled:opacity-50"
          >
            {changingPassword ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </section>

      {/* 4. Import/Export Data segments */}
      <section className="glass-panel p-5 rounded-3xl bg-white/75 dark:bg-zinc-900/70 shadow-sm flex flex-col gap-4">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Data Export & Import
        </h3>
        <div className="flex gap-3">
          <button
            onClick={handleExportData}
            className="flex-1 py-3 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <Download size={14} />
            Export Data
          </button>
          
          <label className="flex-1 py-3 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            <Upload size={14} />
            Import Data
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>
      </section>

      {/* 5. Destructive settings (Resets & Deletes) */}
      <section className="glass-panel p-5 rounded-3xl bg-white/75 dark:bg-zinc-900/70 shadow-sm flex flex-col gap-3">
        <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">
          Danger Zone
        </h3>

        <button
          onClick={() => setResetPointsOpen(true)}
          className="w-full py-3.5 px-4 bg-slate-50 dark:bg-zinc-800/30 border border-slate-100 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-left rounded-2xl flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer transition-all"
        >
          <RotateCcw size={15} className="text-slate-400" />
          Reset Points to 0
        </button>

        <button
          onClick={() => setResetStatsOpen(true)}
          className="w-full py-3.5 px-4 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-left rounded-2xl flex items-center gap-3 text-xs font-bold text-red-600 dark:text-red-400 cursor-pointer transition-all"
        >
          <AlertTriangle size={15} />
          Reset Statistics & Logs
        </button>

        <button
          onClick={() => setDeleteAccountOpen(true)}
          className="w-full py-3.5 px-4 bg-red-600 hover:bg-red-750 text-left rounded-2xl flex items-center gap-3 text-xs font-bold text-white shadow-lg shadow-red-500/5 cursor-pointer transition-all"
        >
          <ShieldAlert size={15} />
          Delete Account Permanently
        </button>
      </section>

      {/* Logout button */}
      <button
        onClick={logout}
        className="w-full py-4 glass-panel border border-slate-200 dark:border-zinc-800 text-center rounded-3xl text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-900 transition-all shadow-sm"
      >
        <LogOut size={16} />
        Log Out
      </button>

      {/* About Section */}
      <section className="glass-panel p-5 rounded-3xl bg-white/70 dark:bg-zinc-900/70 shadow-sm flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          <Info size={14} />
          About App
        </div>
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Consistency Habit Tracker
        </p>
        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 leading-relaxed">
          Version 1.0.0 (v1 Production Release)<br />
          Deterministic Motivational Quote Seed Engine (100 quotes local static library loaded)<br />
          Single-Session Multi-User Shared Device Cookie support.<br />
          © 2026 Consistency Habit Tracker. All rights reserved.
        </p>
      </section>

      {/* Modals & Dialogs */}
      
      {/* 1. Reset Points Confirm */}
      <ConfirmDialog
        isOpen={resetPointsOpen}
        title="Reset Points?"
        message="Are you sure you want to reset your lifetime points to 0? This action will not affect your daily habit logs or streaks."
        confirmText="Reset Points"
        confirmColor="purple"
        onConfirm={handleConfirmResetPoints}
        onCancel={() => setResetPointsOpen(false)}
      />

      {/* 2. Reset Statistics Confirm */}
      <ConfirmDialog
        isOpen={resetStatsOpen}
        title="Reset All Logs and Stats?"
        message="WARNING: This will permanently delete all of your completed habit logs and earned badge achievements. This action is irreversible."
        confirmText="Reset Statistics"
        confirmColor="red"
        onConfirm={handleConfirmResetStats}
        onCancel={() => setResetStatsOpen(false)}
      />
      {resetStatsOpen && (
        <div className="fixed inset-x-0 bottom-24 flex justify-center z-[60] px-4">
          <div className="glass-panel max-w-sm w-full p-4 rounded-2xl bg-red-500/5 border border-red-500/20 flex items-start gap-2.5 shadow-md">
            <input
              type="checkbox"
              id="confirm-reset-checkbox"
              checked={isStatsResetChecked}
              onChange={(e) => setIsStatsResetChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="confirm-reset-checkbox" className="text-[10px] font-bold text-red-600 dark:text-red-400 leading-relaxed cursor-pointer select-none">
              I understand that this action deletes all my history permanently and cannot be undone.
            </label>
          </div>
        </div>
      )}

      {/* 3. Delete Account Dialog */}
      {deleteAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/40 dark:bg-black/70 backdrop-blur-sm" onClick={() => setDeleteAccountOpen(false)}></div>
          
          <div className="glass-panel w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 animate-pop border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              Delete Account?
            </h3>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              WARNING: This will permanently delete your user profile, configurations, statistics, habit logs, and badges. There is no way to recover this data.
            </p>

            <div className="flex flex-col gap-3 mt-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Re-enter Password
                </label>
                <input
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="Enter account password"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Type "DELETE" to confirm
                </label>
                <input
                  type="text"
                  required
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-zinc-850 bg-slate-50 dark:bg-zinc-900 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500"
                  placeholder="Type DELETE"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteAccountOpen(false)}
                className="flex-1 py-3 border border-slate-200 dark:border-zinc-800 text-xs font-bold text-slate-600 dark:text-slate-400 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer transition-all shadow-red-500/10"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
