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
  const params = useParams();
  const publicId = params?.publicId as string | undefined;

  useEffect(() => {
    if (!publicId) {
      toast.error('Invalid or missing product ID');
      router.push('/admin/dashboard');
      return;
    }

    fetch('/api/auth/session', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (!data.user || data.user.role !== 'ADMIN') {
          toast.error('Unauthorized access');
          router.push('/');
        }
      })
      .catch(() => {
        toast.error('Failed to verify session');
        router.push('/');
      });

    fetch(`/api/admin/products/${publicId}`, { credentials: 'include' })
      .then(res => res.json())
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
      .catch(() => {
        toast.error('Failed to load product');
        router.push('/admin/dashboard');
      })
      .finally(() => setLoading(false));

    fetch('/api/admin/categories', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setCategories(data);
        } else {
          toast.error(data.error);
        }
      })
      .catch(() => toast.error('Failed to load categories'));
  }, [publicId, params, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validImages = Array.from(files).filter(
        file => file.type.startsWith('image/') && file.size < 5 * 1024 * 1024
      );
      if (validImages.length !== files.length) {
        toast.error('Some images were invalid or too large (max 5MB).');
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
      const res = await fetch(`/api/admin/products/${publicId}`, {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });

      const result = await res.json();

      if (res.ok) {
        toast.success('Product updated successfully');
        router.push('/admin');
      } else {
        toast.error(result.error || 'Error updating product');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-amber-400">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-900 p-6">
      <h1 className="text-3xl font-bold text-amber-400 mb-6">Edit Product</h1>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-zinc-800/70 p-6 rounded-xl shadow-lg border border-zinc-700"
      >
        <input
          type="text"
          placeholder="Product Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="border border-zinc-700 bg-zinc-900 p-3 rounded text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-amber-400"
          required
        />
        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={e => setPrice(e.target.value)}
          className="border border-zinc-700 bg-zinc-900 p-3 rounded text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-amber-400"
          step="0.01"
          required
        />
        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          className="border border-zinc-700 bg-zinc-900 p-3 rounded text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-amber-400"
          required
        />
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          className="border border-zinc-700 bg-zinc-900 p-3 rounded text-zinc-100 focus:ring-2 focus:ring-amber-400"
          required
        >
          <option value="">Select Category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id} className="bg-zinc-900">
              {cat.name}
            </option>
          ))}
        </select>
        <div className="md:col-span-2">
          <input
            type="file"
            multiple
            onChange={handleImageChange}
            className="border border-zinc-700 bg-zinc-900 p-3 rounded text-zinc-100 w-full"
          />
          <div className="flex gap-2 mt-2 flex-wrap">
            {existingImages.map(img => (
              <div key={img.id} className="relative">
                <Image
                  src={img.url}
                  alt="Existing Image"
                  width={80}
                  height={80}
                  className="rounded object-cover border border-zinc-700"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(img.id)}
                  className="absolute top-0 right-0 bg-red-600 hover:bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center -mt-2 -mr-2"
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
                  className="rounded object-cover border border-zinc-700"
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(idx)}
                  className="absolute top-0 right-0 bg-red-600 hover:bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center -mt-2 -mr-2"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="md:col-span-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-semibold px-6 py-3 rounded-lg transition duration-300 shadow-md disabled:bg-zinc-600"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Product'}
        </button>
      </form>
    </div>
  );
}
