import axios from "axios";
import * as cheerio from "cheerio";
import { PrismaClient } from "@prisma/client";
import NodeCache from "node-cache";
import cron from "node-cron";

const prisma = new PrismaClient();
const cache = new NodeCache({ stdTTL: 1200 }); // 20 minutes

const BASE_URL = "https://priceoye.pk/mobiles";

interface ProductData {
  name: string;
  price: number;
  img: string;
  link: string;
  slug: string;
  sourceUrl?: string;
  details?: { url: string };
}

function generateSlug(name: string, index: number): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${baseSlug}-${index}`;
}

async function fetchProductsFromHTML(): Promise<ProductData[]> {
  console.log(" Fetching HTML from PriceOye...");

  try {
    const { data: html } = await axios.get(BASE_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 10000,
    });

    console.log(" Page fetched. Parsing...");

    const $ = cheerio.load(html);
    const products: ProductData[] = [];

    $("[class*='product-box'], [class*='productBox']").each((index, element) => {
      const $el = $(element);

      const name = $el.find("[class*='product-name'], [class*='p-title'], h3, h4").text().trim();
      const priceText = $el.find("[class*='price'], [class*='price-box']").text().trim();
      const price = parseInt(priceText.replace(/[^\d]/g, ""), 10) || 0;
      const img = $el.find("img, [class*='product-thumbnail']").attr("src") || "";
      const link = $el.find("a").attr("href") || "";
      const slug = $el.attr("data-slug") || generateSlug(name, index);

      if (!name) {
        console.warn(` Skipping product due to missing name at index ${index}`);
        return;
      }
      if (!slug) {
        console.warn(` Skipping product due to missing slug for name: ${name}`);
        return;
      }

      products.push({
        name,
        price,
        img,
        link,
        slug,
        sourceUrl: link,
        details: link ? { url: link } : undefined,
      });
    });

    console.log(` Found ${products.length} products.`);
    return products;
  } catch (error) {
    console.error(" Fetch error:", (error as Error).message);
    return [];
  }
}

async function processProductsInBatches(products: ProductData[], batchSize: number = 10): Promise<void> {
  let category = await prisma.category.findFirst({
    where: { name: "Mobiles" },
  });

  if (!category) {
    try {
      category = await prisma.category.create({
        data: { name: "Mobiles", slug: "mobiles" },
      });
      console.log(" Created category: Mobiles");
    } catch (err) {
      console.error(" Failed to create category:", (err as Error).message);
      return;
    }
  }

  const categoryId = category.id;

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    console.log(` Processing batch ${i / batchSize + 1} (${batch.length} products)`);

    await Promise.all(
      batch.map(async (prod, index) => {
        console.log(`[${i + index + 1}/${products.length}] ${prod.name}`);

        try {
          const existing = await prisma.product.findUnique({
            where: { slug: prod.slug },
          });

          if (existing) {
            await prisma.product.update({
              where: { id: existing.id },
              data: {
                name: prod.name,
                price: prod.price,
                categoryId,
                isfetch: true,
                sourceUrl: prod.sourceUrl,
                details: prod.details,
              },
            });

            await prisma.productImage.deleteMany({
              where: { productId: existing.id },
            });

            if (prod.img) {
              await prisma.productImage.create({
                data: { url: prod.img, productId: existing.id },
              });
            }

            console.log(` Updated: ${prod.name}`);
          } else {
            await prisma.product.create({
              data: {
                name: prod.name,
                slug: prod.slug,
                price: prod.price,
                quantity: 0,
                categoryId,
                isfetch: true,
                sourceUrl: prod.sourceUrl,
                details: prod.details,
                images: prod.img ? { create: [{ url: prod.img }] } : undefined,
              },
            });

            console.log(` Created: ${prod.name}`);
          }
        } catch (err) {
          console.error(` Error processing ${prod.name}:`, (err as Error).message, {
            slug: prod.slug,
            price: prod.price,
            categoryId,
          });
        }
      })
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

async function scrapeAndStore(): Promise<void> {
  try {
    let productsData = (cache.get("priceoye_products") as ProductData[]) ?? null;

    if (!productsData) {
      console.log(" No cache. Scraping fresh data...");
      productsData = await fetchProductsFromHTML();

      if (productsData.length === 0) {
        console.warn("No products found. Check selectors again.");
        return;
      }

      cache.set("priceoye_products", productsData);
    } else {
      console.log("Using cached data.");
    }

    console.log("Processing products...");
    await processProductsInBatches(productsData);
    console.log("Scraping & DB sync complete.");
  } catch (err) {
    console.error("Scrape error:", (err as Error).message);
  } finally {
    await prisma.$disconnect();
  }
}


cron.schedule("0 0 */2 * *", () => {
  console.log("Running scheduled scrape job at", new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  scrapeAndStore().catch((err) => console.error("Scheduled scrape error:", err));
});



scrapeAndStore().catch(console.error);