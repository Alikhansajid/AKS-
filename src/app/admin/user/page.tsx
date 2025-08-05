'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  publicId: string;
  name: string;
  email: string;
  phone: string;
  role:[ 'ADMIN','CUSTOMER','RIDER'];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json());

export default function AdminUsers() {
  const router = useRouter();
  const { data: users, mutate } = useSWR<User[]>('/api/admin/users', fetcher, { refreshInterval: 5000 });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: 'CUSTOMER' as 'ADMIN' | 'CUSTOMER' });

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        const data = await res.json();
        if (!data.user || data.user.role !== 'ADMIN') {
          toast.error('Unauthorized access');
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        toast.error('Failed to verify session');
        router.push('/');
      }
    }
    checkAdmin();
  }, [router]);

  const updateUser = async (publicId: string) => {
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const res = await fetch(`/api/admin/users/${publicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('User updated successfully');
        mutate(); // Refetch data
        setSelectedUser(null);
        setFormData({ name: '', email: '', phone: '', role: 'CUSTOMER' });
      } else {
        toast.error(data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Something went wrong');
    }
  };

  const deleteUser = async (publicId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const res = await fetch(`/api/admin/users/${publicId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('User deleted successfully');
        mutate(); // Refetch data
      } else {
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Something went wrong');
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setFormData({ name: user.name, email: user.email, phone: user.phone, role: user.role });
  };

  const roleOptions = ['ADMIN', 'CUSTOMER','RIDER'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Manage Users</h1>
      {users ? (
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Created At</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter((user) => !user.deletedAt) // Show only non-deleted users
                  .map((user) => (
                    <tr key={user.publicId} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{user.publicId}</td>
                      <td className="py-3 px-4">{user.name}</td>
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">{user.phone}</td>
                      <td className="py-3 px-4">{user.role}</td>
                      <td className="py-3 px-4">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleEditClick(user)}
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 mr-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteUser(user.publicId)}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {selectedUser && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Edit User</h2>
                <p className="mb-2">User ID: {selectedUser.publicId}</p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'CUSTOMER' })}
                    className="w-full p-2 border rounded"
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setFormData({ name: '', email: '', phone: '', role: 'CUSTOMER' });
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateUser(selectedUser.publicId)}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-gray-500">Loading users...</div>
      )}
    </div>
  );
}