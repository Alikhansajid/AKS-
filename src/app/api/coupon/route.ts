// import { NextRequest, NextResponse } from 'next/server';
// import { getSession } from '@/lib/session';
// import { prisma } from '@/lib/prisma';

// // Type definitions
// interface SessionUser {
//   publicId: string;
//   role: string;
// }

// interface Session {
//   user?: SessionUser;
// }

// interface PrismaError extends Error {
//   code?: string;
//   meta?: Record<string, unknown>;
// }

// export async function GET(req: NextRequest): Promise<NextResponse> {
//   const session = await getSession(req) as Session;
//   console.log('Session:', session); // Debug log

//   if (!session?.user?.publicId || session.user.role !== 'ADMIN') {
//     return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
//   }

//   try {
//     const coupons = await prisma.coupon.findMany({
//       where: { deletedAt: null },
//       include: { carts: true }, // Optionally include related carts for debugging
//     });
//     return NextResponse.json(coupons);
//   } catch (error: unknown) {
//     const prismaError = error as PrismaError;
//     console.error('Failed to fetch coupons:', {
//       message: prismaError.message,
//       code: prismaError.code,
//       meta: prismaError.meta,
//       stack: prismaError.stack,
//     });
//     return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
//   }
// }

// export async function POST(req: NextRequest): Promise<NextResponse> {
//   const session = await getSession(req) as Session;
//   console.log('Session:', session); // Debug log

//   if (!session?.user?.publicId || session.user.role !== 'ADMIN') {
//     return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
//   }

//   try {
//     const body = await req.json();
//     const { code, discountType, discountValue, minOrderValue, maxUses, startDate, expiryDate } = body;

//     if (!code || !discountType || !discountValue) {
//       return NextResponse.json({ error: 'Missing required fields: code, discountType, and discountValue' }, { status: 400 });
//     }

//     const coupon = await prisma.coupon.create({
//       data: {
//         publicId: crypto.randomUUID(), // Generate a unique publicId
//         code,
//         discountType,
//         discountValue,
//         minOrderValue,
//         maxUses,
//         startDate: startDate ? new Date(startDate) : undefined,
//         expiryDate: expiryDate ? new Date(expiryDate) : undefined,
//         isActive: true,
//       },
//     });
//     return NextResponse.json(coupon, { status: 201 });
//   } catch (error: unknown) {
//     const prismaError = error as PrismaError;
//     console.error('Failed to create coupon:', {
//       message: prismaError.message,
//       code: prismaError.code,
//       meta: prismaError.meta,
//       stack: prismaError.stack,
//     });
//     return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
//   }
// }

// export async function PATCH(req: NextRequest): Promise<NextResponse> {
//   const session = await getSession(req) as Session;
//   console.log('Session:', session); // Debug log

//   if (!session?.user?.publicId || session.user.role !== 'ADMIN') {
//     return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
//   }

//   try {
//     const { searchParams } = new URL(req.url);
//     const id = parseInt(searchParams.get('id') || '');
//     const body = await req.json();
//     const { code, discountType, discountValue, minOrderValue, maxUses, startDate, expiryDate, isActive } = body;

//     if (!id || !code || !discountType || !discountValue) {
//       return NextResponse.json({ error: 'Missing required fields: id, code, discountType, and discountValue' }, { status: 400 });
//     }

//     const coupon = await prisma.coupon.update({
//       where: { id },
//       data: {
//         code,
//         discountType,
//         discountValue,
//         minOrderValue,
//         maxUses,
//         startDate: startDate ? new Date(startDate) : undefined,
//         expiryDate: expiryDate ? new Date(expiryDate) : undefined,
//         isActive,
//       },
//     });
//     return NextResponse.json(coupon);
//   } catch (error: unknown) {
//     const prismaError = error as PrismaError;
//     console.error('Failed to update coupon:', {
//       message: prismaError.message,
//       code: prismaError.code,
//       meta: prismaError.meta,
//       stack: prismaError.stack,
//     });
//     return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
//   }
// }

