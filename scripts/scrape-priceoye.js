// "use strict";
// // // scripts/scrape-priceoye.ts
// // import axios from "axios";
// // import * as cheerio from "cheerio";
// // import { PrismaClient } from "@prisma/client";
// // import NodeCache from "node-cache";
// var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
//     function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
//     return new (P || (P = Promise))(function (resolve, reject) {
//         function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
//         function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
//         function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
//         step((generator = generator.apply(thisArg, _arguments || [])).next());
//     });
// };
// var __generator = (this && this.__generator) || function (thisArg, body) {
//     var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
//     return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
//     function verb(n) { return function (v) { return step([n, v]); }; }
//     function step(op) {
//         if (f) throw new TypeError("Generator is already executing.");
//         while (g && (g = 0, op[0] && (_ = 0)), _) try {
//             if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
//             if (y = 0, t) op = [op[0] & 2, t.value];
//             switch (op[0]) {
//                 case 0: case 1: t = op; break;
//                 case 4: _.label++; return { value: op[1], done: false };
//                 case 5: _.label++; y = op[1]; op = [0]; continue;
//                 case 7: op = _.ops.pop(); _.trys.pop(); continue;
//                 default:
//                     if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
//                     if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
//                     if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
//                     if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
//                     if (t[2]) _.ops.pop();
//                     _.trys.pop(); continue;
//             }
//             op = body.call(thisArg, _);
//         } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
//         if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
//     }
// };
// Object.defineProperty(exports, "__esModule", { value: true });
// // const prisma = new PrismaClient();
// // const cache = new NodeCache({ stdTTL: 1200 });
// // const BASE_URL = "https://priceoye.pk/mobiles";
// // interface ProductData {
// //   name: string;
// //   price: number;
// //   img: string;
// //   link: string;
// //   slug: string;
// // }
// // async function fetchProductsFromHTML(): Promise<ProductData[]> {
// //   console.log("🌐 Fetching HTML from PriceOye...");
// //   const { data: html } = await axios.get(BASE_URL, {
// //     headers: {
// //       "User-Agent":
// //         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
// //     },
// //   });
// //   console.log("✅ Page fetched. Parsing...");
// //   const $ = cheerio.load(html);
// //   const products: ProductData[] = [];
// //   $(".productBox").each((_, element) => {
// //     const $el = $(element);
// //     const name = $el.find(".p-title").text().trim();
// //     const priceText = $el.find(".price-box").text().trim();
// //     const price = parseInt(priceText.replace(/[^\d]/g, ""), 10) || 0;
// //     const img = $el.find("amp-img.product-thumbnail").attr("src") || "";
// //     const link = $el.find("a").attr("href") || "";
// //     const slug = $el.attr("data-slug") || "";
// //     if (!name) return;
// //     products.push({ name, price, img, link, slug });
// //   });
// //   console.log(`🔍 Found ${products.length} products.`);
// //   return products;
// // }
// // async function scrapeAndStore(): Promise<void> {
// //   let productsData = (cache.get("priceoye_products") as ProductData[]) ?? null;
// //   if (!productsData) {
// //     console.log("🟡 No cache. Scraping fresh data...");
// //     productsData = await fetchProductsFromHTML();
// //     if (productsData.length === 0) {
// //       console.warn("⚠️ No products found. Check selectors again.");
// //       return;
// //     }
// //     cache.set("priceoye_products", productsData);
// //   } else {
// //     console.log("🟢 Using cached data.");
// //   }
// //   // Save to DB
// //   try {
// //     let category = await prisma.category.findFirst({
// //       where: { name: "Mobiles" },
// //     });
// //     if (!category) {
// //       category = await prisma.category.create({
// //         data: { name: "Mobiles", slug: "mobiles" },
// //       });
// //       console.log("✅ Created category: Mobiles");
// //     }
// //     const categoryId = category.id;
// //     for (const [i, prod] of productsData.entries()) {
// //       console.log(`➡️ [${i + 1}/${productsData.length}] ${prod.name}`);
// //       const existing = await prisma.product.findUnique({
// //         where: { slug: prod.slug },
// //       });
// //       if (existing) {
// //         await prisma.product.update({
// //           where: { id: existing.id },
// //           data: { name: prod.name, price: prod.price, categoryId },
// //         });
// //         await prisma.productImage.deleteMany({
// //           where: { productId: existing.id },
// //         });
// //         if (prod.img) {
// //           await prisma.productImage.create({
// //             data: { url: prod.img, productId: existing.id },
// //           });
// //         }
// //         console.log(`🔄 Updated: ${prod.name}`);
// //       } else {
// //         await prisma.product.create({
// //           data: {
// //             name: prod.name,
// //             slug: prod.slug,
// //             price: prod.price,
// //              quantity: 0,
// //             categoryId,
// //             images: prod.img ? { create: [{ url: prod.img }] } : undefined,
// //           },
// //         });
// //         console.log(`🆕 Created: ${prod.name}`);
// //       }
// //     }
// //     console.log("🎉 Scraping & DB sync complete.");
// //   } catch (err) {
// //     console.error("❌ Database error:", (err as Error).message);
// //   } finally {
// //     await prisma.$disconnect();
// //   }
// // }
// // scrapeAndStore().catch(console.error);
// var axios_1 = require("axios");
// var cheerio = require("cheerio");
// var client_1 = require("@prisma/client");
// var bentocache_1 = require("bentocache");
// var prisma = new client_1.PrismaClient();
// // Initialize BentoCache with memory store
// var bento = new bentocache_1.BentoCache({
//     default: "memory",
//     stores: {
//         memory: (0, bentocache_1.memoryStore)({}),
//     },
// });
// var BASE_URL = "https://priceoye.pk/mobiles";
// function fetchProductsFromHTML() {
//     return __awaiter(this, void 0, void 0, function () {
//         var html, $_1, products_1, error_1;
//         return __generator(this, function (_a) {
//             switch (_a.label) {
//                 case 0:
//                     console.log("🌐 Fetching HTML from PriceOye...");
//                     _a.label = 1;
//                 case 1:
//                     _a.trys.push([1, 3, , 4]);
//                     return [4 /*yield*/, axios_1.default.get(BASE_URL, {
//                             headers: {
//                                 "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
//                             },
//                             timeout: 10000, // 10-second timeout to prevent hanging
//                         })];
//                 case 2:
//                     html = (_a.sent()).data;
//                     console.log("✅ Page fetched. Parsing...");
//                     $_1 = cheerio.load(html);
//                     products_1 = [];
//                     $_1(".productBox").each(function (_, element) {
//                         var $el = $_1(element);
//                         var name = $el.find(".p-title").text().trim();
//                         var priceText = $el.find(".price-box").text().trim();
//                         var price = parseInt(priceText.replace(/[^\d]/g, ""), 10) || 0;
//                         var img = $el.find("amp-img.product-thumbnail").attr("src") || "";
//                         var link = $el.find("a").attr("href") || "";
//                         var slug = $el.attr("data-slug") || "";
//                         if (!name || !slug)
//                             return; // Skip if essential data is missing
//                         products_1.push({ name: name, price: price, img: img, link: link, slug: slug });
//                     });
//                     console.log("\uD83D\uDD0D Found ".concat(products_1.length, " products."));
//                     return [2 /*return*/, products_1];
//                 case 3:
//                     error_1 = _a.sent();
//                     console.error("❌ Fetch error:", error_1.message);
//                     return [2 /*return*/, []];
//                 case 4: return [2 /*return*/];
//             }
//         });
//     });
// }
// // Batch processing to avoid overwhelming the database
// function processProductsInBatches(products_2) {
//     return __awaiter(this, arguments, void 0, function (products, batchSize) {
//         var category, categoryId, _loop_1, i;
//         var _this = this;
//         if (batchSize === void 0) { batchSize = 10; }
//         return __generator(this, function (_a) {
//             switch (_a.label) {
//                 case 0: return [4 /*yield*/, prisma.category.findFirst({
//                         where: { name: "Mobiles" },
//                     })];
//                 case 1:
//                     category = _a.sent();
//                     if (!!category) return [3 /*break*/, 3];
//                     return [4 /*yield*/, prisma.category.create({
//                             data: { name: "Mobiles", slug: "mobiles" },
//                         })];
//                 case 2:
//                     category = _a.sent();
//                     console.log("✅ Created category: Mobiles");
//                     _a.label = 3;
//                 case 3:
//                     categoryId = category.id;
//                     _loop_1 = function (i) {
//                         var batch;
//                         return __generator(this, function (_b) {
//                             switch (_b.label) {
//                                 case 0:
//                                     batch = products.slice(i, i + batchSize);
//                                     console.log("\uD83D\uDCE6 Processing batch ".concat(i / batchSize + 1, " (").concat(batch.length, " products)"));
//                                     return [4 /*yield*/, Promise.all(batch.map(function (prod, index) { return __awaiter(_this, void 0, void 0, function () {
//                                             var existing, err_1;
//                                             return __generator(this, function (_a) {
//                                                 switch (_a.label) {
//                                                     case 0:
//                                                         console.log("\u27A1\uFE0F [".concat(i + index + 1, "/").concat(products.length, "] ").concat(prod.name));
//                                                         _a.label = 1;
//                                                     case 1:
//                                                         _a.trys.push([1, 10, , 11]);
//                                                         return [4 /*yield*/, prisma.product.findUnique({
//                                                                 where: { slug: prod.slug },
//                                                             })];
//                                                     case 2:
//                                                         existing = _a.sent();
//                                                         if (!existing) return [3 /*break*/, 7];
//                                                         // Update existing product
//                                                         return [4 /*yield*/, prisma.product.update({
//                                                                 where: { id: existing.id },
//                                                                 data: { name: prod.name, price: prod.price, categoryId: categoryId },
//                                                             })];
//                                                     case 3:
//                                                         // Update existing product
//                                                         _a.sent();
//                                                         // Update images
//                                                         return [4 /*yield*/, prisma.productImage.deleteMany({
//                                                                 where: { productId: existing.id },
//                                                             })];
//                                                     case 4:
//                                                         // Update images
//                                                         _a.sent();
//                                                         if (!prod.img) return [3 /*break*/, 6];
//                                                         return [4 /*yield*/, prisma.productImage.create({
//                                                                 data: { url: prod.img, productId: existing.id },
//                                                             })];
//                                                     case 5:
//                                                         _a.sent();
//                                                         _a.label = 6;
//                                                     case 6:
//                                                         console.log("\uD83D\uDD04 Updated: ".concat(prod.name));
//                                                         return [3 /*break*/, 9];
//                                                     case 7: 
//                                                     // Create new product
//                                                     return [4 /*yield*/, prisma.product.create({
//                                                             data: {
//                                                                 name: prod.name,
//                                                                 slug: prod.slug,
//                                                                 price: prod.price,
//                                                                 quantity: 0,
//                                                                 categoryId: categoryId,
//                                                                 images: prod.img ? { create: [{ url: prod.img }] } : undefined,
//                                                             },
//                                                         })];
//                                                     case 8:
//                                                         // Create new product
//                                                         _a.sent();
//                                                         console.log("\uD83C\uDD95 Created: ".concat(prod.name));
//                                                         _a.label = 9;
//                                                     case 9: return [3 /*break*/, 11];
//                                                     case 10:
//                                                         err_1 = _a.sent();
//                                                         console.error("\u274C Error processing ".concat(prod.name, ":"), err_1.message);
//                                                         return [3 /*break*/, 11];
//                                                     case 11: return [2 /*return*/];
//                                                 }
//                                             });
//                                         }); }))];
//                                 case 1:
//                                     _b.sent();
//                                     // Add delay to prevent overwhelming the database
//                                     return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
//                                 case 2:
//                                     // Add delay to prevent overwhelming the database
//                                     _b.sent();
//                                     return [2 /*return*/];
//                             }
//                         });
//                     };
//                     i = 0;
//                     _a.label = 4;
//                 case 4:
//                     if (!(i < products.length)) return [3 /*break*/, 7];
//                     return [5 /*yield**/, _loop_1(i)];
//                 case 5:
//                     _a.sent();
//                     _a.label = 6;
//                 case 6:
//                     i += batchSize;
//                     return [3 /*break*/, 4];
//                 case 7: return [2 /*return*/];
//             }
//         });
//     });
// }
// function scrapeAndStore() {
//     return __awaiter(this, void 0, void 0, function () {
//         var productsData, err_2;
//         var _this = this;
//         return __generator(this, function (_a) {
//             switch (_a.label) {
//                 case 0:
//                     _a.trys.push([0, 3, 4, 6]);
//                     return [4 /*yield*/, bento.cache("memory").getOrSet("priceoye_products", function () { return __awaiter(_this, void 0, void 0, function () {
//                             var products;
//                             return __generator(this, function (_a) {
//                                 switch (_a.label) {
//                                     case 0:
//                                         console.log("🟡 No cache. Scraping fresh data...");
//                                         return [4 /*yield*/, fetchProductsFromHTML()];
//                                     case 1:
//                                         products = _a.sent();
//                                         if (products.length === 0) {
//                                             console.warn("⚠️ No products found. Check selectors again.");
//                                             return [2 /*return*/, []];
//                                         }
//                                         return [2 /*return*/, products];
//                                 }
//                             });
//                         }); }, { ttl: 1200 * 1000 } // 20 minutes in milliseconds
//                         )];
//                 case 1:
//                     productsData = _a.sent();
//                     if (productsData.length === 0) {
//                         console.warn("⚠️ No products to process.");
//                         return [2 /*return*/];
//                     }
//                     console.log("🟢 Processing products...");
//                     return [4 /*yield*/, processProductsInBatches(productsData)];
//                 case 2:
//                     _a.sent();
//                     console.log("🎉 Scraping & DB sync complete.");
//                     return [3 /*break*/, 6];
//                 case 3:
//                     err_2 = _a.sent();
//                     console.error("❌ Scrape error:", err_2.message);
//                     return [3 /*break*/, 6];
//                 case 4: return [4 /*yield*/, prisma.$disconnect()];
//                 case 5:
//                     _a.sent();
//                     return [7 /*endfinally*/];
//                 case 6: return [2 /*return*/];
//             }
//         });
//     });
// }
// scrapeAndStore().catch(console.error);
