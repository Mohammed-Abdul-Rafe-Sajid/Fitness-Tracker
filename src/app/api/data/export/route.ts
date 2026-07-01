import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { getLocalDateString } from '@/lib/dates';

export async function GET(req: NextRequest) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        settings: true,
        achievements: true,
        stats: true,
        logs: {
          include: {
            habit: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const exportData = {
      user: {
        username: user.username,
        createdAt: user.createdAt,
      },
      logs: user.logs.map((l) => ({
        habitKey: l.habit.key,
        date: l.date,
        completed: l.completed,
      })),
      settings: user.settings
        ? {
            theme: user.settings.theme,
            reminderTime: user.settings.reminderTime,
          }
        : {
            theme: 'system',
            reminderTime: null,
          },
      achievements: user.achievements.map((a) => ({
        badgeKey: a.badgeKey,
        earnedAt: a.earnedAt,
      })),
      stats: user.stats
        ? {
            lifetimePoints: user.stats.lifetimePoints,
          }
        : {
            lifetimePoints: 0,
          },
    };

    const todayStr = getLocalDateString();
    const filename = `habit-tracker-export-${user.username}-${todayStr}.json`;

    return new Response(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
