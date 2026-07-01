import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { getLocalDateString } from '@/lib/dates';

function getHeatmapColor(gym: boolean | null, maida: boolean | null): 'gray' | 'green' | 'blue' | 'purple' | 'red' {
  if (gym === null && maida === null) return 'gray';
  if (gym === true && maida === true) return 'purple';
  if (gym === true && (maida === false || maida === null)) return 'green';
  if (maida === true && (gym === false || gym === null)) return 'blue';
  if (gym === false && maida === false) return 'red';
  return 'gray';
}

export async function GET(req: NextRequest) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const todayStr = getLocalDateString();
    
    // 1. Fetch UserStats cache
    let stats = await prisma.userStats.findUnique({
      where: { userId: session.userId },
    });

    if (!stats) {
      // Create empty stats cache if not exist
      stats = await prisma.userStats.create({
        data: {
          userId: session.userId,
          lifetimePoints: 0,
          gymCurrentStreak: 0,
          gymMaxStreak: 0,
          maidaCurrentStreak: 0,
          maidaMaxStreak: 0,
          combinedCurrentStreak: 0,
          combinedMaxStreak: 0,
          totalActiveDays: 0,
          perfectDays: 0,
        },
      });
    }

    // 2. Fetch active habits to map keys
    const habits = await prisma.habit.findMany({ select: { id: true, key: true } });
    const gymHabit = habits.find((h) => h.key === 'gym');
    const maidaHabit = habits.find((h) => h.key === 'no_maida');

    // 3. Compute completionPercentage
    const completionPercentage = stats.totalActiveDays > 0 
      ? Math.round((stats.perfectDays / stats.totalActiveDays) * 100)
      : 0;

    // 4. Compute weeklyProgress (Monday to Sunday of the current week)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 (Sun) to 6 (Sat)
    // Adjust so week starts on Monday
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDates.push(getLocalDateString(d));
    }

    // Fetch logs for the current week
    const weekLogs = await prisma.dailyHabitLog.findMany({
      where: {
        userId: session.userId,
        date: { in: weekDates },
      },
    });

    const weeklyProgress = weekDates.map((date) => {
      const dateLogs = weekLogs.filter((l) => l.date === date);
      const gymLog = dateLogs.find((l) => l.habitId === gymHabit?.id);
      const maidaLog = dateLogs.find((l) => l.habitId === maidaHabit?.id);

      const gymCompleted = gymLog ? gymLog.completed : null;
      const maidaCompleted = maidaLog ? maidaLog.completed : null;

      return {
        date,
        dayName: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][weekDates.indexOf(date)],
        gymCompleted,
        maidaCompleted,
        color: getHeatmapColor(gymCompleted, maidaCompleted),
      };
    });

    // 5. Compute monthlyProgress (perfectDays in current month vs calendar days elapsed so far)
    const [yearStr, monthStr, dayStr] = todayStr.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const elapsedDays = Number(dayStr);
    const totalDaysInMonth = new Date(year, month, 0).getDate();

    // Fetch all logs in the current month
    const monthPrefix = `${yearStr}-${monthStr}`;
    const monthLogs = await prisma.dailyHabitLog.findMany({
      where: {
        userId: session.userId,
        date: { startsWith: monthPrefix },
      },
    });

    // Count perfect days in current month
    const monthDates = Array.from(new Set(monthLogs.map((l) => l.date)));
    let monthlyPerfectDays = 0;
    for (const d of monthDates) {
      const dateLogs = monthLogs.filter((l) => l.date === d);
      const gymDone = dateLogs.find((l) => l.habitId === gymHabit?.id)?.completed || false;
      const maidaDone = dateLogs.find((l) => l.habitId === maidaHabit?.id)?.completed || false;
      if (gymDone && maidaDone) {
        monthlyPerfectDays++;
      }
    }

    const monthlyProgress = {
      completed: monthlyPerfectDays,
      totalDaysSoFar: elapsedDays,
      totalDaysInMonth,
      percentage: Math.round((monthlyPerfectDays / totalDaysInMonth) * 100),
    };

    return NextResponse.json({
      stats,
      completionPercentage,
      weeklyProgress,
      monthlyProgress,
    });
  } catch (error) {
    console.error('Error fetching stats summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
