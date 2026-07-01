import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { getLocalDateString, getDaysInMonth } from '@/lib/dates';

export async function GET(req: NextRequest) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const monthParam = searchParams.get('month'); // Expecting YYYY-MM

  // 1. Validation
  if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
    return NextResponse.json({ error: 'Invalid month format. Expected YYYY-MM.' }, { status: 400 });
  }

  const todayStr = getLocalDateString();
  const currentMonthStr = todayStr.substring(0, 7);

  if (monthParam > currentMonthStr) {
    return NextResponse.json({ error: 'Cannot fetch heatmap for a future month.' }, { status: 400 });
  }

  try {
    const [yearStr, monthStr] = monthParam.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);

    const totalDays = getDaysInMonth(year, month);

    // Fetch habits
    const habits = await prisma.habit.findMany({ select: { id: true, key: true } });
    const gymHabit = habits.find((h) => h.key === 'gym');
    const maidaHabit = habits.find((h) => h.key === 'no_maida');

    // Fetch logs for the requested month
    const monthLogs = await prisma.dailyHabitLog.findMany({
      where: {
        userId: session.userId,
        date: { startsWith: monthParam },
      },
    });

    const days = [];
    for (let day = 1; day <= totalDays; day++) {
      const dayStr = String(day).padStart(2, '0');
      const date = `${monthParam}-${dayStr}`;

      const dateLogs = monthLogs.filter((l) => l.date === date);
      const gymLog = dateLogs.find((l) => l.habitId === gymHabit?.id);
      const maidaLog = dateLogs.find((l) => l.habitId === maidaHabit?.id);

      days.push({
        date,
        gymCompleted: gymLog ? gymLog.completed : null,
        maidaCompleted: maidaLog ? maidaLog.completed : null,
      });
    }

    return NextResponse.json({
      month: monthParam,
      days,
    });
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
