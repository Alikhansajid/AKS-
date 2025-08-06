import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function PUT(request: NextRequest, { params }: { params: { publicId: string } }) {
  try {
    const session = await getSession(request);
    if (!session.user || session.user.role !== 'ADMIN') {
      console.error('Unauthorized access attempt:', { session });
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

    if (status === 'CANCELLED' && (order.payment?.status === 'SUCCESS' || order.status === 'DELIVERED')) {
      return NextResponse.json(
        { error: 'Cannot cancel order with successful payment or delivered status' },
        { status: 400 }
      );
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

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating order:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}