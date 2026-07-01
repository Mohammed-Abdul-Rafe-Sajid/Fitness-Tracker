import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const logs = await prisma.dailyHabitLog.findMany({
      where: { userId: session.userId },
      include: {
        habit: true,
      },
      orderBy: { date: 'desc' },
    });

    // Group logs by date
    const groupedLogs: Record<string, { date: string; gym: boolean | null; no_maida: boolean | null }> = {};
    for (const log of logs) {
      if (!groupedLogs[log.date]) {
        groupedLogs[log.date] = { date: log.date, gym: null, no_maida: null };
      }
      if (log.habit.key === 'gym') {
        groupedLogs[log.date].gym = log.completed;
      } else if (log.habit.key === 'no_maida') {
        groupedLogs[log.date].no_maida = log.completed;
      }
    }

    const historyList = Object.values(groupedLogs).sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json(historyList);
  } catch (error) {
    console.error('Error fetching habits history:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
