// scripts/migrate-images.ts
import { prisma } from '@/lib/prisma';

async function migrateImages() {
  const products = await prisma.product.findMany({
    where: { images: { some: { url: { contains: 'example.com' } } } },
    include: { images: true },
  });

  for (const product of products) {
    const newUrls = product.images.map(img => ({
      url: img.url.replace('example.com', 'res.cloudinary.com/your-cloud-name/image/upload'), // Placeholder
    }));
    await prisma.product.update({
      where: { publicId: product.publicId },
      data: {
        images: {
          deleteMany: {},
          create: newUrls.map(url => ({ url: url.url })),
        },
      },
    });
    console.log(`Migrated product ${product.publicId}`);
  }
}

migrateImages().catch(console.error);