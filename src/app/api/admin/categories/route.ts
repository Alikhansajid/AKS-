import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await prisma.category.findMany({
      where: { deletedAt: null },
      include: { children: true, parent: true },
    });

    return NextResponse.json(categories);
  } catch (error: unknown) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, parentId } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        parentId: parentId ? parseInt(parentId as string) : null,
        updatedById: session.user.publicId ? parseInt(session.user.publicId as string) : null, // Use user.id if available
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

