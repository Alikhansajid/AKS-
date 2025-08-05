import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// Type to define cart items with product details
type CartItemWithProduct = {
  id: number;
  publicId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  quantity: number;
  cartId: number;
  productId: number;
  product: {
    publicId: string;
    name: string;
    price: number;
  };
};

// Add item to cart
export async function POST(req: NextRequest) {
  const session = await getSession(req);
  const { publicId, quantity } = await req.json();

  if (!publicId || quantity < 1) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  if (!session?.user?.publicId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { publicId: session.user.publicId },
    select: { id: true },
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 });

  const product = await prisma.product.findUnique({
    where: { publicId },
  });

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  let cart = await prisma.cart.findFirst({
    where: { userId: user.id },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId: user.id },
    });
  }

  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId: product.id,
      deletedAt: null,
    },
  });

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: existingItem.quantity + quantity,
      },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        quantity,
      },
    });
  }

  return NextResponse.json({ success: true });
}

// Get cart items
export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.user?.publicId) {
    return NextResponse.json([] as CartItemWithProduct[], { status: 200 });
  }

  const user = await prisma.user.findUnique({
    where: { publicId: session.user.publicId },
    select: { id: true },
  });

  if (!user) return NextResponse.json([] as CartItemWithProduct[], { status: 200 });

  // Find cart with items
  let cart = await prisma.cart.findFirst({
    where: {
      userId: user.id,
      deletedAt: null,
    },
    include: {
      items: {
        where: { deletedAt: null },
        include: {
          product: {
            select: {
              publicId: true,
              name: true,
              price: true,
            },
          },
        },
      },
    },
  });

  // Create empty cart if none exists
  if (!cart) {
    cart = await prisma.cart.create({
  data: {
    userId: user.id,
  },
  include: {
    items: {
      where: { deletedAt: null },
      include: {
        product: {
          select: {
            name: true,
            publicId: true,
            price: true,
          },
        },
      },
    },
  },
});


    return NextResponse.json([] as CartItemWithProduct[]);
  }

  return NextResponse.json(cart.items as CartItemWithProduct[]);
}
