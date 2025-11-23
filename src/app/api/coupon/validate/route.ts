import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.user?.publicId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

  try {
    const coupon = await prisma.coupon.findUnique({ where: { code } });

    if (!coupon || coupon.deletedAt) {
      return NextResponse.json({ error: 'Invalid coupon' }, { status: 404 });
    }

    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
      return NextResponse.json({ error: 'Coupon not yet valid' }, { status: 400 });
    }
    if (coupon.expiryDate && now > coupon.expiryDate) {
      return NextResponse.json({ error: 'Coupon expired' }, { status: 400 });
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
    }
    if (!coupon.isActive) {
      return NextResponse.json({ error: 'Coupon is inactive' }, { status: 400 });
    }

    return NextResponse.json({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderValue: coupon.minOrderValue,
    });
  } catch  {
    return NextResponse.json({ error: 'Failed to validate' }, { status: 500 });
  }
}