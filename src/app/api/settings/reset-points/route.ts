import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.userStats.update({
      where: { userId: session.userId },
      data: { lifetimePoints: 0 },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error resetting points:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
