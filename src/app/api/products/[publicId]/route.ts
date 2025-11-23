// // src/app/api/products/[publicId]/route.ts
// import { prisma } from '@/lib/prisma';
// import { NextRequest } from 'next/server';

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { publicId: string } }
// ) {
//   const { publicId } = params;

//   if (!publicId) {
//     return new Response("Missing product ID", { status: 400 });
//   }

//   try {
//     const product = await prisma.product.findUnique({
//       where: { publicId },
//       include: {
//         category: true,
//         images: true,
//       },
//     });

//     if (!product) {
//       return new Response("Product not found", { status: 404 });
//     }

//     return Response.json(product);
//   } catch (error) {
//     console.error('Error fetching product:', error);
//     return new Response("Internal Server Error", { status: 500 });
//   }
// }









import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch a single product by publicId
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params;

    if (!publicId) {
      return NextResponse.json({ error: 'Missing product ID' }, { status: 400 });
    }

    const product = await prisma.product.findFirst({
      where: { 
        publicId,
        deletedAt: null,
      },
      include: {
        category: {
          select: {
            id: true,
            publicId: true,
            name: true,
            slug: true,
            parentId: true,
            createdAt: true,
            updatedAt: true,
            deletedAt: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            createdAt: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Sanitize image URLs to prevent broken images
    const sanitizedProduct = {
      ...product,
      images: product.images.length > 0
        ? product.images.map((img) => ({
            ...img,
            url: img.url && img.url.startsWith('http') ? img.url : '/images/placeholder.jpg',
          }))
        : [{ id: 0, url: '/images/placeholder.jpg', createdAt: new Date().toISOString() }],
    };

    return NextResponse.json(sanitizedProduct, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { 
        error: 'Something went wrong',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      }, 
      { status: 500 }
    );
  }
}