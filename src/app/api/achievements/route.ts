import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { BADGES } from '@/lib/achievements';

export async function GET(req: NextRequest) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch user's achievements
    const earnedAchievements = await prisma.achievement.findMany({
      where: { userId: session.userId },
      orderBy: { earnedAt: 'desc' },
    });

    const earnedKeys = new Set(earnedAchievements.map((a) => a.badgeKey));

    const earned = earnedAchievements.map((ach) => {
      const badgeDetails = BADGES.find((b) => b.key === ach.badgeKey);
      return {
        badgeKey: ach.badgeKey,
        name: badgeDetails?.name || ach.badgeKey,
        description: badgeDetails?.description || '',
        icon: badgeDetails?.icon || '🏆',
        earnedAt: ach.earnedAt,
      };
    });

    const locked = BADGES.filter((b) => !earnedKeys.has(b.key)).map((b) => ({
      badgeKey: b.key,
      name: b.name,
      description: b.description,
      icon: b.icon,
    }));

    return NextResponse.json({
      earned,
      locked,
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
