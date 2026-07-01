import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/session';
import { comparePassword } from '@/lib/auth';

export async function DELETE(req: NextRequest) {
  const session = getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { password, confirmation } = await req.json();

    if (!password || !confirmation) {
      return NextResponse.json({ error: 'Password and confirmation are required.' }, { status: 400 });
    }

    if (confirmation !== 'DELETE') {
      return NextResponse.json({ error: 'Confirmation text must match "DELETE" exactly.' }, { status: 400 });
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Password is incorrect.' }, { status: 401 });
    }

    // Perform cascade delete of the User row
    await prisma.user.delete({
      where: { id: session.userId },
    });

    const response = NextResponse.json({ success: true });

    // Clear session cookie
    response.cookies.set('session', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
