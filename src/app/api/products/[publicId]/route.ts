// src/app/api/products/[publicId]/route.ts
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { publicId: string } }
) {
  const { publicId } = params;

  if (!publicId) {
    return new Response("Missing product ID", { status: 400 });
  }

  try {
    const product = await prisma.product.findUnique({
      where: { publicId },
      include: {
        category: true,
        images: true,
      },
    });

    if (!product) {
      return new Response("Product not found", { status: 404 });
    }

    return Response.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