// export async function DELETE(req: NextRequest): Promise<NextResponse> {
//   const session = await getSession(req) as Session;
//   console.log('Session:', session); // Debug log

//   if (!session?.user?.publicId || session.user.role !== 'ADMIN') {
//     return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
//   }

//   try {
//     const { searchParams } = new URL(req.url);
//     const id = parseInt(searchParams.get('id') || '');

//     if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

//     await prisma.coupon.update({
//       where: { id },
//       data: { deletedAt: new Date() },
//     });
//     return NextResponse.json({ success: true });
//   } catch (error: unknown) {
//     const prismaError = error as PrismaError;
//     console.error('Failed to delete coupon:', {
//       message: prismaError.message,
//       code: prismaError.code,
//       meta: prismaError.meta,
//       stack: prismaError.stack,
//     });
//     return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
//   }
// }








import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';

// Type definitions
interface SessionUser {
  publicId: string;
  role: string;
}

interface Session {
  user?: SessionUser;
}

interface PrismaError extends Error {
  code?: string;
  meta?: Record<string, unknown>;
}

if (!prisma) {
  console.error('Prisma client is not initialized. Check lib/prisma.ts and run npx prisma generate.');
  throw new Error('Prisma client is not available');
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getSession(req) as Session;
  console.log('Session:', session); // Debug log

  if (!session?.user?.publicId || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  try {
    const coupons = await prisma.coupon.findMany({
      where: { deletedAt: null },
      include: { carts: true }, // Optionally include related carts for debugging
    });
    return NextResponse.json(coupons);
  } catch (error: unknown) {
    const prismaError = error as PrismaError;
    console.error('Failed to fetch coupons:', {
      message: prismaError.message,
      code: prismaError.code,
      meta: prismaError.meta,
      stack: prismaError.stack,
    });
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await getSession(req) as Session;
  console.log('Session:', session); // Debug log

  if (!session?.user?.publicId || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { code, discountType, discountValue, minOrderValue, maxUses, startDate, expiryDate } = body;

    if (!code || !discountType || !discountValue) {
      return NextResponse.json({ error: 'Missing required fields: code, discountType, and discountValue' }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        publicId: crypto.randomUUID(), // Generate a unique publicId
        code,
        discountType,
        discountValue,
        minOrderValue,
        maxUses,
        startDate: startDate ? new Date(startDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        isActive: true,
      },
    });
    return NextResponse.json(coupon, { status: 201 });
  } catch (error: unknown) {
    const prismaError = error as PrismaError;
    console.error('Failed to create coupon:', {
      message: prismaError.message,
      code: prismaError.code,
      meta: prismaError.meta,
      stack: prismaError.stack,
    });
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const session = await getSession(req) as Session;
  console.log('Session:', session); // Debug log

  if (!session?.user?.publicId || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id') || '');
    const body = await req.json();
    const { code, discountType, discountValue, minOrderValue, maxUses, startDate, expiryDate, isActive } = body;

    if (!id || !code || !discountType || !discountValue) {
      return NextResponse.json({ error: 'Missing required fields: id, code, discountType, and discountValue' }, { status: 400 });
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        code,
        discountType,
        discountValue,
        minOrderValue,
        maxUses,
        startDate: startDate ? new Date(startDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        isActive,
      },
    });
    return NextResponse.json(coupon);
  } catch (error: unknown) {
    const prismaError = error as PrismaError;
    console.error('Failed to update coupon:', {
      message: prismaError.message,
      code: prismaError.code,
      meta: prismaError.meta,
      stack: prismaError.stack,
    });
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const session = await getSession(req) as Session;
  console.log('Session:', session); // Debug log

  if (!session?.user?.publicId || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get('id') || '');

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    await prisma.coupon.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const prismaError = error as PrismaError;
    console.error('Failed to delete coupon:', {
      message: prismaError.message,
      code: prismaError.code,
      meta: prismaError.meta,
      stack: prismaError.stack,
    });
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 });
  }
}