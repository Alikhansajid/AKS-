//api/cart/[publicId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { publicId: string } }
) {
  const session = await getSession(req);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cartItemId = parseInt(params.publicId);

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
