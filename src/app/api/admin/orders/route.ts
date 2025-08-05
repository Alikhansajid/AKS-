import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { deletedAt: null },
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: {
            product: { select: { name: true, price: true } },
          },
        },
        payment: true,
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}