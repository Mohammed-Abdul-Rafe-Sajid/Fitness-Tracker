import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await prisma.settings.findUnique({
      where: { userId: session.userId },
    });

    return NextResponse.json(settings || { theme: 'system', reminderTime: null });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { theme, reminderTime } = await req.json();

    const updateData: any = {};
    if (theme !== undefined) {
      if (!['light', 'dark', 'system'].includes(theme)) {
        return NextResponse.json({ error: 'Invalid theme value. Expected light, dark, or system.' }, { status: 400 });
      }
      updateData.theme = theme;
    }

    if (reminderTime !== undefined) {
      if (reminderTime !== null && !/^\d{2}:\d{2}$/.test(reminderTime)) {
        return NextResponse.json({ error: 'Invalid reminder time format. Expected HH:MM or null.' }, { status: 400 });
      }
      updateData.reminderTime = reminderTime;
    }

    const updatedSettings = await prisma.settings.upsert({
      where: { userId: session.userId },
      update: updateData,
      create: {
        userId: session.userId,
        theme: theme || 'system',
        reminderTime: reminderTime || null,
      },
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
