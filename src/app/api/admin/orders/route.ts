import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';



export async function GET(request: NextRequest) {
  try {
    // Verify session
    const session = await getSession(request);
    if (!session) {
      console.error('No session found');
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }
    if (!session.user || session.user.role !== 'ADMIN') {
      console.error('Unauthorized access attempt:', { session });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Log query start
    console.log('Fetching orders for admin:', session.user.email);

    // Fetch orders
    const orders = await prisma.order.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          select: { name: true, email: true },
        },
        items: {
          include: {
            product: { select: { name: true, price: true } },
          },
        },
        payment: true,
      },
    });

    console.log('Fetched orders:', orders.length);
    return NextResponse.json(orders);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Error fetching orders:', {
      message: errorMessage,
      stack: errorStack,
      requestUrl: request.url,
    });
    return NextResponse.json(
      { error: 'Something went wrong', details: errorMessage },
      { status: 500 }
    );
  }
}


















//curl -H "Cookie: <your-session-cookie>" http://localhost:3000/api/admin/orders






























