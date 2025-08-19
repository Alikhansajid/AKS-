'use client';

import { useState, Component, ReactNode, ErrorInfo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import useSWR, { mutate } from 'swr';

// -------- Types --------
interface ProductImage {
  id: number;
  url: string;
  productId: number;
}

interface Product {
  id: number;
  publicId: string;
  name: string;
  price: number;
  quantity: number;
  images: ProductImage[];
  categoryId: number;
}

interface Category {
  id: number;
  publicId: string;
  name: string;
  slug: string;
  parentId: number | null;
  parent: Category | null;
  children: Category[];
  updatedById: number | null;
  updatedBy: { id: number } | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  products: Product[];
}

interface ImageErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ImageErrorBoundaryProps {
  children: ReactNode;
  fallbackSrc: string;
}

// -------- Generic SWR fetcher --------
const jsonFetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed request');
  return res.json();
};

// -------- Error Boundary for Images --------
class ImageErrorBoundary extends Component<ImageErrorBoundaryProps, ImageErrorBoundaryState> {
  state: ImageErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ImageErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Image loading error caught:', error, errorInfo);
    toast.error('Failed to load an image. Using placeholder.');
  }

  render() {
    if (this.state.hasError) {
      return (
        <Image
          src={this.props.fallbackSrc}
          alt="Placeholder"
          width={50}
          height={50}
          className="rounded object-cover"
        />
      );
    }
    return this.props.children;
  }
}

// -------- Main Component --------
export default function AdminProduct() {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ✅ Session check
  const { data: session } = useSWR<{ user?: { role?: string } }>(
    '/api/auth/session',
    jsonFetcher,
    { onError: () => router.push('/') }
  );
  if (session && session.user?.role !== 'ADMIN') router.push('/');

  // ✅ Products & Categories
  const { data: products = [], error: productsError } = useSWR<Product[]>('/api/admin/products', jsonFetcher);
  const { data: categories = [], error: categoriesError } = useSWR<Category[]>('/api/admin/categories', jsonFetcher);

  if (productsError) toast.error('Failed to load products');
  if (categoriesError) toast.error('Failed to load categories');

  // ✅ Filtering
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? product.categoryId === parseInt(selectedCategory) : true;
    return matchesSearch && matchesCategory;
  });

  // ✅ Add product
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (images.length > 4) {
      toast.error('Maximum 4 images allowed.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('quantity', quantity);
    formData.append('categoryId', categoryId);
    images.forEach(file => formData.append('images', file));

    try {
      const res = await fetch('/api/admin/products', { method: 'POST', body: formData });
      if (!res.ok) throw new Error();

      mutate('/api/admin/products'); // ✅ Refresh list
      setName(''); setPrice(''); setQuantity(''); setCategoryId(''); setImages([]);
      setShowAddModal(false);
      toast.success('Product added successfully');
    } catch {
      toast.error('Failed to add product');
    }
  };

  // ✅ Delete product
  const handleDelete = async (publicId: string) => {
    try {
      const res = await fetch(`/api/admin/products/${publicId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      mutate('/api/admin/products'); // ✅ Refresh list
      toast.success('Product deleted successfully');
    } catch {
      toast.error('Failed to delete product');
    }
  };

  // ✅ Image handling
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const remainingSlots = 4 - images.length;
      const selectedFiles = Array.from(e.target.files).slice(0, remainingSlots);
      const validImages = selectedFiles.filter(file => {
        const isValidType = file.type.startsWith('image/');
        const isValidSize = file.size <= 5 * 1024 * 1024;
        if (!isValidType) toast.error(`${file.name} is not a valid image.`);
        if (!isValidSize) toast.error(`${file.name} exceeds 5MB limit.`);
        return isValidType && isValidSize;
      });
      setImages(prev => [...prev, ...validImages].slice(0, 4));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    toast.success('Image removed');
  };

  // -------- UI --------
  return (
    <div className="min-h-screen p-6 bg-zinc-900">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <h1 className="text-3xl font-bold text-amber-400 mb-6 text-center">Product Management</h1>

      <div className="mb-6 text-center">
        <Link href="/admin/categories" className="text-amber-400 hover:text-amber-300 font-semibold">
          Manage Categories
        </Link>
      </div>

      {/* Search + Filter */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="p-3 rounded-lg w-full md:w-1/2 bg-zinc-800 text-white border border-zinc-700"
        />
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="p-3 rounded-lg w-full md:w-1/4 bg-zinc-800 text-white border border-zinc-700"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <optgroup key={cat.publicId} label={cat.name}>
              <option value={cat.id}>{cat.name}</option>
              {cat.children?.map(sub => (
                <option key={sub.publicId} value={sub.id}>
                  &nbsp;&nbsp;{sub.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 rounded-lg shadow-md bg-amber-400 text-black"
        >
          Add Product
        </button>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="p-6 rounded-xl shadow-lg max-w-2xl w-full bg-zinc-800">
            <h2 className="text-xl font-semibold mb-4 text-white">Add Product</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="Product Name" value={name} onChange={e => setName(e.target.value)} className="p-3 rounded-lg bg-zinc-900 text-white border border-zinc-700" required />
              <input type="number" placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} className="p-3 rounded-lg bg-zinc-900 text-white border border-zinc-700" required />
              <input type="number" placeholder="Quantity" value={quantity} onChange={e => setQuantity(e.target.value)} className="p-3 rounded-lg bg-zinc-900 text-white border border-zinc-700" required />
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="p-3 rounded-lg bg-zinc-900 text-white border border-zinc-700" required>
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <optgroup key={cat.publicId} label={cat.name}>
                    <option value={cat.id}>{cat.name}</option>
                    {cat.children?.map(sub => (
                      <option key={sub.publicId} value={sub.id}>&nbsp;&nbsp;{sub.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {/* Images */}
              <div className="md:col-span-2">
                <input type="file" multiple onChange={handleImageChange} ref={fileInputRef} className="p-3 rounded-lg w-full bg-zinc-900 text-white border border-zinc-700" />
                <div className="flex gap-2 mt-2 flex-wrap items-center">
                  {images.map((file, idx) => (
                    <div key={idx} className="relative">
                      <ImageErrorBoundary fallbackSrc="/images/placeholder.jpg">
                        <Image src={URL.createObjectURL(file)} alt="preview" width={80} height={80} className="rounded-lg object-cover" />
                      </ImageErrorBoundary>
                      <button type="button" onClick={() => removeImage(idx)} className="absolute top-0 right-0 bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center">×</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg bg-zinc-600 text-white">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-amber-400 text-black">Add Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Cards */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Products</h2>
        <div className="space-y-4">
          {filteredProducts.map(product => (
            <div key={product.id} className="flex items-center justify-between p-4 rounded-lg shadow bg-zinc-800">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-white font-semibold">{product.name}</h3>
                  <p className="text-white">Price: ${product.price.toFixed(2)}</p>
                  <p className="text-white">Quantity: {product.quantity}</p>
                </div>
                <div className="flex gap-2">
                  {product.images?.map((img, idx) => (
                    <ImageErrorBoundary key={idx} fallbackSrc="/images/placeholder.jpg">
                      <Image src={img.url} alt={product.name} width={50} height={50} className="rounded-lg object-cover" />
                    </ImageErrorBoundary>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/products/edits/${product.publicId}`} className="px-3 py-1 rounded bg-amber-400 text-black text-sm">Edit</Link>
                <button onClick={() => handleDelete(product.publicId)} className="px-3 py-1 rounded bg-red-600 text-white text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
