import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { getLocalDateString, isWithinLast7Days } from '@/lib/dates';

interface RouteParams {
  params: {
    date: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { date } = params;

  // Validate date format YYYY-MM-DD
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format. Expected YYYY-MM-DD.' }, { status: 400 });
  }

  try {
    const todayStr = getLocalDateString();
    const editable = isWithinLast7Days(date, todayStr);

    // Fetch active habits
    const habits = await prisma.habit.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Fetch logs for this date and user
    const logs = await prisma.dailyHabitLog.findMany({
      where: {
        userId: session.userId,
        date: date,
      },
    });

    const logMap = new Map<string, boolean>();
    for (const log of logs) {
      logMap.set(log.habitId, log.completed);
    }

    const habitsWithStatus = habits.map((h) => ({
      habitId: h.id,
      key: h.key,
      name: h.name,
      question: h.question,
      emoji: h.emoji,
      colorHex: h.colorHex,
      completed: logMap.has(h.id) ? logMap.get(h.id) : null,
    }));

    return NextResponse.json({
      date,
      habits: habitsWithStatus,
      editable,
    });
  } catch (error) {
    console.error(`Error fetching habits for date ${date}:`, error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
