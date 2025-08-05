import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PUT(request: NextRequest, { params }: { params: { publicId: string } }) {
  try {
    const session = await getSession(request);
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, phone, role } = await request.json();
    const { publicId } = params;

    if (!name || !email || !phone || !['ADMIN', 'CUSTOMER', 'RIDER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid input data. All fields are required and role must be ADMIN, CUSTOMER, or RIDER.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { publicId, deletedAt: null } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check for email uniqueness
    if (email !== user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { publicId },
      data: { name, email, phone, role },
      select: {
        id: true,
        publicId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: unknown) {
    console.error('Error updating user:', error);
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { publicId: string } }) {
  try {
    const session = await getSession(request);
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { publicId } = params;

    const user = await prisma.user.findUnique({ where: { publicId, deletedAt: null } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.user.update({
      where: { publicId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error deleting user:', error);
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}