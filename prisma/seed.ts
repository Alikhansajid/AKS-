import { PrismaClient } from "../prisma/src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Create categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "Electronics",
        slug: "electronics",
      },
    }),
    prisma.category.create({
      data: {
        name: "Beverages",
        slug: "beverages",
      },
    }),
    prisma.category.create({
      data: {
        name: "Breakfast",
        slug: "breakfast",
      },
    }),
  ]);

  const images = [
    "https://res.cloudinary.com/dh1vlqndx/image/upload/v1752910800/cld-sample-5.jpg",
    "https://res.cloudinary.com/dh1vlqndx/image/upload/v1752910800/samples/coffee.jpg",
    "https://res.cloudinary.com/dh1vlqndx/image/upload/v1752910798/samples/breakfast.jpg",
  ];

  // Sample products data for each category
  const productsData = [
    // 4 products for Electronics
    {
      name: "Smartphone",
      slug: "smartphone",
      price: 699.99,
      quantity: 50,
      category: categories[0],
    },
    {
      name: "Laptop",
      slug: "laptop",
      price: 999.99,
      quantity: 30,
      category: categories[0],
    },
    {
      name: "Wireless Headphones",
      slug: "wireless-headphones",
      price: 199.99,
      quantity: 100,
      category: categories[0],
    },
    {
      name: "Smartwatch",
      slug: "smartwatch",
      price: 299.99,
      quantity: 75,
      category: categories[0],
    },

    // 4 products for Beverages
    {
      name: "Coffee Beans",
      slug: "coffee-beans",
      price: 15.99,
      quantity: 200,
      category: categories[1],
    },
    {
      name: "Green Tea",
      slug: "green-tea",
      price: 12.99,
      quantity: 180,
      category: categories[1],
    },
    {
      name: "Orange Juice",
      slug: "orange-juice",
      price: 9.99,
      quantity: 220,
      category: categories[1],
    },
    {
      name: "Energy Drink",
      slug: "energy-drink",
      price: 3.99,
      quantity: 300,
      category: categories[1],
    },

    // 4 products for Breakfast
    {
      name: "Pancake Mix",
      slug: "pancake-mix",
      price: 6.99,
      quantity: 120,
      category: categories[2],
    },
    {
      name: "Maple Syrup",
      slug: "maple-syrup",
      price: 10.99,
      quantity: 80,
      category: categories[2],
    },
    {
      name: "Granola Bars",
      slug: "granola-bars",
      price: 5.99,
      quantity: 150,
      category: categories[2],
    },
    {
      name: "Fruit Jam",
      slug: "fruit-jam",
      price: 7.99,
      quantity: 90,
      category: categories[2],
    },
  ];

  // Create products and their images
  for (const productData of productsData) {
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        slug: productData.slug,
        price: productData.price,
        quantity: productData.quantity,
        categoryId: productData.category.id,
        images: {
          create: images.map((url) => ({
            url,
          })),
        },
      },
    });

    console.log(`Created product: ${product.name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
