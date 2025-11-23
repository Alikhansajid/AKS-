// import { NextResponse, NextRequest } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import { getSession } from '@/lib/session';
// import { v2 as cloudinary } from 'cloudinary';
// import streamifier from 'streamifier';
// import { v4 as uuidv4 } from 'uuid';
// import { UploadApiResponse } from 'cloudinary';
// import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

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

//     const validImages = images.filter(file => {
//       const isImage = file.type.startsWith('image/');
//       const isUnder5MB = file.size <= 5 * 1024 * 1024;
//       return isImage && isUnder5MB;
//     });

//     if (validImages.length !== images.length) {
//       return NextResponse.json({ error: 'Some images are invalid or exceed 5MB limit' }, { status: 400 });
//     }

//     // Generate base slug
//     const baseSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
//     let slug = baseSlug;
//     let slugExists = true;
//     let counter = 1;

//     // Check for existing slug and append suffix if necessary
//     while (slugExists) {
//       const existingProduct = await prisma.product.findUnique({
//         where: { slug },
//         select: { id: true },
//       });
//       if (!existingProduct) {
//         slugExists = false;
//       } else {
//         slug = `${baseSlug}-${counter}`;
//         counter++;
//       }
//     }

//     const product = await prisma.product.create({
//       data: {
//         publicId: uuidv4(),
//         name,
//         slug, // Use the unique slug
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
//         throw error;
//       }
//     });

//     const imageUrls = await Promise.all(uploadPromises).catch(async () => {
//       await prisma.product.delete({ where: { publicId: product.publicId } });
//       throw new Error('Image upload failed');
//     });

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
//     if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
//       return NextResponse.json({ error: 'A product with a similar name already exists. Please use a different name.' }, { status: 400 });
//     }
//     return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
//   }
// }

// export async function PUT(request: NextRequest, { params }: { params: { publicId: string } }) {
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
//     const existingImagesJson = formData.get('existingImages') as string;
//     const existingImages = JSON.parse(existingImagesJson) as { id: number; url: string; productId: number }[];
//     const newImages = formData.getAll('images') as File[];

//     if (!name || isNaN(price) || isNaN(quantity) || isNaN(categoryId)) {
//       return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
//     }

//     const validNewImages = newImages.filter(file => {
//       const isImage = file.type.startsWith('image/');
//       const isUnder5MB = file.size <= 5 * 1024 * 1024;
//       return isImage && isUnder5MB;
//     });

//     if (validNewImages.length !== newImages.length) {
//       return NextResponse.json({ error: 'Some new images are invalid or exceed 5MB limit' }, { status: 400 });
//     }

//     const product = await prisma.product.findUnique({
//       where: { publicId: params.publicId, deletedAt: null },
//       include: { images: true },
//     });

//     if (!product) {
//       return NextResponse.json({ error: 'Product not found' }, { status: 404 });
//     }

//     await prisma.product.update({
//       where: { publicId: params.publicId },
//       data: {
//         name,
//         price,
//         quantity,
//         categoryId,
//         updatedById: parseInt(session.user.publicId),
//       },
//     });

//     const currentImageIds = product.images.map(img => img.id);
//     const existingImageIds = existingImages.map(img => img.id);
//     const imagesToDelete = currentImageIds.filter(id => !existingImageIds.includes(id));

//     if (imagesToDelete.length > 0) {
//       await prisma.productImage.deleteMany({
//         where: { id: { in: imagesToDelete } },
//       });
//       const publicIdsToDelete = product.images
//         .filter(img => imagesToDelete.includes(img.id))
//         .map(img => img.url.split('/').pop()?.split('.')[0]); // Extract public_id
//       if (publicIdsToDelete.length > 0) {
//         await cloudinary.uploader.destroy(`products/${params.publicId}/${publicIdsToDelete.join(',')}`, { resource_type: 'image' });
//       }
//     }

