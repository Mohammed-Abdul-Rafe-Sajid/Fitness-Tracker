import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { getLocalDateString } from '@/lib/dates';
import { rebuildUserStats } from '@/lib/rebuildStats';

export async function POST(req: NextRequest) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();

    // 1. Validation
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid data format. Expected a JSON object.' }, { status: 400 });
    }

    const { logs, settings, achievements } = body;

    if (!Array.isArray(logs)) {
      return NextResponse.json({ error: 'Invalid data structure. "logs" array is required.' }, { status: 400 });
    }

    // Load active habits to resolve keys to IDs
    const dbHabits = await prisma.habit.findMany();
    const habitMap = new Map<string, string>();
    for (const h of dbHabits) {
      habitMap.set(h.key, h.id);
    }

    // Validate logs format
    const validatedLogs: Array<{ habitId: string; date: string; completed: boolean }> = [];
    for (const l of logs) {
      if (!l || typeof l !== 'object') {
        return NextResponse.json({ error: 'Log entry must be an object.' }, { status: 400 });
      }
      const { habitKey, date, completed } = l;
      if (!habitKey || !date || typeof completed !== 'boolean') {
        return NextResponse.json({ error: 'Log entry requires habitKey, date, and completed.' }, { status: 400 });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: `Invalid date format in log: ${date}. Expected YYYY-MM-DD.` }, { status: 400 });
      }
      const habitId = habitMap.get(habitKey);
      if (!habitId) {
        // Skip unknown habits in import
        continue;
      }
      validatedLogs.push({ habitId, date, completed });
    }

    // 2. Perform DB imports inside a transaction (all-or-nothing)
    await prisma.$transaction(async (tx) => {
      // Import logs
      for (const log of validatedLogs) {
        await tx.dailyHabitLog.upsert({
          where: {
            userId_habitId_date: {
              userId: session.userId,
              habitId: log.habitId,
              date: log.date,
            },
          },
          update: {
            completed: log.completed,
          },
          create: {
            userId: session.userId,
            habitId: log.habitId,
            date: log.date,
            completed: log.completed,
          },
        });
      }

      // Import settings
      if (settings && typeof settings === 'object') {
        const { theme, reminderTime } = settings;
        const themeValid = ['light', 'dark', 'system'].includes(theme) ? theme : 'system';
        const reminderValid = reminderTime && /^\d{2}:\d{2}$/.test(reminderTime) ? reminderTime : null;

        await tx.settings.upsert({
          where: { userId: session.userId },
          update: {
            theme: themeValid,
            reminderTime: reminderValid,
          },
          create: {
            userId: session.userId,
            theme: themeValid,
            reminderTime: reminderValid,
          },
        });
      }

      // Import achievements
      if (Array.isArray(achievements)) {
        for (const a of achievements) {
          if (a && typeof a === 'object' && a.badgeKey) {
            await tx.achievement.upsert({
              where: {
                userId_badgeKey: {
                  userId: session.userId,
                  badgeKey: a.badgeKey,
                },
              },
              update: {}, // Keep existing earnedAt
              create: {
                userId: session.userId,
                badgeKey: a.badgeKey,
                earnedAt: a.earnedAt ? new Date(a.earnedAt) : new Date(),
              },
            });
          }
        }
      }
    });

    // 3. Rebuild user stats
    const todayStr = getLocalDateString();
    await rebuildUserStats(session.userId, todayStr);

    return NextResponse.json({
      success: true,
      importedDays: validatedLogs.length,
    });
  } catch (error: any) {
    console.error('Error importing data:', error);
    return NextResponse.json({ error: 'Invalid JSON file structure or database error during import.' }, { status: 400 });
  }
}
