import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  const user = session.user;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { user: { publicId: user.publicId } },
    include: {
      items: {
        include: {
          product: true,
        },
      },
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(orders);
}
