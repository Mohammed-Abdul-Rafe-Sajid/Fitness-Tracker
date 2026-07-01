import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    // 1. Validation
    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }
    if (!password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      return NextResponse.json(
        { error: 'Username must be between 3 and 20 characters' },
        { status: 400 }
      );
    }

    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(trimmedUsername)) {
      return NextResponse.json(
        { error: 'Username must contain only alphanumeric characters and underscores' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const lowerUsername = trimmedUsername.toLowerCase();

    // 2. Check uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { username: lowerUsername },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // 3. Hash password and create user
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username: lowerUsername,
        passwordHash,
        settings: {
          create: {
            theme: 'system',
            reminderTime: null,
          },
        },
        stats: {
          create: {
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
        },
      },
    });

    // 4. Issue session JWT
    const token = signToken({ userId: user.id, username: user.username });

    const response = NextResponse.json(
      {
        user: { id: user.id, username: user.username },
      },
      { status: 201 }
    );

    // Set HTTP-only cookie, 90 days expiry
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 90, // 90 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during registration' },
      { status: 500 }
    );
  }
}
