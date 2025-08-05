'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-toastify';

interface Category {
  id: number;
  name: string;
  publicId: string;
  parentId: number | null;
}

interface ProductImage {
  id: number;
  url: string;
  productId: number;
}

export default function EditProduct() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams(); // Get params object
  const publicId = params?.publicId as string | undefined; // Safely access publicId

  useEffect(() => {
    console.log('Params received:', params); // Debug params object
    console.log('Public ID from params:', publicId); // Debug publicId

    if (!publicId) {
      toast.error('Invalid or missing product ID');
      router.push('/admin/dashboard');
      return;
    }

    // Check admin role
    fetch('/api/auth/session', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        console.log('Session data:', data);
        if (!data.user || data.user.role !== 'ADMIN') {
          toast.error('Unauthorized access');
          router.push('/');
        }
      })
      .catch(error => {
        console.error('Error fetching session:', error);
        toast.error('Failed to verify session');
        router.push('/');
      });

    // Fetch product details
    fetch(`/api/admin/products/${publicId}`, { credentials: 'include' })
      .then(res => {
        console.log('Product fetch status:', res.status, res.url); // Debug URL
        return res.json();
      })
      .then(data => {
        if (data.error) {
          toast.error(data.error);
          router.push('/admin/dashboard');
        } else {
          setName(data.name || '');
          setPrice(data.price?.toString() || '');
          setQuantity(data.quantity?.toString() || '');
          setCategoryId(data.categoryId?.toString() || '');
          setExistingImages(data.images || []);
        }
      })
      .catch(error => {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product');
        router.push('/admin/dashboard');
      })
      .finally(() => setLoading(false));

    // Fetch categories
    fetch('/api/admin/categories', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          toast.error(data.error);
        } else {
          setCategories(data);
        }
      })
      .catch(error => {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      });
  }, [publicId, params, router]); // Added params to dependency array

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validImages = Array.from(files).filter(file => file.type.startsWith('image/') && file.size < 5 * 1024 * 1024);
      if (validImages.length !== files.length) {
        toast.error('Some images were invalid or too large (max 5MB). Only valid images are uploaded.');
      }
      setImages(prev => [...prev, ...validImages]);
    }
  };

  const removeExistingImage = (imageId: number) => {
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
    toast.success('Existing image removed');
  };

  const removeNewImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    toast.success('New image removed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicId) {
      toast.error('Cannot update: Invalid product ID');
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    formData.append('quantity', quantity);
    formData.append('categoryId', categoryId);
    images.forEach(file => formData.append('images', file));
    formData.append('existingImages', JSON.stringify(existingImages));

    try {
      console.log('Submitting FormData:', { name, price, quantity, categoryId, images: images.map(f => f.name), existingImages, publicId });
      const res = await fetch(`/api/admin/products/${publicId}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });

      const result = await res.json();
      console.log('PUT response:', res.status, result);

      if (res.ok) {
        toast.success('Product updated successfully');
        router.push('/admin');
      } else {
        toast.error(result.error || 'Error updating product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <h1 className="text-2xl font-bold text-blue-800 mb-6">Edit Product</h1>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-white p-6 rounded-lg shadow-lg"
      >
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
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <div className="md:col-span-2">
          <input
            type="file"
            multiple
            onChange={handleImageChange}
            className="border p-3 rounded text-gray-700 w-full"
          />
          <div className="flex gap-2 mt-2 flex-wrap">
            {existingImages.map(img => (
              <div key={img.id} className="relative">
                <Image
                  src={img.url}
                  alt="Existing Image"
                  width={80}
                  height={80}
                  className="rounded object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(img.id)}
                  className="absolute top-0 right-0 bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center -mt-2 -mr-2"
                >
                  ×
                </button>
              </div>
            ))}
            {images.map((file, idx) => (
              <div key={idx} className="relative">
                <Image
                  src={URL.createObjectURL(file)}
                  alt={`New Image ${idx + 1}`}
                  width={80}
                  height={80}
                  className="rounded object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(idx)}
                  className="absolute top-0 right-0 bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center -mt-2 -mr-2"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="md:col-span-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300 shadow-md disabled:bg-gray-400"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Product'}
        </button>
      </form>
    </div>
  );
}