// app/api/admin/users/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 401 });
    }

    // Allow all authenticated users to fetch users, but admins can see more details
    const isAdmin = session.user.role === 'ADMIN';

    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        publicId: true,
        name: true,
        email: isAdmin, // Only include email for admins
        phone: isAdmin, // Only include phone for admins
        role: true,
        profilePic: true, // Include profilePic for chat UI
        createdAt: isAdmin, // Only include for admins
        updatedAt: isAdmin, // Only include for admins
        deletedAt: isAdmin, // Only include for admins
      },
    });

    // Return in the shape the frontend expects
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}