import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { getLocalDateString } from '@/lib/dates';

export async function GET(req: NextRequest) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date') || getLocalDateString();

  try {
    // Get all active habits definitions
    const habits = await prisma.habit.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Get logs for the user on this specific date
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
    });
  } catch (error) {
    console.error('Error getting habits today:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
