'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { addToLocalCart } from '@/utils/cart';

interface ProductImage {
  url: string;
}

interface Product {
  publicId: string;
  name: string;
  price: number;
  quantity: number;
  images: ProductImage[];
  category: { name: string };
}

interface User {
  role: 'ADMIN' | 'CUSTOMER';
}

export default function ProductDetail() {
  const [product, setProduct] = useState<Product | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [activeThumbIndex, setActiveThumbIndex] = useState(0);
  const router = useRouter();
  const { publicId } = useParams();

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${publicId}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
          if (data.images && data.images.length > 0) setActiveThumbIndex(0);
        } else {
          toast.error('Failed to load product');
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Something went wrong');
        router.push('/');
      }
    }

    async function fetchProducts() {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (data && typeof data === 'object' && data.message === 'No products found') {
          setProducts([]);
          toast.info('No products found');
        } else {
          console.error('API returned non-array data:', data);
          setProducts([]);
          toast.error('Failed to load product list');
        }
      } catch (error) {
        console.error('Failed to load products:', error);
        setProducts([]);
        toast.error('Failed to load products');
      }
    }

    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      }
    }

    fetchProduct();
    fetchProducts();
    fetchSession();
  }, [publicId, router]);

  const categories = ['All', ...Array.from(new Set(products && Array.isArray(products) ? products.map((p) => p.category.name) : []))];

  const filteredProducts = products && Array.isArray(products)
    ? products.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = filterCategory === 'All' || p.category.name === filterCategory;
        return matchesSearch && matchesCategory;
      })
    : [];

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ publicId: product.publicId, quantity: 1 }),
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.status === 401) {
        addToLocalCart(product, 1);
        toast.info('Added to local cart. Login to sync.');
      } else if (res.ok) {
        toast.success('Added to cart');
      } else {
        const result = await res.json();
        toast.error(result.error || 'Error adding to cart');
      }
    } catch (error) {
      console.error('Cart error:', error);
      toast.error('Something went wrong');
    }
  };

  const handleDelete = async () => {
    if (!product) return;
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        const res = await fetch(`/api/admin/products/${product.publicId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          toast.success('Product deleted');
          router.push('/admin');
        } else {
          const result = await res.json();
          toast.error(result.error || 'Error deleting product');
        }
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Something went wrong');
      }
    }
  };

  const handleEdit = () => {
    router.push(`/admin/products/edits/${product?.publicId}`);
  };

  const handleThumbnailClick = (index: number) => {
    setActiveThumbIndex(index);
  };

  if (!product) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="bg-white min-h-screen font-sans">
      {/* Search and Category */}
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-40 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded px-4 py-2 border w-full md:w-64 text-black"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
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

      {/* Product Detail */}
      <section className="py-8 px-4 grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 max-w-4xl mx-auto">
        <div className="relative w-full h-96 bg-gray-200 rounded overflow-hidden">
          {product.images.length > 0 ? (
            <Image
              src={product.images[activeThumbIndex].url}
              alt={product.name}
              fill
              className="object-cover rounded"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              No image
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-blue-700">{product.name}</h1>
          <p className="text-2xl text-blue-500">${product.price.toFixed(2)}</p>
          <p className="text-gray-500">Category: {product.category.name}</p>
          <p className="text-gray-500">In Stock: {product.quantity}</p>
          <button
            onClick={handleAddToCart}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors duration-300 w-32"
            disabled={product.quantity === 0}
          >
            {product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
          {user?.role === 'ADMIN' && (
            <div className="flex gap-2">
              <button
                onClick={handleEdit}
                className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors duration-300"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors duration-300"
              >
                Delete
              </button>
            </div>
          )}
        </div>
        {/* Thumbnails in a row under main frame */}
        {product.images.length > 1 && (
          <div className="col-span-1 md:col-span-1 mt-4 flex gap-2">
            {product.images.map((img, idx) => (
              <div
                key={idx}
                className={`relative w-20 h-20 bg-gray-200 rounded cursor-pointer ${
                  activeThumbIndex === idx ? 'border-2 border-blue-600' : ''
                }`}
                onClick={() => handleThumbnailClick(idx)}
              >
                <Image
                  src={img.url}
                  alt={`${product.name} thumbnail ${idx + 1}`}
                  fill
                  className="object-cover rounded"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Related Products */}
      <section className="py-12 px-8 bg-blue-50">
        <h3 className="text-3xl font-bold text-blue-600 text-center mb-8">Related Products</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {filteredProducts.length > 0 ? (
            filteredProducts
              .filter((p) => p.publicId !== product.publicId)
              .slice(0, 4)
              .map((p) => (
                <div key={p.publicId} className="bg-white p-4 rounded-lg hover:shadow-lg transition-shadow duration-300">
                  <div className="h-40 w-full bg-gray-200 mb-4 rounded relative overflow-hidden">
                    {p.images.length > 0 ? (
                      <Image
                        src={p.images[0].url}
                        alt={p.name}
                        fill
                        className="object-cover rounded transition-opacity duration-300"
                        sizes="(max-width: 768px) 100vw, 25vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                        No image
                      </div>
                    )}
                  </div>
                  <h4 className="text-lg font-semibold text-blue-700">{p.name}</h4>
                  <p className="text-blue-500 mb-1">${p.price.toFixed(2)}</p>
                  <p className="text-sm text-gray-500 mb-2">{p.category.name}</p>
                  <Link
                    href={`/product/${p.publicId}`}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors duration-300 text-sm"
                  >
                    View
                  </Link>
                </div>
              ))
          ) : (
            <p className="text-center col-span-full text-gray-500">No related products found.</p>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-800 text-white p-6 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm gap-4">
          <p>© 2025 AKS-Store. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:underline text-blue-200 transition-colors duration-300">
              Terms
            </Link>
            <Link href="/privacy" className="hover:underline text-blue-200 transition-colors duration-300">
              Privacy
            </Link>
            <Link href="/contact" className="hover:underline text-blue-200 transition-colors duration-300">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}