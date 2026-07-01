import { prisma } from './db';
import { calculateCurrentStreak, calculateMaxStreak, calculateCurrentCombinedStreak, calculateMaxCombinedStreak } from './streaks';
import { calculateLifetimePoints } from './points';
import { checkAchievements } from './achievements';

/**
 * Re-evaluates all logs for a user, updates their streak cache, lifetime points,
 * perfect/active days count, checks and unlocks any new achievements, and updates UserStats.
 * Returns the updated stats object and an array of newly unlocked badge keys.
 */
export async function rebuildUserStats(userId: string, todayStr: string) {
  // 1. Fetch habit definitions to map keys to database IDs
  const habits = await prisma.habit.findMany();
  const gymHabit = habits.find((h) => h.key === 'gym');
  const maidaHabit = habits.find((h) => h.key === 'no_maida');

  if (!gymHabit || !maidaHabit) {
    throw new Error('Database habits not seeded correctly.');
  }

  // 2. Fetch all logs for the user
  const logs = await prisma.dailyHabitLog.findMany({
    where: { userId },
  });

  const gymLogs = logs
    .filter((l) => l.habitId === gymHabit.id)
    .map((l) => ({ date: l.date, completed: l.completed }));

  const maidaLogs = logs
    .filter((l) => l.habitId === maidaHabit.id)
    .map((l) => ({ date: l.date, completed: l.completed }));

  // 3. Calculate streaks
  const gymCurrent = calculateCurrentStreak(gymLogs, todayStr);
  const gymMax = calculateMaxStreak(gymLogs);

  const maidaCurrent = calculateCurrentStreak(maidaLogs, todayStr);
  const maidaMax = calculateMaxStreak(maidaLogs);

  const combinedCurrent = calculateCurrentCombinedStreak(gymLogs, maidaLogs, todayStr);
  const combinedMax = calculateMaxCombinedStreak(gymLogs, maidaLogs);

  // 4. Calculate points
  const lifetimePoints = calculateLifetimePoints(gymLogs, maidaLogs);

  // 5. Calculate statistics (active days, perfect days)
  const activeDaysSet = new Set(logs.map((l) => l.date));
  const totalActiveDays = activeDaysSet.size;

  const gymCompletedSet = new Set(gymLogs.filter((l) => l.completed).map((l) => l.date));
  const maidaCompletedSet = new Set(maidaLogs.filter((l) => l.completed).map((l) => l.date));
  
  let perfectDays = 0;
  for (const date of Array.from(gymCompletedSet)) {
    if (maidaCompletedSet.has(date)) {
      perfectDays++;
    }
  }

  // 6. Check achievements
  const unlockedBadgeKeys = checkAchievements(gymLogs, maidaLogs, combinedMax);

  // Fetch already earned achievements
  const existingAchievements = await prisma.achievement.findMany({
    where: { userId },
  });
  const existingKeys = new Set(existingAchievements.map((a) => a.badgeKey));

  // Determine newly unlocked badges
  const newBadgeKeys = unlockedBadgeKeys.filter((k) => !existingKeys.has(k));

  // Save new achievements if any
  if (newBadgeKeys.length > 0) {
    await prisma.achievement.createMany({
      data: newBadgeKeys.map((k) => ({
        userId,
        badgeKey: k,
      })),
    });
  }

  // 7. Update UserStats cache
  const updatedStats = await prisma.userStats.upsert({
    where: { userId },
    update: {
      lifetimePoints,
      gymCurrentStreak: gymCurrent,
      gymMaxStreak: gymMax,
      maidaCurrentStreak: maidaCurrent,
      maidaMaxStreak: maidaMax,
      combinedCurrentStreak: combinedCurrent,
      combinedMaxStreak: combinedMax,
      totalActiveDays,
      perfectDays,
    },
    create: {
      userId,
      lifetimePoints,
      gymCurrentStreak: gymCurrent,
      gymMaxStreak: gymMax,
      maidaCurrentStreak: maidaCurrent,
      maidaMaxStreak: maidaMax,
      combinedCurrentStreak: combinedCurrent,
      combinedMaxStreak: combinedMax,
      totalActiveDays,
      perfectDays,
    },
  });

  return {
    stats: updatedStats,
    newAchievements: newBadgeKeys,
  };
}
