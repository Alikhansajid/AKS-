import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';
import retry from 'async-retry';
// import { UploadApiResponse } from 'cloudinary';

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

// GET: Fetch a single product by publicId for editing
export async function GET(request: NextRequest, { params }: { params: Promise<{ publicId: string }> }) {
  try {
    const session = await getSession(request);
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { publicId } = await params;

    if (!publicId) {
      return NextResponse.json({ error: 'Missing product ID' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { publicId, deletedAt: null },
      include: {
        category: { select: { name: true } },
        images: { select: { id: true, url: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// PUT: Update (edit) a product
export async function PUT(request: NextRequest, { params }: { params: Promise<{ publicId: string }> }) {
  try {
    const session = await getSession(request);
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { publicId } = await params;

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const price = parseFloat(formData.get('price') as string);
    const quantity = parseInt(formData.get('quantity') as string);
    const categoryId = parseInt(formData.get('categoryId') as string);
    const existingImagesJson = formData.get('existingImages') as string;
    const existingImages = JSON.parse(existingImagesJson) as { id: number; url: string }[];
    const newImages = formData.getAll('images').filter(file => file instanceof File && file.size > 0) as File[];

    if (!publicId || !name || isNaN(price) || isNaN(quantity) || isNaN(categoryId)) {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { publicId, deletedAt: null },
      include: { images: true },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId, deletedAt: null },
    });
    if (!category) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    // Generate unique slug
    const baseSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    let slug = baseSlug;
    let slugExists = true;
    let counter = 1;

    while (slugExists) {
      const existingSlugProduct = await prisma.product.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (!existingSlugProduct || existingSlugProduct.id === existingProduct.id) {
        slugExists = false;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Test Cloudinary connectivity
    const isCloudinaryConnected = await testCloudinaryConnectivity();
    let newImageData: { url: string }[] = [];

    if (newImages.length > 0 && isCloudinaryConnected) {
      const uploadPromises = newImages.map(async (file) => {
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
                      folder: `products/${publicId}/images`,
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

      newImageData = await Promise.all(uploadPromises).catch((error) => {
        console.error('Failed to upload new images:', error);
        return [];
      });
    } else if (newImages.length > 0 && !isCloudinaryConnected) {
      console.warn('Skipping new image upload due to Cloudinary connectivity failure');
    }

    // Delete old images
    const currentImageIds = existingProduct.images.map(img => img.id);
    const existingImageIds = existingImages.map(img => img.id);
    const imagesToDelete = currentImageIds.filter(id => !existingImageIds.includes(id));

    if (imagesToDelete.length > 0) {
      await prisma.productImage.deleteMany({
        where: { id: { in: imagesToDelete } },
      });
      const publicIdsToDelete = existingProduct.images
        .filter(img => imagesToDelete.includes(img.id))
        .map(img => img.url.split('/').pop()?.split('.')[0])
        .filter((id): id is string => !!id);
      if (publicIdsToDelete.length > 0 && isCloudinaryConnected) {
        try {
          await Promise.all(
            publicIdsToDelete.map(id =>
              cloudinary.uploader.destroy(`products/${publicId}/images/${id}`, { resource_type: 'image' })
            )
          );
          console.log('Deleted old images from Cloudinary');
        } catch (destroyError) {
          console.error('Failed to delete old images from Cloudinary:', destroyError);
        }
      }
    }

    const product = await prisma.product.update({
      where: { publicId },
      data: {
        name,
        slug,
        price,
        quantity,
        categoryId,
        updatedById: session.user.publicId ? parseInt(session.user.publicId) : null,
        updatedAt: new Date(),
        images: {
          create: newImageData,
        },
      },
      include: {
        category: { select: { name: true } },
        images: { select: { id: true, url: true } },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

// DELETE: Soft delete a product
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ publicId: string }> }) {
  try {
    const session = await getSession(request);
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { publicId } = await params;

    const product = await prisma.product.findUnique({
      where: { publicId, deletedAt: null },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await prisma.product.update({
      where: { publicId },
      data: { deletedAt: new Date(), updatedById: parseInt(session.user.publicId) },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}