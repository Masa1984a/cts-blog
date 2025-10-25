import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  registrationSecret: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, registrationSecret } = registerSchema.parse(body);

    // Verify registration secret
    const expectedSecret = process.env.REGISTRATION_SECRET;

    if (!expectedSecret) {
      return NextResponse.json(
        { error: 'Registration is not configured on this server' },
        { status: 500 }
      );
    }

    if (registrationSecret !== expectedSecret) {
      return NextResponse.json(
        { error: 'Invalid registration secret' },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
      },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Return token
    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });

    // Set cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
