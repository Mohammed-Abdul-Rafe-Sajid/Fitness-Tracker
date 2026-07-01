import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { getLocalDateString, isWithinLast7Days } from '@/lib/dates';
import { rebuildUserStats } from '@/lib/rebuildStats';

export async function POST(req: NextRequest) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { date, entries } = await req.json();

    const todayStr = getLocalDateString();
    const logDate = date || todayStr;

    // 1. Validation
    if (!logDate || !/^\d{4}-\d{2}-\d{2}$/.test(logDate)) {
      return NextResponse.json({ error: 'Invalid date format. Expected YYYY-MM-DD.' }, { status: 400 });
    }

    if (!isWithinLast7Days(logDate, todayStr)) {
      return NextResponse.json(
        { error: 'Cannot log or edit entries older than 7 days.' },
        { status: 403 }
      );
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: 'Entries must be a non-empty array.' }, { status: 400 });
    }

    // Verify all habits in the request are active
    const activeHabits = await prisma.habit.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    const activeHabitIds = new Set(activeHabits.map((h) => h.id));

    for (const entry of entries) {
      if (!activeHabitIds.has(entry.habitId)) {
        return NextResponse.json({ error: `Habit ID ${entry.habitId} is invalid or inactive.` }, { status: 400 });
      }
      if (typeof entry.completed !== 'boolean') {
        return NextResponse.json({ error: 'Completed status must be a boolean.' }, { status: 400 });
      }
    }

    // 2. Perform DB upserts
    await prisma.$transaction(
      entries.map((entry) =>
        prisma.dailyHabitLog.upsert({
          where: {
            userId_habitId_date: {
              userId: session.userId,
              habitId: entry.habitId,
              date: logDate,
            },
          },
          update: {
            completed: entry.completed,
          },
          create: {
            userId: session.userId,
            habitId: entry.habitId,
            date: logDate,
            completed: entry.completed,
          },
        })
      )
    );

    // 3. Trigger recalculation and rebuild stats
    const rebuildResult = await rebuildUserStats(session.userId, todayStr);

    return NextResponse.json({
      success: true,
      stats: rebuildResult.stats,
      newAchievements: rebuildResult.newAchievements,
    });
  } catch (error: any) {
    console.error('Error logging habits:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
