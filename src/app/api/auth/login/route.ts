import { getIronSession } from 'iron-session';
import { NextRequest, NextResponse } from 'next/server';
import { sessionOptions } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

interface IronSessionData {
  user?: {
    publicId: string;
    email: string;
    name: string;
    phone?: string;
    profilePic?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, localCart } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Get or create cart
    let cart = await prisma.cart.findFirst({
      where: { userId: user.id },
      include: { items: true },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.id },
        include: { items: true },
      });
    }

    // Merge local cart
    if (Array.isArray(localCart)) {
      for (const item of localCart) {
        const product = await prisma.product.findUnique({
          where: { publicId: item.product.publicId },
        });
        if (!product) continue;

        const existingItem = cart.items.find(i => i.productId === product.id);
        if (existingItem) {
          await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + item.quantity },
          });
        } else {
          await prisma.cartItem.create({
            data: {
              cartId: cart.id,
              productId: product.id,
              quantity: item.quantity,
            },
          });
        }
      }
    }

    const res = NextResponse.json({
      user: {
        publicId: user.publicId,
        email: user.email,
        name: user.name,
        phone: user.phone || undefined,
        profilePic: user.profilePic || undefined,
      },
      redirect: '/',
    });

    const session = await getIronSession<IronSessionData>(req, res, sessionOptions);
    session.user = {
      publicId: user.publicId,
      email: user.email,
      name: user.name,
      phone: user.phone || undefined,
      profilePic: user.profilePic || undefined,
    };
    await session.save();

    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
