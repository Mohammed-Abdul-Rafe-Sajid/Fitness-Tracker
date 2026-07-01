export interface Badge {
  key: string;
  name: string;
  description: string;
  icon: string;
}

export const BADGES: Badge[] = [
  {
    key: 'first_step',
    name: 'First Step',
    description: 'Log your first completed gym session.',
    icon: '🏋️'
  },
  {
    key: 'healthy_choice',
    name: 'Healthy Choice',
    description: 'Log your first Maida-free day.',
    icon: '🚫'
  },
  {
    key: 'seven_day_warrior',
    name: '7-Day Warrior',
    description: 'Reach a combined consistency streak of 7 days.',
    icon: '🛡️'
  },
  {
    key: 'perfect_week',
    name: 'Perfect Week',
    description: 'Complete both habits every day for 7 consecutive days.',
    icon: '⭐'
  },
  {
    key: 'thirty_day_machine',
    name: '30-Day Machine',
    description: 'Reach a combined consistency streak of 30 days.',
    icon: '🤖'
  },
  {
    key: 'hundred_day_legend',
    name: '100-Day Legend',
    description: 'Reach a combined consistency streak of 100 days.',
    icon: '👑'
  },
  {
    key: 'perfect_month',
    name: 'Perfect Month',
    description: 'Complete both habits every single day of a calendar month.',
    icon: '📅'
  },
  {
    key: 'consistency_king',
    name: 'Consistency King',
    description: 'Your maximum combined consistency streak reaches 100 days.',
    icon: '🦁'
  }
];

interface LogEntry {
  date: string;
  completed: boolean;
}

/**
 * Checks which badges are unlocked given the user's logs and max combined streak.
 * Returns an array of unlocked badge keys.
 */
export function checkAchievements(
  gymLogs: LogEntry[],
  maidaLogs: LogEntry[],
  maxCombinedStreak: number
): string[] {
  const unlockedBadges = new Set<string>();

  const gymMap = new Map<string, boolean>();
  for (const l of gymLogs) {
    if (l.completed) {
      gymMap.set(l.date, true);
    }
  }

  const maidaMap = new Map<string, boolean>();
  for (const l of maidaLogs) {
    if (l.completed) {
      maidaMap.set(l.date, true);
    }
  }

  // 1. First Step (first gym completion)
  if (gymMap.size > 0) {
    unlockedBadges.add('first_step');
  }

  // 2. Healthy Choice (first maida-free day)
  if (maidaMap.size > 0) {
    unlockedBadges.add('healthy_choice');
  }

  // 3. 7-Day Warrior & Perfect Week
  if (maxCombinedStreak >= 7) {
    unlockedBadges.add('seven_day_warrior');
    unlockedBadges.add('perfect_week');
  }

  // 4. 30-Day Machine
  if (maxCombinedStreak >= 30) {
    unlockedBadges.add('thirty_day_machine');
  }

  // 5. 100-Day Legend & Consistency King
  if (maxCombinedStreak >= 100) {
    unlockedBadges.add('hundred_day_legend');
    unlockedBadges.add('consistency_king');
  }

  // 6. Perfect Month (all calendar days of a month have both done)
  const perfectDaysByMonth = new Map<string, Set<string>>();
  for (const date of Array.from(gymMap.keys())) {
    if (maidaMap.has(date)) {
      const monthKey = date.substring(0, 7); // "YYYY-MM"
      if (!perfectDaysByMonth.has(monthKey)) {
        perfectDaysByMonth.set(monthKey, new Set());
      }
      perfectDaysByMonth.get(monthKey)!.add(date);
    }
  }

  for (const [monthKey, perfectDates] of Array.from(perfectDaysByMonth.entries())) {
    const [year, month] = monthKey.split('-').map(Number);
    // Number of days in that calendar month
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    if (perfectDates.size === totalDaysInMonth) {
      unlockedBadges.add('perfect_month');
      break; // One perfect month is enough
    }
  }

  return Array.from(unlockedBadges);
}
