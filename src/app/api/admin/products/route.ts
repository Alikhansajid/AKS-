// import { NextResponse, NextRequest } from 'next/server';
// import { getSession } from '@/lib/session';
// import { prisma } from '@/lib/prisma';
// import { v2 as cloudinary } from 'cloudinary';
// import streamifier from 'streamifier';
// import { v4 as uuidv4 } from 'uuid';
// import { UploadApiResponse } from 'cloudinary';

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// export async function GET(request: NextRequest) {
//   try {
//     const session = await getSession(request);
//     if (!session.user || session.user.role !== 'ADMIN') {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const products = await prisma.product.findMany({
//       where: { deletedAt: null },
//       include: {
//         category: { select: { name: true } },
//         images: { select: { url: true } },
//       },
//     });

//     return NextResponse.json(products);
//   } catch (error: unknown) {
//     console.error('Error fetching products:', error);
//     return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
//   }
// }

// export async function POST(request: NextRequest) {
//   try {
//     const session = await getSession(request);
//     if (!session.user || session.user.role !== 'ADMIN') {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//     }

//     const formData = await request.formData();
//     const name = formData.get('name') as string;
//     const price = parseFloat(formData.get('price') as string);
//     const quantity = parseInt(formData.get('quantity') as string);
//     const categoryId = parseInt(formData.get('categoryId') as string);
//     const images = formData.getAll('images') as File[];

//     if (!name || isNaN(price) || isNaN(quantity) || isNaN(categoryId)) {
//       return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
//     }

//     // Validate images
//     const validImages = images.filter(file => {
//       const isImage = file.type.startsWith('image/');
//       const isUnder5MB = file.size <= 5 * 1024 * 1024; // 5MB limit
//       return isImage && isUnder5MB;
//     });

//     if (validImages.length !== images.length) {
//       return NextResponse.json({ error: 'Some images are invalid or exceed 5MB limit' }, { status: 400 });
//     }

//     // Create product in Prisma to get the assigned publicId
//     const product = await prisma.product.create({
//       data: {
//         publicId: uuidv4(),
//         name,
//         slug: name.toLowerCase().replace(/\s+/g, '-'),
//         price,
//         quantity,
//         categoryId,
//         updatedById: parseInt(session.user.publicId),
//       },
//     });

//     const uploadPromises = validImages.map(async (file) => {
//       try {
//         const arrayBuffer = await file.arrayBuffer();
//         const buffer = Buffer.from(arrayBuffer);
//         const stream = streamifier.createReadStream(buffer);
//         const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
//           const uploadStream = cloudinary.uploader.upload_stream(
//             {
//               folder: `products/${product.publicId}`,
//               public_id: `${file.name.split('.')[0]}_${Date.now()}`,
//               overwrite: false,
//               resource_type: 'image',
//             },
//             (error, result) => (error ? reject(error) : resolve(result as UploadApiResponse))
//           );
//           stream.pipe(uploadStream);
//         });
//         return { url: uploadResult.secure_url };
//       } catch (error) {
//         console.error('Image upload failed:', error);
//         throw error; // Will be caught by Promise.all
//       }
//     });

//     const imageUrls = await Promise.all(uploadPromises).catch(() => {
//       // Cleanup: Delete product if image upload fails
//       prisma.product.delete({ where: { publicId: product.publicId } });
//       throw new Error('Image upload failed');
//     });

//     // Update product with image URLs
//     await prisma.product.update({
//       where: { publicId: product.publicId },
//       data: {
//         images: {
//           create: imageUrls.map((img) => ({ url: img.url })),
//         },
//       },
//     });

//     return NextResponse.json(
//       await prisma.product.findUnique({
//         where: { publicId: product.publicId },
//         include: {
//           category: { select: { name: true } },
//           images: { select: { url: true } },
//         },
//       }),
//       { status: 201 }
//     );
//   } catch (error: unknown) {
//     console.error('Error creating product:', error);
//     if (error instanceof Error && error.message.includes('Image upload failed')) {
//       return NextResponse.json({ error: 'Server failed to process images. Please try again or upload different images.' }, { status: 500 });
//     }
//     return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
//   }
// }









