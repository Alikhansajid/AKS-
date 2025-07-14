// app/api/auth/signup/route.ts
import { prisma } from '@/lib/prisma';
import { getSession} from '@/lib/session';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const { name, email, phone, password } = await req.json();

    // Validate input
    if (!name || !email || !phone || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with publicId
    const user = await prisma.user.create({
      data: {
        publicId: uuidv4(),
        name,
        email,
        phone,
        password: hashedPassword,
      },
    });

    // Create session with Iron Session
    const session = await getSession(req, NextResponse.next());
    session.user = {
      publicId: user.publicId,
      email: user.email,
      name: user.name,
    };
    await session.save();

    // Return success response
    return NextResponse.json(
      {
        message: 'Signup successful',
        user: {
          publicId: user.publicId,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Signup failed' }, { status: 500 });
  }
}