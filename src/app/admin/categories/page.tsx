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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <h1 className="text-3xl font-bold text-blue-800 mb-6 text-center">Manage Categories</h1>
      <div className="mb-6">
        <Link href="/admin/addProduct" className="text-blue-600 hover:text-blue-800 font-semibold">
          Back to 
        </Link>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Confirm Deletion</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this category?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleCancelDelete}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Form */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Add Category</h2>
        <div className="flex gap-4 mb-4">
          <select
            value={selectedCategoryId || ''}
            onChange={e => setSelectedCategoryId(e.target.value || null)}
            className="border p-2 rounded w-1/3 text-gray-700"
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
            onChange={e => selectedCategoryId ? setNewSubcategoryName(e.target.value) : setNewCategoryName(e.target.value)}
            className="border p-2 rounded w-1/3 text-gray-700"
          />
          <button
            onClick={addCategory}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            Add Category
          </button>
        </div>
      </div>

      {/* Categories Table */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Categories</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b">Name</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b">Parent Category</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.publicId} className="hover:bg-gray-50">
                  <td className="py-3 px-4 border-b text-gray-800">
                    {cat.parentId ? `└─ ${cat.name}` : cat.name}
                  </td>
                  <td className="py-3 px-4 border-b text-gray-600">
                    {cat.parent ? cat.parent.name : 'None'}
                  </td>
                  <td className="py-3 px-4 border-b">
                    <button
                      onClick={() => openConfirmModal(cat.publicId)}
                      className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition"
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