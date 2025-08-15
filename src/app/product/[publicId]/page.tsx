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
          if (data.images?.length > 0) setActiveThumbIndex(0);
        } else {
          toast.error('Failed to load product');
          router.push('/');
        }
      } catch {
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
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
        toast.error('Failed to load products');
      }
    }

    async function fetchSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.user) setUser(data.user);
      } catch {}
    }

    fetchProduct();
    fetchProducts();
    fetchSession();
  }, [publicId, router]);

  const categories = ['All', ...new Set(products.map((p) => p.category.name))];
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (filterCategory === 'All' || p.category.name === filterCategory)
  );

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
    } catch {
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
      } catch {
        toast.error('Something went wrong');
      }
    }
  };

  const handleEdit = () => router.push(`/admin/products/edits/${product?.publicId}`);

  if (!product) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="bg-neutral-50 min-h-screen font-sans">
      {/* Search + Filter */}
      <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-40 flex flex-wrap gap-3 items-center justify-between">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg px-4 py-2 border border-neutral-300 w-full md:w-64 focus:ring-2 focus:ring-amber-500"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-lg px-4 py-2 border border-neutral-300 focus:ring-2 focus:ring-amber-500"
        >
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* Product Detail */}
      <section className="py-10 px-4 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 bg-white rounded-xl shadow-sm mt-6 p-6">
        <div>
          <div className="relative w-full aspect-square bg-neutral-200 rounded-xl overflow-hidden">
            {product.images.length > 0 ? (
              <Image
                src={product.images[activeThumbIndex].url}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-neutral-400">
                No image
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {product.images.map((img, idx) => (
                <div
                  key={idx}
                  className={`relative w-20 h-20 rounded-lg cursor-pointer overflow-hidden ${
                    activeThumbIndex === idx ? 'ring-2 ring-amber-500' : ''
                  }`}
                  onClick={() => setActiveThumbIndex(idx)}
                >
                  <Image src={img.url} alt="" fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-neutral-800">{product.name}</h1>
          <p className="text-2xl font-semibold text-amber-600">
            ${product.price.toFixed(2)}
          </p>
          <p className="text-neutral-600">Category: {product.category.name}</p>
          <p
            className={`${
              product.quantity > 0 ? 'text-green-600' : 'text-red-600'
            } font-medium`}
          >
            {product.quantity > 0
              ? `In Stock: ${product.quantity}`
              : 'Out of Stock'}
          </p>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAddToCart}
              disabled={product.quantity === 0}
              className="bg-amber-600 text-white px-5 py-2 rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            {user?.role === 'ADMIN' && (
              <>
                <button
                  onClick={handleEdit}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      <section className="py-12 px-6 max-w-7xl mx-auto">
        <h3 className="text-2xl font-bold text-neutral-800 mb-8">
          Related Products
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts
              .filter((p) => p.publicId !== product.publicId)
              .slice(0, 4)
              .map((p) => (
                <div
                  key={p.publicId}
                  className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition"
                >
                  <div className="relative w-full aspect-square bg-neutral-200 rounded-lg overflow-hidden">
                    {p.images.length > 0 ? (
                      <Image
                        src={p.images[0].url}
                        alt={p.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-neutral-400">
                        No image
                      </div>
                    )}
                  </div>
                  <h4 className="mt-3 text-lg font-semibold text-neutral-800">
                    {p.name}
                  </h4>
                  <p className="text-amber-600 font-medium">
                    ${p.price.toFixed(2)}
                  </p>
                  <Link
                    href={`/product/${p.publicId}`}
                    className="mt-2 inline-block bg-amber-600 text-white px-3 py-1 rounded-lg hover:bg-amber-700 text-sm"
                  >
                    View
                  </Link>
                </div>
              ))
          ) : (
            <p className="text-neutral-500">No related products found.</p>
          )}
        </div>
      </section>
    </div>
  );
}
