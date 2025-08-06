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
          onError={() => console.error('Placeholder image failed to load')}
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

  // Check admin access
  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => {
        if (data.user?.role !== 'ADMIN') {
          router.push('/');
        }
      })
      .catch(error => {
        console.error('Error fetching session:', error);
        toast.error('Failed to verify session. Redirecting...');
        router.push('/');
      });
  }, [router]);

  // Fetch products and categories
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Filter products based on search and category
  useEffect(() => {
    let filtered = products;

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(product =>
        product.categoryId === parseInt(selectedCategory)
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      if (!res.ok) throw new Error('Failed to fetch products');
      const data: Product[] = await res.json();
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data: Category[] = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
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
        if (res.status === 500) {
          toast.error('Server failed to process images. Please try again or upload different images.');
        } else {
          toast.error(errorData.error || 'Failed to add product');
        }
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('An error occurred while adding the product');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const currentImageCount = images.length;
      if (currentImageCount >= 4) {
        toast.error('Maximum 4 images allowed.');
        return;
      }

      const remainingSlots = 4 - currentImageCount;
      const selectedFiles = Array.from(files).slice(0, remainingSlots);

      const validImages = selectedFiles.filter(file => {
        const isValidType = file.type.startsWith('image/');
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
        if (!isValidType) toast.error(`Image ${file.name} is not a valid image type.`);
        if (!isValidSize) toast.error(`Image ${file.name} exceeds 5MB limit.`);
        return isValidType && isValidSize;
      });

      if (validImages.length !== selectedFiles.length) {
        toast.error('Some images were invalid or too large. Only valid images are uploaded.');
      }

      setImages(prev => [...prev, ...validImages].slice(0, 4));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    toast.success('Image removed');
  };

  const handleDelete = async (publicId: string) => {
    try {
      const res = await fetch(`/api/admin/products/${publicId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchProducts();
        toast.success('Product deleted successfully');
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('An error occurred while deleting the product');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <h1 className="text-3xl font-bold text-blue-800 mb-6 text-center">Product Management</h1>
      <div className="mb-6">
        <Link href="/admin/categories" className="text-blue-600 hover:text-blue-800 font-semibold">
          Manage Categories
        </Link>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search products by name..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="border p-3 rounded text-gray-700 focus:ring-2 focus:ring-blue-500 w-full md:w-1/2"
        />
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="border p-3 rounded text-gray-700 focus:ring-2 focus:ring-blue-500 w-full md:w-1/4"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <optgroup key={cat.publicId} label={cat.name}>
              <option value={cat.id}>{cat.name}</option>
              {cat.children.map(sub => (
                <option key={sub.publicId} value={sub.id}>
                  &nbsp;&nbsp;{sub.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md"
        >
          Add Product
        </button>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Add Product</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Product Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="border p-3 rounded text-gray-700 focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="number"
                placeholder="Price"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="border p-3 rounded text-gray-700 focus:ring-2 focus:ring-blue-500"
                step="0.01"
                required
              />
              <input
                type="number"
                placeholder="Quantity"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className="border p-3 rounded text-gray-700 focus:ring-2 focus:ring-blue-500"
                required
              />
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="border p-3 rounded text-gray-700 focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <optgroup key={cat.publicId} label={cat.name}>
                    <option value={cat.id}>{cat.name}</option>
                    {cat.children.map(sub => (
                      <option key={sub.publicId} value={sub.id}>
                        &nbsp;&nbsp;{sub.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="md:col-span-2">
                <input
                  type="file"
                  multiple
                  onChange={handleImageChange}
                  className="border p-3 rounded text-gray-700 w-full"
                  ref={fileInputRef}
                />
                <div className="flex gap-2 mt-2 flex-wrap items-center">
                  {images.map((file, idx) => (
                    <div key={idx} className="relative">
                      <ImageErrorBoundary fallbackSrc="/images/placeholder.jpg">
                        <Image
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${idx + 1}`}
                          width={80}
                          height={80}
                          className="rounded object-cover"
                        />
                      </ImageErrorBoundary>
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-0 right-0 bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center -mt-2 -mr-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {(images.length > 0 && images.length < 4) && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-gray-200 text-gray-700 w-20 h-20 rounded flex items-center justify-center hover:bg-gray-300 transition"
                    >
                      +
                    </button>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setName('');
                    setPrice('');
                    setQuantity('');
                    setCategoryId('');
                    setImages([]);
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Products</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 border-b text-left text-gray-700 font-semibold">Name</th>
                <th className="py-3 px-4 border-b text-left text-gray-700 font-semibold">Price</th>
                <th className="py-3 px-4 border-b text-left text-gray-700 font-semibold">Quantity</th>
                <th className="py-3 px-4 border-b text-left text-gray-700 font-semibold">Images</th>
                <th className="py-3 px-4 border-b text-left text-gray-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b text-gray-800">{product.name}</td>
                  <td className="py-3 px-4 border-b text-gray-600">${product.price.toFixed(2)}</td>
                  <td className="py-3 px-4 border-b text-gray-600">{product.quantity}</td>
                  <td className="py-3 px-4 border-b">
                    <div className="flex gap-2 overflow-x-auto">
                      {product.images.map((img, idx) => (
                        <ImageErrorBoundary key={idx} fallbackSrc="/images/placeholder.jpg">
                          <Image
                            src={img.url}
                            alt={product.name}
                            width={50}
                            height={50}
                            className="rounded object-cover"
                            onError={() => toast.error(`Failed to load image: ${img.url}`)}
                          />
                        </ImageErrorBoundary>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 border-b">
                    <Link
                      href={`/admin/products/edits/${product.publicId}`}
                      className="bg-blue-600 text-white px-2 py-1 rounded mr-2 hover:bg-blue-700 transition-colors text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(product.publicId)}
                      className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}