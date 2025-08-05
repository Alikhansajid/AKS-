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

// Define interfaces based on your Prisma schema
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


interface RawProduct {
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
        const res = await fetch('/api/products', {
          headers: { 'Cache-Control': 'no-store' },
        });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const rawData = await res.json();
        console.log('Fetched products raw data:', rawData);
        const apiData: RawProduct[] = Array.isArray(rawData) ? rawData : [];
        const validProducts: Product[] = apiData.map((p) => ({
          id: p.id,
          publicId: p.publicId,
          slug: p.slug,
          name: p.name || 'Unnamed Product',
          price: p.price || 0,
          quantity: p.quantity || 0,
          categoryId: p.categoryId,
          updatedById: p.updatedById,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          deletedAt: p.deletedAt,
          category: p.category || {
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
          },
          images: p.images && Array.isArray(p.images) && p.images.length > 0
            ? p.images.map((img) => ({
                id: img.id,
                url: img.url || '/placeholder.jpg',
                createdAt: img.createdAt,
              }))
            : [{ id: 0, url: '/placeholder.jpg', createdAt: new Date().toISOString() }],
        }));
        console.log('Processed products:', validProducts);
        setProducts(validProducts);
      } catch (error: unknown) {
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

  if (loading) return <div className="p-6 text-center">Loading products...</div>;

  return (
    <div className="bg-blue-50 min-h-screen font-sans">
      <div className="bg-white px-4 py-3 shadow-sm sticky top-[64px] z-40 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="rounded px-4 py-2 border w-full md:w-64 text-black"
          />
          <select
            value={filterCategory}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterCategory(e.target.value)}
            className="rounded px-4 py-2 border text-black"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>
      <section className="flex flex-col items-center justify-center text-center p-8 bg-blue-600 text-white" id="hero">
        <h2 className="text-5xl font-bold mb-4">Discover Amazing Products</h2>
        <p className="text-lg mb-6 max-w-lg">Shop the latest trends and exclusive deals at unbeatable prices.</p>
        <a href="#products" className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition">
          Browse Products
        </a>
      </section>
      <section id="products" className="py-12 px-8 bg-white">
        <h3 className="text-3xl font-bold text-blue-600 text-center mb-8">Featured Products</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div key={product.publicId} className="bg-blue-50 p-4 rounded-lg hover:shadow-lg transition-shadow">
                <div className="h-40 w-full bg-gray-200 mb-4 rounded relative overflow-hidden">
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
                            <div className="relative w-full h-40">
                              <Image
                                src={img.url || '/placeholder.jpg'}
                                alt={product.name}
                                fill
                                className="object-cover rounded"
                                sizes="(max-width: 768px) 100vw, 25vw"
                                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                  e.currentTarget.src = '/placeholder.jpg';
                                  console.log(`Image failed, using placeholder: ${img.url}`);
                                }}
                              />
                            </div>
                          </SwiperSlide>
                        ))}
                      </Swiper>
                      <Swiper
                        onSwiper={(swiper: SwiperInstance) => setThumbsSwiper(swiper)}
                        spaceBetween={10}
                        slidesPerView={4}
                        watchSlidesProgress
                        modules={[Thumbs]}
                        className="thumbs-swiper mt-2"
                      >
                        {product.images.map((img, idx) => (
                          <SwiperSlide key={idx}>
                            <div className="relative w-full h-16">
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
                <h4 className="text-lg font-semibold text-blue-700">{product.name}</h4>
                <p className="text-blue-500 mb-1">${product.price.toFixed(2)}</p>
                <p className="text-sm text-gray-500 mb-2">{product.category.name}</p>
                <Link
                  href={`/product/${product.publicId}`}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors text-sm w-full text-center block"
                >
                  View
                </Link>
              </div>
            ))
          ) : (
            <p className="text-center col-span-full text-gray-500">No products found.</p>
          )}
        </div>
      </section>
      <footer className="bg-blue-800 text-white p-6 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm gap-4">
          <p>© 2025 AKS-Store. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:underline text-blue-200">
              Terms
            </Link>
            <Link href="/privacy" className="hover:underline text-blue-200">
              Privacy
            </Link>
            <Link href="/contact" className="hover:underline text-blue-200">
              Contact
            </Link>
          </div>
        </div>
      </footer>
      <style jsx global>{`
        .main-swiper,
        .thumbs-swiper {
          --swiper-navigation-color: #fff;
          --swiper-navigation-size: 20px;
        }
        .thumbs-swiper .swiper-slide {
          opacity: 0.4;
        }
        .thumbs-swiper .swiper-slide-thumb-active {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}