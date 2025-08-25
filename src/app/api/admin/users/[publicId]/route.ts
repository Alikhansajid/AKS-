
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PUT(
  request: NextRequest,
  { params }: { params: { publicId: string } }
) {
  try {
    const session = await getSession(request);
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const { name, email, role, phone } = await request.json();
    const { publicId } = params;

    // Validate
    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Please fill in all required fields' }, { status: 400 });
    }
    if (!['ADMIN', 'CUSTOMER', 'RIDER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role selected' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { publicId, deletedAt: null },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check email uniqueness
    if (email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { publicId },
      data: { name, email, role, phone },
      select: {
        id: true,
        publicId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        profilePic: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { publicId: string } }
) {
  try {
    const session = await getSession(request);
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    const { publicId } = params;

    const user = await prisma.user.findUnique({
      where: { publicId, deletedAt: null },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.user.update({
      where: { publicId },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
