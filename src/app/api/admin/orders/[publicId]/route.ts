import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PUT(request: NextRequest, { params }: { params: { publicId: string } }) {
  try {
    const session = await getSession(request);
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json();
    const { publicId } = params;

    if (!status || !['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { publicId, deletedAt: null },
      include: { payment: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (status === 'CANCELLED' && order.payment?.status === 'completed') {
      return NextResponse.json({ error: 'Cannot cancel order with completed payment' }, { status: 400 });
    }

    if (order.status === 'DELIVERED') {
      return NextResponse.json({ error: 'Cannot change status of delivered order' }, { status: 400 });
    }

    const updatedOrder = await prisma.order.update({
      where: { publicId },
      data: { status },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: { select: { name: true, price: true } } } },
        payment: true,
      },
    });

    return NextResponse.json(updatedOrder);
  } catch (error: unknown) {
    console.error('Error updating order:', error);
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}