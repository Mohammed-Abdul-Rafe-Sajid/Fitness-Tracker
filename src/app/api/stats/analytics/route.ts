import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { getLocalDateString, getPreviousDate, getDaysInMonth, getNextDate } from '@/lib/dates';

export async function GET(req: NextRequest) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Fetch user's creation date
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const todayStr = getLocalDateString();
    const todayDate = new Date(todayStr + 'T00:00:00');
    const registrationDate = new Date(user.createdAt);
    // Remove hours for difference calculation
    registrationDate.setHours(0, 0, 0, 0);

    // Days since registration (minimum of 1 day to prevent division by zero)
    const trackedDays = Math.max(
      1,
      Math.ceil((todayDate.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );

    // Fetch habits
    const habits = await prisma.habit.findMany({ select: { id: true, key: true } });
    const gymHabit = habits.find((h) => h.key === 'gym');
    const maidaHabit = habits.find((h) => h.key === 'no_maida');

    // Fetch all logs
    const logs = await prisma.dailyHabitLog.findMany({
      where: { userId: session.userId },
    });

    const gymLogs = logs.filter((l) => l.habitId === gymHabit?.id);
    const maidaLogs = logs.filter((l) => l.habitId === maidaHabit?.id);

    const gymCompletedSet = new Set(gymLogs.filter((l) => l.completed).map((l) => l.date));
    const maidaCompletedSet = new Set(maidaLogs.filter((l) => l.completed).map((l) => l.date));

    // Totals
    const totalGymDays = gymCompletedSet.size;
    const totalMaidaDays = maidaCompletedSet.size;

    // Count perfect days (both true) and missed days (both logged as false)
    let perfectDays = 0;
    let missedDays = 0;

    const allLoggedDates = Array.from(new Set(logs.map((l) => l.date)));
    for (const date of allLoggedDates) {
      const dateLogs = logs.filter((l) => l.date === date);
      const gymDone = dateLogs.find((l) => l.habitId === gymHabit?.id)?.completed || false;
      const maidaDone = dateLogs.find((l) => l.habitId === maidaHabit?.id)?.completed || false;

      if (gymDone && maidaDone) {
        perfectDays++;
      } else if (!gymDone && !maidaDone && dateLogs.length === habits.length) {
        // Only count as "missed" if both were attempted and unchecked
        missedDays++;
      }
    }

    const gymCompletionPercent = Math.round((totalGymDays / trackedDays) * 100);
    const maidaCompletionPercent = Math.round((totalMaidaDays / trackedDays) * 100);

    // 2. Weekly Completion: last 8 weeks (Mon-Sun)
    // Find the Monday of the current week
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() + diffToMonday);

    const weeklyCompletion = [];
    for (let w = 7; w >= 0; w--) {
      const weekMonday = new Date(currentMonday);
      weekMonday.setDate(currentMonday.getDate() - w * 7);
      const weekStart = getLocalDateString(weekMonday);

      let weekPerfect = 0;
      for (let d = 0; d < 7; d++) {
        const checkDateVal = new Date(weekMonday);
        checkDateVal.setDate(weekMonday.getDate() + d);
        const checkDate = getLocalDateString(checkDateVal);

        if (gymCompletedSet.has(checkDate) && maidaCompletedSet.has(checkDate)) {
          weekPerfect++;
        }
      }

      weeklyCompletion.push({
        weekStart,
        percent: Math.round((weekPerfect / 7) * 100),
      });
    }

    // 3. Monthly Completion: last 6 months
    const monthlyCompletion = [];
    const tempDate = new Date(today.getFullYear(), today.getMonth(), 1);
    
    for (let m = 5; m >= 0; m--) {
      const checkMonthDate = new Date(tempDate.getFullYear(), tempDate.getMonth() - m, 1);
      const year = checkMonthDate.getFullYear();
      const month = checkMonthDate.getMonth() + 1; // 1-indexed
      const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
      const totalDays = getDaysInMonth(year, month);

      let monthPerfect = 0;
      for (let day = 1; day <= totalDays; day++) {
        const date = `${monthPrefix}-${String(day).padStart(2, '0')}`;
        if (gymCompletedSet.has(date) && maidaCompletedSet.has(date)) {
          monthPerfect++;
        }
      }

      monthlyCompletion.push({
        month: monthPrefix,
        monthName: checkMonthDate.toLocaleString('default', { month: 'short' }),
        percent: Math.round((monthPerfect / totalDays) * 100),
      });
    }

    return NextResponse.json({
      weeklyCompletion,
      monthlyCompletion,
      gymCompletionPercent,
      maidaCompletionPercent,
      totalGymDays,
      totalMaidaDays,
      perfectDays,
      missedDays,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
