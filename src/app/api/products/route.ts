import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch all products with caching and optimization
export async function GET() {
  try {
    // Fetch products with optimized query
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      include: {
        category: { 
          select: { 
            id: true,
            name: true,
            slug: true,
            publicId: true,
          } 
        },
        images: { 
          select: { 
            id: true, 
            url: true, 
            createdAt: true 
          },
          orderBy: {
            createdAt: 'asc',
          },
          take: 5, // Limit images per product
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1000, // Limit total products for performance
    });

    // Ensure valid image URLs
    const sanitizedProducts = products.map((product) => ({
      ...product,
      images: product.images.length > 0
        ? product.images.map((img) => ({
            ...img,
            url: img.url && img.url.startsWith('http') ? img.url : '/images/placeholder.jpg',
          }))
        : [{ id: 0, url: '/images/placeholder.jpg', createdAt: new Date().toISOString() }],
    }));

    return NextResponse.json(sanitizedProducts, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'CDN-Cache-Control': 'public, s-maxage=60',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { 
        error: 'Something went wrong',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      }, 
      { status: 500 }
    );
  }
}















// import { NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';

// export async function GET() {
//   try {
//     const products = await prisma.product.findMany({
//       // ❌ only include if Product has deletedAt
//       // where: { deletedAt: null },
//       include: {
//         category: { select: { name: true } },
//         images: { select: { id: true, url: true, createdAt: true } },
//       },
//     });

//     const sanitizedProducts = products.map((product) => ({
//       ...product,
//       images:
//         product.images.length > 0
//           ? product.images.map((img) => ({
//               ...img,
//               url: img.url && img.url.startsWith('http')
//                 ? img.url
//                 : '/images/placeholder.jpg',
//             }))
//           : [
//               {
//                 id: 0,
//                 url: '/images/placeholder.jpg',
//                 createdAt: new Date(), // ✅ match Prisma DateTime
//               },
//             ],
//     }));

//     return NextResponse.json(sanitizedProducts);
//   } catch (error) {
//     console.error('❌ Error fetching products:', error);
//     return NextResponse.json(
//       { error: 'Something went wrong', details: (error as Error).message },
//       { status: 500 }
//     );
//   }
// }
