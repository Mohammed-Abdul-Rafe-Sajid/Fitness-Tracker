import { getPreviousDate, getNextDate } from './dates';

interface LogEntry {
  date: string;
  completed: boolean;
}

/**
 * Calculates current streak for a single habit.
 * Gaps in the past or explicit failures break the streak.
 * If today has not been logged yet, check starting from yesterday.
 */
export function calculateCurrentStreak(logs: LogEntry[], todayStr: string): number {
  const logMap = new Map<string, boolean>();
  for (const l of logs) {
    logMap.set(l.date, l.completed);
  }

  let streak = 0;
  let cursor = todayStr;

  // If today has no log yet, start checking from yesterday
  if (!logMap.has(cursor)) {
    cursor = getPreviousDate(cursor);
  }

  while (true) {
    if (logMap.has(cursor)) {
      const completed = logMap.get(cursor);
      if (completed) {
        streak++;
        cursor = getPreviousDate(cursor);
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculates current combined streak (both habits completed).
 * Breaks if either habit fails or is unlogged on a given past day.
 */
export function calculateCurrentCombinedStreak(
  gymLogs: LogEntry[],
  maidaLogs: LogEntry[],
  todayStr: string
): number {
  const gymMap = new Map<string, boolean>();
  for (const l of gymLogs) {
    gymMap.set(l.date, l.completed);
  }
  const maidaMap = new Map<string, boolean>();
  for (const l of maidaLogs) {
    maidaMap.set(l.date, l.completed);
  }

  let streak = 0;
  let cursor = todayStr;

  // If today is completely unlogged for both, start from yesterday
  if (!gymMap.has(cursor) && !maidaMap.has(cursor)) {
    cursor = getPreviousDate(cursor);
  }

  while (true) {
    const gymLogExists = gymMap.has(cursor);
    const maidaLogExists = maidaMap.has(cursor);

    if (gymLogExists && maidaLogExists) {
      const gymCompleted = gymMap.get(cursor);
      const maidaCompleted = maidaMap.get(cursor);

      if (gymCompleted && maidaCompleted) {
        streak++;
        cursor = getPreviousDate(cursor);
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Calculates the maximum streak by replaying all logs ordered by date ASC.
 */
export function calculateMaxStreak(logs: LogEntry[]): number {
  // Sort logs by date ASC
  const sortedLogs = [...logs].sort((a, b) => a.date.localeCompare(b.date));

  let maxStreak = 0;
  let runningStreak = 0;
  let previousDate: string | null = null;

  for (const log of sortedLogs) {
    const isConsecutiveDay = previousDate !== null && log.date === getNextDate(previousDate);
    if (log.completed) {
      if (isConsecutiveDay) {
        runningStreak += 1;
      } else {
        runningStreak = 1;
      }
      maxStreak = Math.max(maxStreak, runningStreak);
    } else {
      runningStreak = 0;
    }
    previousDate = log.date;
  }

  return maxStreak;
}

/**
 * Calculates max combined streak by merging logs.
 */
export function calculateMaxCombinedStreak(gymLogs: LogEntry[], maidaLogs: LogEntry[]): number {
  const gymMap = new Map<string, boolean>();
  for (const l of gymLogs) {
    gymMap.set(l.date, l.completed);
  }
  const maidaMap = new Map<string, boolean>();
  for (const l of maidaLogs) {
    maidaMap.set(l.date, l.completed);
  }

  // Find all unique dates logged
  const allDates = Array.from(new Set([...Array.from(gymMap.keys()), ...Array.from(maidaMap.keys())]));
  
  const combinedLogs: LogEntry[] = allDates.map(date => {
    const gymCompleted = gymMap.get(date) || false;
    const maidaCompleted = maidaMap.get(date) || false;
    return {
      date,
      completed: gymCompleted && maidaCompleted
    };
  });

  return calculateMaxStreak(combinedLogs);
}
