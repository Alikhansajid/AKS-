import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  // Validate session
  const session = await getSession(req);
  const user = session?.user;

  if (!user) {
    console.error('Unauthorized access attempt: No user session');
    return NextResponse.json({ error: 'Unauthorized', details: 'No user session found' }, { status: 401 });
  }

  // Validate request body
  let paymentMethod: string;
  try {
    const body = await req.json();
    paymentMethod = body?.paymentMethod;
    if (!['COD', 'card'].includes(paymentMethod)) {
      throw new Error('Invalid payment method');
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Invalid request body';
    console.error('Invalid request body:', { error: err });
    return NextResponse.json({ error: 'Invalid request body', details: errorMessage }, { status: 400 });
  }

  // Fetch active cart
  let activeCart;
  try {
    activeCart = await prisma.cart.findFirst({
      where: { user: { publicId: user.publicId }, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cart';
    console.error('Error fetching cart:', { error: err });
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }

  if (!activeCart || activeCart.items.length === 0) {
    console.warn('Cart is empty or not found for user:', user.publicId);
    return NextResponse.json({ error: 'Cart is empty', details: 'No items in cart' }, { status: 400 });
  }

  // Create order
  try {
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
            status: paymentMethod === 'COD' ? 'SUCCESS' : 'PENDING',
          },
        },
      },
      include: {
        payment: true,
        items: { include: { product: true } },
      },
    });

    // Clear cart
    try {
      await prisma.cartItem.deleteMany({ where: { cartId: activeCart.id } });
      await prisma.cart.delete({ where: { id: activeCart.id } });
    } catch (err) {
      console.error('Error clearing cart:', { error: err });
      // Log but don't fail the request, as order creation succeeded
    }

    if (paymentMethod === 'card') {
      try {
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

        if (!stripeSession.url) {
          throw new Error('Stripe session creation failed: No URL returned');
        }

        return NextResponse.json({ paymentUrl: stripeSession.url });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create Stripe session';
        console.error('Stripe error:', { error: err });
        // Update order payment status to FAILED
        await prisma.payment.update({
          where: { orderId: order.id },
          data: { status: 'FAILED' },
        });
        return NextResponse.json({ error: 'Stripe error', details: errorMessage }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, orderId: order.publicId });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Checkout error:', { message: errorMessage, stack: err instanceof Error ? err.stack : undefined });
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}