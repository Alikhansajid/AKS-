'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-toastify';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs } from 'swiper/modules';
import { Swiper as SwiperInstance } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'react-toastify/dist/ReactToastify.css';

/* ---------- Types ---------- */
interface ProductImage {
  id: number;
  url: string;
  createdAt: string;
}

interface Category {
  id: number;
  publicId: string;
  name: string;
  slug: string;
  parentId: number | null;
  children: Category[];
  updatedById: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface Product {
  id: number;
  publicId: string;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  categoryId: number;
  updatedById: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  category: Category;
  images: ProductImage[];
}

/* Use a type alias instead of an empty interface to avoid ESLint rule errors */
type RawProduct = Product;

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperInstance | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await fetch('/api/products', { headers: { 'Cache-Control': 'no-store' } });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const rawData = await res.json();
        const apiData: RawProduct[] = Array.isArray(rawData) ? (rawData as RawProduct[]) : [];
        const validProducts: Product[] = apiData.map((p) => ({
          ...p,
          name: p.name || 'Unnamed Product',
          price: p.price ?? 0,
          quantity: p.quantity ?? 0,
          category:
            p.category ||
            ({
              id: 0,
              publicId: '',
              name: 'Uncategorized',
              slug: '',
              parentId: null,
              children: [],
              updatedById: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              deletedAt: null,
            } as Category),
          images:
            p.images && Array.isArray(p.images) && p.images.length > 0
              ? p.images.map((img) => ({ ...img, url: img.url || '/placeholder.jpg' }))
              : [{ id: 0, url: '/placeholder.jpg', createdAt: new Date().toISOString() }],
        }));
        setProducts(validProducts);
      } catch (error) {
        console.error('Failed to load products:', error);
        toast.error('Failed to load products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category.name)))];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'All' || product.category.name === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) return <div className="p-6 text-center text-violet-600">Loading products...</div>;

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-900">
      {/* Search & Filter */}
      <div className="bg-white px-4 py-3 shadow-sm sticky top-[64px] z-40 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-200">
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg px-4 py-2 border border-gray-300 bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 w-full md:w-64"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg px-4 py-2 border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
          >
            {categories.map((category) => (
              <option key={category} value={category} className="bg-white">
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/sale" className="text-sm font-medium text-amber-600 hover:underline">
            Sale
          </Link>
          <Link href="/new" className="text-sm text-gray-600 hover:underline">
            New arrivals
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section
        className="flex flex-col items-center justify-center text-center p-12 bg-gradient-to-r from-purple-700 via-purple-600 to-pink-500 text-white"
        id="hero"
      >
        <h2 className="text-5xl font-extrabold mb-4 tracking-tight drop-shadow-lg">Shop with Style — Curated Picks</h2>
        <p className="text-lg mb-6 max-w-xl text-white/90">
          Handpicked products and premium experiences. Fast shipping, honest prices.
        </p>
        <div className="flex gap-3">
          <a href="#products" className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-full font-semibold transition-shadow shadow-md">
            Browse Products
          </a>
          <Link href="/collections" className="px-6 py-3 rounded-full border border-white/30 hover:bg-white/10 transition">
            Collections
          </Link>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-3xl font-bold text-gray-800">Featured Products</h3>
            <p className="text-sm text-gray-500">{filteredProducts.length} items</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product.publicId}
                  className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-lg transition-transform transform hover:-translate-y-1 border border-gray-100"
                >
                  <div className="h-48 w-full bg-gray-100 mb-4 rounded-lg relative overflow-hidden">
                    {product.images.length > 0 ? (
                      <>
                        <Swiper
                          spaceBetween={10}
                          slidesPerView={1}
                          loop
                          navigation
                          modules={[Navigation, Thumbs]}
                          thumbs={{ swiper: thumbsSwiper }}
                          className="main-swiper"
                        >
                          {product.images.map((img, idx) => (
                            <SwiperSlide key={idx}>
                              <div className="relative w-full h-48">
                                <Image
                                  src={img.url || '/placeholder.jpg'}
                                  alt={product.name}
                                  fill
                                  className="object-cover rounded-lg"
                                  sizes="(max-width: 768px) 100vw, 25vw"
                                  onError={() => {
                                    /* Next/Image handles fallback — keep this for debugging if needed */
                                    console.warn('Image load failed, using placeholder');
                                  }}
                                />
                              </div>
                            </SwiperSlide>
                          ))}
                        </Swiper>

                        <Swiper
                          onSwiper={(swiper) => setThumbsSwiper(swiper)}
                          spaceBetween={8}
                          slidesPerView={4}
                          watchSlidesProgress
                          modules={[Thumbs]}
                          className="thumbs-swiper mt-2"
                        >
                          {product.images.map((img, idx) => (
                            <SwiperSlide key={idx}>
                              <div className="relative w-full h-16 rounded overflow-hidden border border-gray-100">
                                <Image
                                  src={img.url || '/placeholder.jpg'}
                                  alt={`${product.name} thumbnail ${idx + 1}`}
                                  fill
                                  className="object-cover rounded cursor-pointer"
                                />
                              </div>
                            </SwiperSlide>
                          ))}
                        </Swiper>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm">No image</div>
                    )}
                  </div>

                  <h4 className="text-lg font-semibold text-gray-800">{product.name}</h4>
                  <p className="text-amber-600 font-bold mb-1">${product.price.toFixed(2)}</p>
                  <p className="text-sm text-gray-500 mb-4">{product.category.name}</p>

                  <div className="flex gap-2">
                    <Link
                      href={`/product/${product.publicId}`}
                      className="flex-1 bg-amber-500 text-white px-3 py-2 rounded-md text-sm font-medium text-center hover:bg-amber-600 transition"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center col-span-full text-gray-500">No products found.</p>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 p-6 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm gap-4">
          <p>© {new Date().getFullYear()} AKS-Store. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="hover:underline">
              Privacy
            </Link>
            <Link href="/contact" className="hover:underline">
              Contact
            </Link>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .main-swiper,
        .thumbs-swiper {
          --swiper-navigation-color: #f59e0b; /* amber */
          --swiper-navigation-size: 18px;
        }
        .thumbs-swiper .swiper-slide {
          opacity: 0.45;
        }
        .thumbs-swiper .swiper-slide-thumb-active {
          opacity: 1;
          transform: scale(1.02);
          transition: transform 120ms ease;
        }
      `}</style>
    </div>
  );
}
