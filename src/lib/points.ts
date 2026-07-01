import { getDaysInRange } from './dates';

interface LogEntry {
  date: string;
  completed: boolean;
}

/**
 * Recalculates total lifetime points by playing back log history chronologically.
 * Includes base points (+10 per completed habit) and milestone combined streak bonuses (+20 for 7, +100 for 30, +500 for 100-multiples).
 */
export function calculateLifetimePoints(gymLogs: LogEntry[], maidaLogs: LogEntry[]): number {
  if (gymLogs.length === 0 && maidaLogs.length === 0) {
    return 0;
  }

  const gymMap = new Map<string, boolean>();
  for (const l of gymLogs) {
    gymMap.set(l.date, l.completed);
  }
  const maidaMap = new Map<string, boolean>();
  for (const l of maidaLogs) {
    maidaMap.set(l.date, l.completed);
  }

  // Find overall date range
  const allDates = [...Array.from(gymMap.keys()), ...Array.from(maidaMap.keys())].sort();
  if (allDates.length === 0) return 0;

  const firstDate = allDates[0];
  const lastDate = allDates[allDates.length - 1];

  const dateRange = getDaysInRange(firstDate, lastDate);

  let points = 0;
  let runningCombinedStreak = 0;

  for (const date of dateRange) {
    const gymDone = gymMap.get(date) || false;
    const maidaDone = maidaMap.get(date) || false;

    // Base points
    if (gymDone) points += 10;
    if (maidaDone) points += 10;

    // Combined streak check
    if (gymDone && maidaDone) {
      runningCombinedStreak++;
      
      // Milestone bonuses
      if (runningCombinedStreak === 7) {
        points += 20;
      } else if (runningCombinedStreak === 30) {
        points += 100;
      } else if (runningCombinedStreak === 100) {
        points += 500;
      } else if (runningCombinedStreak > 100 && runningCombinedStreak % 100 === 0) {
        points += 500;
      }
    } else {
      runningCombinedStreak = 0;
    }
  }

  return points;
}

/**
 * Returns the next combined streak milestone, previous milestone, and text description.
 */
export function getNextMilestone(currentCombinedStreak: number): {
  target: number;
  prev: number;
  bonus: number;
} {
  if (currentCombinedStreak < 7) {
    return { target: 7, prev: 0, bonus: 20 };
  } else if (currentCombinedStreak < 30) {
    return { target: 30, prev: 7, bonus: 100 };
  } else if (currentCombinedStreak < 100) {
    return { target: 100, prev: 30, bonus: 500 };
  } else {
    const currentMultiple = Math.floor(currentCombinedStreak / 100) * 100;
    return {
      target: currentMultiple + 100,
      prev: currentMultiple,
      bonus: 500
    };
  }
}
