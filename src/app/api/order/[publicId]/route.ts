// // src/app/api/order/[publicId]/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';

// export async function GET(_: NextRequest, { params }: { params: { publicId: string } }) {
//   const order = await prisma.order.findUnique({
//     where: { publicId: params.publicId },
//     include: {
//       payment: true,
//       items: {
//         include: {
//           product: true,
//         },
//       },
//     },
//   });

//   if (!order) {
//     return NextResponse.json({ error: 'Order not found' }, { status: 404 });
//   }

//   return NextResponse.json(order);
// }








// src/app/api/order/[publicId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_: NextRequest, { params }: { params: { publicId: string } }) {
  try {
    const order = await prisma.order.findUnique({
      where: { publicId: params.publicId },
      include: {
        payment: true,
        items: {
          include: {
            product: {
              select: { name: true, publicId: true },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Calculate total
    const total = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Fallback delivery status (since DB doesn't have it yet)
    const deliveryStatus = 'Pending';

    // Format response for frontend
    const formattedOrder = {
      publicId: order.publicId,
      items: order.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        product: { name: item.product.name },
      })),
      payment: {
        method: order.payment?.method || 'N/A',
        status: order.payment?.status || 'Unknown',
      },
      total,
      deliveryStatus,
    };

    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error('Order fetch error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
