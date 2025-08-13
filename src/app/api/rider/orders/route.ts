import { getIronSession } from 'iron-session';
import { NextRequest, NextResponse } from 'next/server';
import { sessionOptions } from '@/lib/session';
import { prisma } from '@/lib/prisma';

interface IronSessionData {
  user?: {
    publicId: string;
    email: string;
    name: string;
    phone?: string;
    profilePic?: string;
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await getIronSession<IronSessionData>(req, NextResponse.next(), sessionOptions);
    if (!session.user?.publicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { publicId: session.user.publicId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'RIDER') {
      return NextResponse.json({ error: 'User is not a rider' }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
      where: { riderId: user.id, deletedAt: null },
      include: {
        user: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Rider orders fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getIronSession<IronSessionData>(req, NextResponse.next(), sessionOptions);
    if (!session.user?.publicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { publicId: session.user.publicId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'RIDER') {
      return NextResponse.json({ error: 'User is not a rider' }, { status: 403 });
    }

    const { orderId, status } = await req.json();

    if (!orderId || !['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid order ID or status' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { riderId: true },
    });

    if (!order || order.riderId !== user.id) {
      return NextResponse.json({ error: 'Order not assigned to this rider' }, { status: 403 });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });

    return NextResponse.json({ message: 'Order status updated successfully' });
  } catch (error) {
    console.error('Order status update error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}