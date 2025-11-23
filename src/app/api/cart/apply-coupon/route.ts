import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';


interface Coupon {
  id: number;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderValue?: number;
  maxUses?: number;
  usedCount: number;
  startDate?: Date;
  expiryDate?: Date;
  isActive: boolean;
  deletedAt?: Date;
}

interface Cart {
  id: number;
  userId: number;
  couponId?: number;
}

export async function POST(req: NextRequest): Promise<NextResponse> {


  const body = await req.json();
  const { code } = body as { code: string };

  try {
    const coupon = await prisma.coupon.findUnique({
      where: { code },
    }) as Coupon | null;
    if (!coupon || !coupon.isActive || coupon.deletedAt) {
      return NextResponse.json({ error: 'Invalid coupon' }, { status: 404 });
    }

    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
      throw new Error('Coupon not yet valid');
    }
    if (coupon.expiryDate && now > coupon.expiryDate) {
      throw new Error('Coupon expired');
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      throw new Error('Usage limit reached');
    }

    // Find the cart for the admin user (assuming userId is set in session)
    const cart = await prisma.cart.findFirst({
    }) as Cart | null;
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    // Associate coupon with cart
    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: coupon.id },
    });

    // Optionally increment usedCount here, or defer to checkout
    // await prisma.coupon.update({
    //   where: { id: coupon.id },
    //   data: { usedCount: { increment: 1 } },
    // });

    return NextResponse.json({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to apply';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}