//     const uploadPromises = validNewImages.map(async (file) => {
//       try {
//         const arrayBuffer = await file.arrayBuffer();
//         const buffer = Buffer.from(arrayBuffer);
//         const stream = streamifier.createReadStream(buffer);
//         const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
//           const uploadStream = cloudinary.uploader.upload_stream(
//             {
//               folder: `products/${params.publicId}`,
//               public_id: `${file.name.split('.')[0]}_${Date.now()}`,
//               overwrite: false,
//               resource_type: 'image',
//             },
//             (error, result) => (error ? reject(error) : resolve(result as UploadApiResponse))
//           );
//           stream.pipe(uploadStream);
//         });
//         return { url: uploadResult.secure_url, productId: product.id };
//       } catch (error) {
//         console.error('Image upload failed:', error);
//         throw error;
//       }
//     });

//     const newImageData = await Promise.all(uploadPromises).catch((error) => {
//       console.error('Failed to upload new images:', error);
//       throw error;
//     });

//     if (newImageData.length > 0) {
//       await prisma.productImage.createMany({
//         data: newImageData.map(img => ({
//           url: img.url,
//           productId: img.productId,
//         })),
//       });
//     }

//     // Debug: Log the updated product to verify images
//     const updatedProduct = await prisma.product.findUnique({
//       where: { publicId: params.publicId },
//       include: {
//         category: { select: { name: true } },
//         images: { select: { url: true } },
//       },
//     });
//     console.log('Updated Product with Images:', updatedProduct);

//     return NextResponse.json(updatedProduct);
//   } catch (error: unknown) {
//     console.error('Error updating product:', error);
//     if (error instanceof Error && error.message.includes('Image upload failed')) {
//       return NextResponse.json({ error: 'Server failed to process images. Please try again or upload different images.' }, { status: 500 });
//     }
//     if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
//       return NextResponse.json({ error: 'Product not found' }, { status: 404 });
//     }
//     return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
//   }
// }








import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import retry from 'async-retry';
import { v4 as uuidv4 } from 'uuid';
// import { UploadApiResponse } from 'cloudinary';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Utility to enforce a timeout for promises
const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  const timeout = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out')), ms);
  });
  return Promise.race([promise, timeout]);
};

// Test Cloudinary connectivity
const testCloudinaryConnectivity = async (): Promise<boolean> => {
  try {
    await withTimeout(cloudinary.api.ping(), 5000); // 5-second timeout for ping
    console.log('Cloudinary connectivity test: Success');
    return true;
  } catch (error) {
    console.error('Cloudinary connectivity test failed:', error);
    return false;
  }
};

