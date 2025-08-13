'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import Link from 'next/link';

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
  products: [];
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const router = useRouter();

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

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories');
      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const addCategory = async () => {
    if (!newCategoryName && !newSubcategoryName) {
      toast.error('Please enter a category or subcategory name');
      return;
    }
    const nameToUse = selectedCategoryId ? newSubcategoryName : newCategoryName;
    if (!nameToUse) {
      toast.error('Please enter a name for the category or subcategory');
      return;
    }

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nameToUse, parentId: selectedCategoryId }),
      });
      if (res.ok) {
        setNewCategoryName('');
        setNewSubcategoryName('');
        setSelectedCategoryId(null);
        fetchCategories();
        toast.success(`${selectedCategoryId ? 'Subcategory' : 'Category'} added successfully`);
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Failed to add category');
      }
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('An error occurred while adding the category');
    }
  };

  const removeCategory = async (publicId: string) => {
    try {
      const res = await fetch(`/api/admin/categories/${publicId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        fetchCategories();
        toast.success('Category deleted successfully');
      } else {
        toast.error(data.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error removing category:', error);
      toast.error('An error occurred while deleting the category');
    }
  };

  const openConfirmModal = (publicId: string) => {
    setCategoryToDelete(publicId);
    setShowConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    if (categoryToDelete) {
      await removeCategory(categoryToDelete);
    }
    setShowConfirmModal(false);
    setCategoryToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setCategoryToDelete(null);
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#18181b' }}>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

      <h1 className="text-3xl font-bold text-yellow-400 mb-6 text-center">
        Manage Categories
      </h1>

      <div className="mb-6 text-center">
        <Link
          href="/admin/product"
          className="text-yellow-400 hover:text-yellow-300 font-semibold"
        >
          ← Back to products
        </Link>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="p-6 rounded-xl shadow-lg max-w-sm w-full" style={{ backgroundColor: '#3f3f47' }}>
            <h2 className="text-lg font-semibold text-white mb-4">Confirm Deletion</h2>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this category?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleCancelDelete}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Form */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-xl font-semibold text-yellow-400 mb-4">Add Category</h2>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <select
            value={selectedCategoryId || ''}
            onChange={e => setSelectedCategoryId(e.target.value || null)}
            className="border border-gray-600 rounded-lg p-2 w-full md:w-1/3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            style={{ backgroundColor: '#3f3f47' }}
          >
            <option value="">Add to Main Category</option>
            {categories
              .filter(cat => !cat.parentId)
              .map(cat => (
                <option key={cat.publicId} value={cat.publicId}>
                  {cat.name}
                </option>
              ))}
          </select>
          <input
            type="text"
            placeholder={selectedCategoryId ? 'New Subcategory Name' : 'New Category Name'}
            value={selectedCategoryId ? newSubcategoryName : newCategoryName}
            onChange={e =>
              selectedCategoryId
                ? setNewSubcategoryName(e.target.value)
                : setNewCategoryName(e.target.value)
            }
            className="border border-gray-600 rounded-lg p-2 w-full md:w-1/3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            style={{ backgroundColor: '#3f3f47' }}
          />
          <button
            onClick={addCategory}
            className="bg-yellow-600 text-black px-4 py-2 rounded-lg hover:bg-yellow-700 transition"
          >
            Add Category
          </button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-yellow-400 mb-4">Categories</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-700 border border-gray-600 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-800">
                <th className="text-left py-3 px-4 font-semibold text-yellow-400 border-b border-gray-600">
                  Name
                </th>
                <th className="text-left py-3 px-4 font-semibold text-yellow-400 border-b border-gray-600">
                  Parent Category
                </th>
                <th className="text-left py-3 px-4 font-semibold text-yellow-400 border-b border-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.publicId} className="hover:bg-gray-600">
                  <td className="py-3 px-4 border-b border-gray-600 text-white">
                    {cat.parentId ? `└─ ${cat.name}` : cat.name}
                  </td>
                  <td className="py-3 px-4 border-b border-gray-600 text-gray-300">
                    {cat.parent ? cat.parent.name : 'None'}
                  </td>
                  <td className="py-3 px-4 border-b border-gray-600">
                    <button
                      onClick={() => openConfirmModal(cat.publicId)}
                      className="bg-red-600 text-white px-2 py-1 rounded-lg hover:bg-red-700 transition"
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