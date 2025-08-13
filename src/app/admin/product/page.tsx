'use client';

import { useEffect, useState, Component, ReactNode, ErrorInfo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';

// Interfaces
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

// Error Boundary Component
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

export default function AdminProduct() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data?.user?.role !== 'ADMIN') {
          router.push('/');
        }
      })
      .catch(() => {
        toast.error('Failed to verify session. Redirecting...');
        router.push('/');
      });
  }, [router]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(product => product.categoryId === parseInt(selectedCategory));
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      if (!res.ok) throw new Error();
      const data: Product[] = await res.json();
      setProducts(data);
    } catch {
      toast.error('Failed to load products');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      if (!res.ok) throw new Error();
      const data: Category[] = await res.json();
      setCategories(data);
    } catch {
      toast.error('Failed to load categories');
    }
  };

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
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setName('');
        setPrice('');
        setQuantity('');
        setCategoryId('');
        setImages([]);
        setShowAddModal(false);
        fetchProducts();
        toast.success('Product added successfully');
        router.push('/admin/product');
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Failed to add product');
      }
    } catch {
      toast.error('An error occurred while adding the product');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const remainingSlots = 4 - images.length;
      const selectedFiles = Array.from(files).slice(0, remainingSlots);

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

  const handleDelete = async (publicId: string) => {
    try {
      const res = await fetch(`/api/admin/products/${publicId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
        toast.success('Product deleted successfully');
      } else {
        toast.error('Failed to delete product');
      }
    } catch {
      toast.error('An error occurred while deleting the product');
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#18181b' }}>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <h1 className="text-3xl font-bold text-yellow-400 mb-6 text-center">Product Management</h1>

      <div className="mb-6 text-center">
        <Link href="/admin/categories" className="text-yellow-400 hover:text-yellow-300 font-semibold">
          Manage Categories
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="p-3 rounded-lg w-full md:w-1/2"
          style={{ backgroundColor: '#3f3f47', color: 'white', border: '1px solid #555' }}
        />
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="p-3 rounded-lg w-full md:w-1/4"
          style={{ backgroundColor: '#3f3f47', color: 'white', border: '1px solid #555' }}
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
          className="px-6 py-3 rounded-lg transition shadow-md"
          style={{ backgroundColor: '#facc15', color: '#000' }}
        >
          Add Product
        </button>
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="p-6 rounded-xl shadow-lg max-w-2xl w-full" style={{ backgroundColor: '#3f3f47' }}>
            <h2 className="text-xl font-semibold mb-4 text-white">Add Product</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Inputs */}
              <input
                type="text"
                placeholder="Product Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="p-3 rounded-lg"
                style={{ backgroundColor: '#18181b', color: 'white', border: '1px solid #555' }}
                required
              />
              <input
                type="number"
                placeholder="Price"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="p-3 rounded-lg"
                style={{ backgroundColor: '#18181b', color: 'white', border: '1px solid #555' }}
                required
              />
              <input
                type="number"
                placeholder="Quantity"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="p-3 rounded-lg"
                style={{ backgroundColor: '#18181b', color: 'white', border: '1px solid #555' }}
                required
              />
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="p-3 rounded-lg"
                style={{ backgroundColor: '#18181b', color: 'white', border: '1px solid #555' }}
                required
              >
                <option value="">Select Category</option>
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

              {/* Images */}
              <div className="md:col-span-2">
                <input
                  type="file"
                  multiple
                  onChange={handleImageChange}
                  className="p-3 rounded-lg w-full"
                  style={{ backgroundColor: '#18181b', color: 'white', border: '1px solid #555' }}
                  ref={fileInputRef}
                />
                <div className="flex gap-2 mt-2 flex-wrap items-center">
                  {images.map((file, idx) => (
                    <div key={idx} className="relative">
                      <ImageErrorBoundary fallbackSrc="/images/placeholder.jpg">
                        <Image
                          src={URL.createObjectURL(file)}
                          alt="preview"
                          width={80}
                          height={80}
                          className="rounded-lg object-cover"
                        />
                      </ImageErrorBoundary>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-0 right-0 bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="md:col-span-2 flex justify-end gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg transition"
                  style={{ backgroundColor: '#555', color: 'white' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg transition"
                  style={{ backgroundColor: '#facc15', color: '#000' }}
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cards */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Products</h2>
        <div className="space-y-4">
          {filteredProducts.map(product => (
            <div key={product.id} className="flex items-center justify-between p-4 rounded-lg shadow" style={{ backgroundColor: '#3f3f47' }}>
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-white font-semibold">{product.name}</h3>
                  <p className="text-white">Price: ${product.price.toFixed(2)}</p>
                  <p className="text-white">Quantity: {product.quantity}</p>
                </div>
                <div className="flex gap-2">
                  {product.images?.map((img, idx) => (
                    <ImageErrorBoundary key={idx} fallbackSrc="/images/placeholder.jpg">
                      <Image
                        src={img.url}
                        alt={product.name}
                        width={50}
                        height={50}
                        className="rounded-lg object-cover"
                      />
                    </ImageErrorBoundary>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/admin/products/edits/${product.publicId}`}
                  className="px-3 py-1 rounded transition text-sm"
                  style={{ backgroundColor: '#facc15', color: '#000' }}
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(product.publicId)}
                  className="px-3 py-1 rounded transition text-sm"
                  style={{ backgroundColor: '#dc2626', color: 'white' }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}