// Global unhandled rejection handler (temporary for debugging)
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
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

    // Generate unique slug
    const baseSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    let slug = baseSlug;
    let slugExists = true;
    let counter = 1;

    while (slugExists) {
      const existingProduct = await prisma.product.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!existingProduct) {
        slugExists = false;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const product = await prisma.product.create({
      data: {
        publicId: uuidv4(),
        name,
        slug,
        price,
        quantity,
        categoryId,
        updatedById: parseInt(session.user.publicId),
      },
    });

    let imageUrls: { url: string }[] = [];
    if (validImages.length > 0) {
      // Test Cloudinary connectivity
      const isCloudinaryConnected = await testCloudinaryConnectivity();
      if (!isCloudinaryConnected) {
        console.warn('Skipping image upload due to Cloudinary connectivity failure');
      } else {
        // Upload images with retry logic
        const uploadPromises = validImages.map(async (file) => {
          try {
            const arrayBuffer = await file.arrayBuffer();
            console.log('Original file size:', arrayBuffer.byteLength);
            const buffer = await withTimeout(
              sharp(Buffer.from(arrayBuffer))
                .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 80 })
                .toBuffer(),
              5000 // 5-second timeout for image processing
            );
            console.log('Buffer size after resizing:', buffer.length);

            const uploadResult = await withTimeout(
              retry(
                async () => {
                  try {
                    const result = await cloudinary.uploader.upload(
                      `data:image/jpeg;base64,${buffer.toString('base64')}`,
                      {
                        folder: `products/${product.publicId}`,
                        public_id: `${file.name.split('.')[0]}_${Date.now()}`,
                        overwrite: false,
                        resource_type: 'image',
                      }
                    );
                    return { url: result.secure_url };
                  } catch (error) {
                    console.error('Cloudinary upload attempt failed:', error);
                    throw error;
                  }
                },
                {
                  retries: 3,
                  factor: 2,
                  minTimeout: 1000,
                  maxTimeout: 3000,
                  onRetry: (err) => console.log('Retrying upload due to:', err.message),
                }
              ),
              15000 // 15-second timeout for each image upload
            );
            return uploadResult;
          } catch (error) {
            console.error('Image upload failed:', error);
            throw error;
          }
        });

        imageUrls = await Promise.all(uploadPromises).catch(async (error) => {
          console.error('Failed to upload images:', error);
          await prisma.product.delete({ where: { publicId: product.publicId } });
          return [];
        });
      }
    }

    if (imageUrls.length > 0) {
      await prisma.product.update({
        where: { publicId: product.publicId },
        data: {
          images: {
            create: imageUrls.map((img) => ({ url: img.url })),
          },
        },
      });
    }

    const createdProduct = await prisma.product.findUnique({
      where: { publicId: product.publicId },
      include: {
        category: { select: { name: true } },
        images: { select: { url: true } },
      },
    });

    return NextResponse.json(
      createdProduct,
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error creating product:', error);
    if (error instanceof Error && error.message.includes('Image upload failed')) {
      return NextResponse.json({ error: 'Server failed to process images. Please try again or upload different images.' }, { status: 500 });
    }
    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'A product with a similar name already exists. Please use a different name.' }, { status: 400 });
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
        .map(img => img.url.split('/').pop()?.split('.')[0])
        .filter((id): id is string => !!id);
      if (publicIdsToDelete.length > 0) {
        try {
          await Promise.all(
            publicIdsToDelete.map(id =>
              cloudinary.uploader.destroy(`products/${params.publicId}/${id}`, { resource_type: 'image' })
            )
          );
          console.log('Deleted old images from Cloudinary');
        } catch (destroyError) {
          console.error('Failed to delete old images from Cloudinary:', destroyError);
        }
      }
    }

    let newImageData: { url: string; productId: number }[] = [];
    if (validNewImages.length > 0) {
      // Test Cloudinary connectivity
      const isCloudinaryConnected = await testCloudinaryConnectivity();
      if (!isCloudinaryConnected) {
        console.warn('Skipping new image upload due to Cloudinary connectivity failure');
      } else {
        const uploadPromises = validNewImages.map(async (file) => {
          try {
            const arrayBuffer = await file.arrayBuffer();
            console.log('Original file size:', arrayBuffer.byteLength);
            const buffer = await withTimeout(
              sharp(Buffer.from(arrayBuffer))
                .resize({ width: 1000, height: 1000, fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: 80 })
                .toBuffer(),
              5000 // 5-second timeout for image processing
            );
            console.log('Buffer size after resizing:', buffer.length);

            const uploadResult = await withTimeout(
              retry(
                async () => {
                  try {
                    const result = await cloudinary.uploader.upload(
                      `data:image/jpeg;base64,${buffer.toString('base64')}`,
                      {
                        folder: `products/${params.publicId}`,
                        public_id: `${file.name.split('.')[0]}_${Date.now()}`,
                        overwrite: false,
                        resource_type: 'image',
                      }
                    );
                    return { url: result.secure_url, productId: product.id };
                  } catch (error) {
                    console.error('Cloudinary upload attempt failed:', error);
                    throw error;
                  }
                },
                {
                  retries: 3,
                  factor: 2,
                  minTimeout: 1000,
                  maxTimeout: 3000,
                  onRetry: (err) => console.log('Retrying upload due to:', err.message),
                }
              ),
              15000 // 15-second timeout for each image upload
            );
            return uploadResult;
          } catch (error) {
            console.error('Image upload failed:', error);
            throw error;
          }
        });

        newImageData = await Promise.all(uploadPromises).catch((error) => {
          console.error('Failed to upload new images:', error);
          return [];
        });
      }
    }

    if (newImageData.length > 0) {
      await prisma.productImage.createMany({
        data: newImageData.map(img => ({
          url: img.url,
          productId: img.productId,
        })),
      });
    }

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