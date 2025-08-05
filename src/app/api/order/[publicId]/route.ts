// src/app/api/order/[publicId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_: NextRequest, { params }: { params: { publicId: string } }) {
  const order = await prisma.order.findUnique({
    where: { publicId: params.publicId },
    include: {
      payment: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json(order);
}