import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { v4 as uuidv4 } from 'uuid';
import { UploadApiResponse } from 'cloudinary';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      include: {
        category: { select: { name: true } },
        images: { select: { url: true } },
      },
    });

    return NextResponse.json(products);
  } catch (error: unknown) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const price = parseFloat(formData.get('price') as string);
    const quantity = parseInt(formData.get('quantity') as string);
    const categoryId = parseInt(formData.get('categoryId') as string);
    const images = formData.getAll('images') as File[];

    if (!name || isNaN(price) || isNaN(quantity) || isNaN(categoryId)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const validImages = images.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isUnder5MB = file.size <= 5 * 1024 * 1024;
      return isImage && isUnder5MB;
    });

    if (validImages.length !== images.length) {
      return NextResponse.json({ error: 'Some images are invalid or exceed 5MB limit' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        publicId: uuidv4(),
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        price,
        quantity,
        categoryId,
        updatedById: parseInt(session.user.publicId),
      },
    });

    const uploadPromises = validImages.map(async (file) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const stream = streamifier.createReadStream(buffer);
        const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `products/${product.publicId}`,
              public_id: `${file.name.split('.')[0]}_${Date.now()}`,
              overwrite: false,
              resource_type: 'image',
            },
            (error, result) => (error ? reject(error) : resolve(result as UploadApiResponse))
          );
          stream.pipe(uploadStream);
        });
        return { url: uploadResult.secure_url };
      } catch (error) {
        console.error('Image upload failed:', error);
        throw error;
      }
    });

    const imageUrls = await Promise.all(uploadPromises).catch(() => {
      prisma.product.delete({ where: { publicId: product.publicId } });
      throw new Error('Image upload failed');
    });

    await prisma.product.update({
      where: { publicId: product.publicId },
      data: {
        images: {
          create: imageUrls.map((img) => ({ url: img.url })),
        },
      },
    });

    return NextResponse.json(
      await prisma.product.findUnique({
        where: { publicId: product.publicId },
        include: {
          category: { select: { name: true } },
          images: { select: { url: true } },
        },
      }),
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating product:', error);
    if (error instanceof Error && error.message.includes('Image upload failed')) {
      return NextResponse.json({ error: 'Server failed to process images. Please try again or upload different images.' }, { status: 500 });
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { publicId: string } }) {
  try {
    const session = await getSession(request);
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const price = parseFloat(formData.get('price') as string);
    const quantity = parseInt(formData.get('quantity') as string);
    const categoryId = parseInt(formData.get('categoryId') as string);
    const existingImagesJson = formData.get('existingImages') as string;
    const existingImages = JSON.parse(existingImagesJson) as { id: number; url: string; productId: number }[];
    const newImages = formData.getAll('images') as File[];

    if (!name || isNaN(price) || isNaN(quantity) || isNaN(categoryId)) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    const validNewImages = newImages.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isUnder5MB = file.size <= 5 * 1024 * 1024;
      return isImage && isUnder5MB;
    });

    if (validNewImages.length !== newImages.length) {
      return NextResponse.json({ error: 'Some new images are invalid or exceed 5MB limit' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { publicId: params.publicId, deletedAt: null },
      include: { images: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await prisma.product.update({
      where: { publicId: params.publicId },
      data: {
        name,
        price,
        quantity,
        categoryId,
        updatedById: parseInt(session.user.publicId),
      },
    });

    const currentImageIds = product.images.map(img => img.id);
    const existingImageIds = existingImages.map(img => img.id);
    const imagesToDelete = currentImageIds.filter(id => !existingImageIds.includes(id));

    if (imagesToDelete.length > 0) {
      await prisma.productImage.deleteMany({
        where: { id: { in: imagesToDelete } },
      });
      const publicIdsToDelete = product.images
        .filter(img => imagesToDelete.includes(img.id))
        .map(img => img.url.split('/').pop()?.split('.')[0]); // Extract public_id
      if (publicIdsToDelete.length > 0) {
        await cloudinary.uploader.destroy(`products/${params.publicId}/${publicIdsToDelete.join(',')}`, { resource_type: 'image' });
      }
    }

    const uploadPromises = validNewImages.map(async (file) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const stream = streamifier.createReadStream(buffer);
        const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `products/${params.publicId}`,
              public_id: `${file.name.split('.')[0]}_${Date.now()}`,
              overwrite: false,
              resource_type: 'image',
            },
            (error, result) => (error ? reject(error) : resolve(result as UploadApiResponse))
          );
          stream.pipe(uploadStream);
        });
        return { url: uploadResult.secure_url, productId: product.id };
      } catch (error) {
        console.error('Image upload failed:', error);
        throw error;
      }
    });

    const newImageData = await Promise.all(uploadPromises).catch((error) => {
      console.error('Failed to upload new images:', error);
      throw error;
    });

    if (newImageData.length > 0) {
      await prisma.productImage.createMany({
        data: newImageData.map(img => ({
          url: img.url,
          productId: img.productId,
        })),
      });
    }

    // Debug: Log the updated product to verify images
    const updatedProduct = await prisma.product.findUnique({
      where: { publicId: params.publicId },
      include: {
        category: { select: { name: true } },
        images: { select: { url: true } },
      },
    });
    console.log('Updated Product with Images:', updatedProduct);

    return NextResponse.json(updatedProduct);
  } catch (error: unknown) {
    console.error('Error updating product:', error);
    if (error instanceof Error && error.message.includes('Image upload failed')) {
      return NextResponse.json({ error: 'Server failed to process images. Please try again or upload different images.' }, { status: 500 });
    }
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}