import { NextResponse, NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';
import { UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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
    const existingImages = JSON.parse(formData.get('existingImages') as string) as { id: number; url: string }[];
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

    const imageUpdates = {
      create: [] as { url: string }[],
      deleteMany: {} as { id?: { notIn?: number[] } },
    };

    if (newImages.length > 0) {
      imageUpdates.deleteMany = { id: { notIn: existingImages.map(img => img.id) } };
      const uploadPromises = newImages.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const stream = streamifier.createReadStream(buffer);
        const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: `products/${publicId}/images`, public_id: `${file.name.split('.')[0]}_${Date.now()}`, overwrite: false, resource_type: 'image' },
            (error, result) => (error ? reject(error) : resolve(result as UploadApiResponse))
          );
          stream.pipe(uploadStream);
        });
        return { url: uploadResult.secure_url };
      });
      imageUpdates.create = await Promise.all(uploadPromises);
    } else {
      imageUpdates.deleteMany = { id: { notIn: existingImages.map(img => img.id) } };
    }

    const product = await prisma.product.update({
      where: { publicId },
      data: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        price,
        quantity,
        categoryId,
        updatedById: session.user.publicId ? parseInt(session.user.publicId) : null,
        updatedAt: new Date(),
        images: imageUpdates,
      },
      include: { category: { select: { name: true } }, images: { select: { id: true, url: true } } },
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