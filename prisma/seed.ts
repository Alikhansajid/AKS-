// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// async function main() {
//   // Clear old data in the right order
//   await prisma.cartItem.deleteMany();
//   await prisma.cart.deleteMany();
//   await prisma.product.deleteMany();
//   await prisma.category.deleteMany();
//   await prisma.user.deleteMany();

//   // Seed categories
//   const electronics = await prisma.category.create({
//     data: { name: 'Electronics', slug: 'electronics' },
//   });

//   const accessories = await prisma.category.create({
//     data: { name: 'Accessories', slug: 'accessories' },
//   });

//   // Seed products (8 total)
//   const products = [
//     {
//       slug: 'wireless-headphones',
//       name: 'Wireless Headphones',
//       price: 49.99,
//       quantity: 100,
//       image: 'https://res.cloudinary.com/dh1vlqndx/image/upload/v1752917649/Screenshot_2025-06-26_144546_hsobza.png',
//       categoryId: electronics.id,
//     },
//     {
//       slug: 'smartwatch-pro',
//       name: 'Smartwatch Pro',
//       price: 99.99,
//       quantity: 80,
//       image: 'https://res.cloudinary.com/dh1vlqndx/image/upload/v1752917649/Screenshot_2025-06-26_144546_hsobza.png',
//       categoryId: electronics.id,
//     },
//     {
//       slug: 'bluetooth-speaker',
//       name: 'Bluetooth Speaker',
//       price: 29.99,
//       quantity: 150,
//       image: 'https://res.cloudinary.com/dh1vlqndx/image/upload/v1752917649/Screenshot_2025-06-26_144546_hsobza.png',
//       categoryId: electronics.id,
//     },
//     {
//       slug: 'vr-headset',
//       name: 'VR Headset',
//       price: 199.99,
//       quantity: 60,
//       image: 'https://res.cloudinary.com/dh1vlqndx/image/upload/v1752917649/Screenshot_2025-06-26_144546_hsobza.png',
//       categoryId: electronics.id,
//     },
//     {
//       slug: 'gaming-mouse',
//       name: 'Gaming Mouse',
//       price: 39.99,
//       quantity: 120,
//       image: 'https://res.cloudinary.com/dh1vlqndx/image/upload/v1752917649/Screenshot_2025-06-26_144546_hsobza.png',
//       categoryId: accessories.id,
//     },
//     {
//       slug: 'mechanical-keyboard',
//       name: 'Mechanical Keyboard',
//       price: 79.99,
//       quantity: 90,
//       image: 'https://res.cloudinary.com/dh1vlqndx/image/upload/v1752917649/Screenshot_2025-06-26_144546_hsobza.png',
//       categoryId: accessories.id,
//     },
//     {
//       slug: 'usb-c-hub',
//       name: 'USB-C Hub',
//       price: 24.99,
//       quantity: 200,
//       image: 'https://res.cloudinary.com/dh1vlqndx/image/upload/v1752917649/Screenshot_2025-06-26_144546_hsobza.png',
//       categoryId: accessories.id,
//     },
//     {
//       slug: 'portable-charger',
//       name: 'Portable Charger',
//       price: 34.99,
//       quantity: 170,
//       image: 'https://res.cloudinary.com/dh1vlqndx/image/upload/v1752917649/Screenshot_2025-06-26_144546_hsobza.png',
//       categoryId: accessories.id,
//     },
//   ];

//   for (const product of products) {
//     await prisma.product.create({ data: product });
//   }

//   console.log('✅ Seeding complete');
// }

// main()
//   .catch((e) => {
//     console.error('❌ Seeding error:', e);
//     process.exit(1);
//   })
//   .finally(() => prisma.$disconnect());






import { PrismaClient } from './src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Clearing old data...");

  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log("🌱 Seeding categories...");
  const electronics = await prisma.category.create({
    data: { name: 'Electronics', slug: 'electronics' },
  });

  const accessories = await prisma.category.create({
    data: { name: 'Accessories', slug: 'accessories' },
  });

  console.log("📦 Seeding products...");
  const products = [
    {
      slug: 'wireless-headphones',
      name: 'Wireless Headphones',
      price: 49.99,
      quantity: 100,
      categoryId: electronics.id,
    },
    {
      slug: 'smartwatch-pro',
      name: 'Smartwatch Pro',
      price: 99.99,
      quantity: 80,
      categoryId: electronics.id,
    },
    {
      slug: 'bluetooth-speaker',
      name: 'Bluetooth Speaker',
      price: 29.99,
      quantity: 150,
      categoryId: electronics.id,
    },
    {
      slug: 'vr-headset',
      name: 'VR Headset',
      price: 199.99,
      quantity: 60,
      categoryId: electronics.id,
    },
    {
      slug: 'gaming-mouse',
      name: 'Gaming Mouse',
      price: 39.99,
      quantity: 120,
      categoryId: accessories.id,
    },
    {
      slug: 'mechanical-keyboard',
      name: 'Mechanical Keyboard',
      price: 79.99,
      quantity: 90,
      categoryId: accessories.id,
    },
    {
      slug: 'usb-c-hub',
      name: 'USB-C Hub',
      price: 24.99,
      quantity: 200,
      categoryId: accessories.id,
    },
    {
      slug: 'portable-charger',
      name: 'Portable Charger',
      price: 34.99,
      quantity: 170,
      categoryId: accessories.id,
    },
  ];

  const sampleImages = [
    'https://res.cloudinary.com/dh1vlqndx/image/upload/v1752917649/Screenshot_2025-06-26_144546_hsobza.png',
    'https://res.cloudinary.com/dh1vlqndx/image/upload/v1752910800/cld-sample-4.jpg'
  ];

  for (const product of products) {
    await prisma.product.create({
      data: {
        ...product,
        images: {
          create: sampleImages.map((url) => ({ url })),
        },
      },
    });
  }

  console.log("✅ Seed completed successfully");
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
