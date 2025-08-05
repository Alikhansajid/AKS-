// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  const user = session.user;

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let paymentMethod;
  try {
    const body = await req.json();
    paymentMethod = body?.paymentMethod;
    if (!['COD', 'card'].includes(paymentMethod)) {
      throw new Error('Invalid payment method');
    }
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request body',err }, { status: 400 });
  }

  const activeCart = await prisma.cart.findFirst({
    where: { user: { publicId: user.publicId } },
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } } },
  });

  if (!activeCart || activeCart.items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      user: { connect: { publicId: user.publicId } },
      items: {
        create: activeCart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
        })),
      },
      payment: {
        create: {
          method: paymentMethod,
          status: paymentMethod === 'COD' ? 'success' : 'pending',
        },
      },
    },
    include: {
      payment: true,
      items: { include: { product: true } },
    },
  });

  await prisma.cartItem.deleteMany({ where: { cartId: activeCart.id } });
  await prisma.cart.delete({ where: { id: activeCart.id } });

  if (paymentMethod === 'card') {
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: activeCart.items.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: { name: item.product.name },
          unit_amount: Math.round(item.product.price * 100),
        },
        quantity: item.quantity,
      })),
      metadata: {
        orderId: order.id.toString(),
        userPublicId: user.publicId,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout/success?order=${order.publicId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout`,
    });

    return NextResponse.json({ paymentUrl: stripeSession.url });
  }

  return NextResponse.json({ success: true, orderId: order.publicId });
}
