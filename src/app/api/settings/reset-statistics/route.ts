import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.$transaction([
      // Delete all logs for user
      prisma.dailyHabitLog.deleteMany({
        where: { userId: session.userId },
      }),
      // Delete all achievements for user
      prisma.achievement.deleteMany({
        where: { userId: session.userId },
      }),
      // Reset UserStats cache
      prisma.userStats.update({
        where: { userId: session.userId },
        data: {
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
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting statistics:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
