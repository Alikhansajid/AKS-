'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Dialog, DialogContent } from '@/app/components/ui/dialog';

interface RiderDetails {
  address?: string;
  cnic?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  pendingDetails?: RiderDetails[];
}

interface User {
  id: number;
  publicId: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'ADMIN' | 'CUSTOMER' | 'RIDER';
  details?: RiderDetails;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'admin' | 'customer' | 'rider'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'CUSTOMER' as 'ADMIN' | 'CUSTOMER' | 'RIDER',
  });
  const [showDeletePopup, setShowDeletePopup] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const router = useRouter();

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

    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/users', {
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(data.users || []);
      } catch (error: unknown) {
        if (error instanceof Error) toast.error(error.message);
        else toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [router]);

  const filteredUsers = users.filter(
    (user) =>
      !user.deletedAt &&
      (user.name.toLowerCase().includes(search.toLowerCase()) ||
        (user.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (user.phone ?? '').toLowerCase().includes(search.toLowerCase())) &&
      (filter === 'all' || user.role.toLowerCase() === filter)
  );

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email, // admin should not be able to change this in the UI (read-only)
      phone: user.phone ?? '',
      role: user.role,
    });
  };

  const updateUser = async (publicId: string) => {
    // Ensure selectedUser exists (should always be true when calling)
    if (!selectedUser) {
      toast.error('No user selected');
      return;
    }

    if (!formData.name || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      // Use PUT (server expects PUT). Include email (unchanged) and phone.
      const payload = {
        name: formData.name,
        email: selectedUser.email ?? formData.email, // use the existing email (prevent changing)
        phone: formData.phone,
        role: formData.role,
      };

      const res = await fetch(`/api/admin/users/${publicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('User updated successfully');

        // Update client state using returned data if available; fall back to local formData values
        const updated = {
          ...(data || {}),
          name: payload.name,
          phone: payload.phone,
          role: payload.role,
          email: payload.email,
        } as Partial<User>;

        setUsers((prev) =>
          prev.map((u) => (u.publicId === publicId ? { ...u, ...updated } : u))
        );

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

  const handleDeleteClick = (publicId: string) => {
    setShowDeletePopup(publicId);
  };

  const deleteUser = async (publicId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${publicId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('User deleted successfully');
        setUsers((prev) => prev.filter((u) => u.publicId !== publicId));
      } else {
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Something went wrong');
    } finally {
      setShowDeletePopup(null);
    }
  };

  const handleAction = (userId: number, index: number, action: 'approve' | 'reject') => {
    setSelectedUserId(userId);
    setSelectedIndex(index);
    setAction(action);
    setIsConfirmOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedUserId || selectedIndex === null || !action) return;
    try {
      const res = await fetch(`/api/admin/approve-rider-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, index: selectedIndex, approve: action === 'approve' }),
      });
      if (!res.ok) throw new Error('Action failed');
      toast.success(`Request ${action}ed successfully`);

      // Update local state to remove/approve pending details
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id === selectedUserId) {
            const currentDetails = u.details || {};
            const pending = currentDetails.pendingDetails || [];
            const newPending = [...pending];
            const selected = newPending.splice(selectedIndex, 1)[0];

            let newDetails: RiderDetails | undefined;
            if (action === 'approve') {
              newDetails = {
                address: selected?.address,
                cnic: selected?.cnic,
                vehicleType: selected?.vehicleType,
                vehicleNumber: selected?.vehicleNumber,
                pendingDetails: newPending.length > 0 ? newPending : undefined,
              };
            } else {
              newDetails = {
                ...currentDetails,
                pendingDetails: newPending.length > 0 ? newPending : undefined,
              };
            }
            return { ...u, details: newDetails };
          }
          return u;
        })
      );
    } catch (error: unknown) {
      if (error instanceof Error) toast.error(error.message);
      else toast.error('Action failed');
    } finally {
      setIsConfirmOpen(false);
      setSelectedUserId(null);
      setSelectedIndex(null);
      setAction(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-6">
        <p className="text-center text-amber-300">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-amber-100 p-6">
      <h1 className="text-3xl font-bold text-amber-400 mb-6">Manage Users</h1>

      {users.length === 0 ? (
        <div className="text-center text-zinc-500">No users found.</div>
      ) : (
        <>
          <div className="mb-4 flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="p-2 border border-zinc-700 rounded bg-zinc-800 text-amber-100 placeholder-zinc-500 focus:ring-2 focus:ring-amber-400 outline-none w-full md:w-1/2"
            />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'admin' | 'customer' | 'rider')}
              className="p-2 border border-zinc-700 rounded bg-zinc-800 text-amber-100 focus:ring-2 focus:ring-amber-400 outline-none w-full md:w-1/4"
            >
              <option value="all">All</option>
              <option value="admin">Admin</option>
              <option value="customer">Customer</option>
              <option value="rider">Rider</option>
            </select>
          </div>

          <div className="overflow-x-auto bg-zinc-800/70 rounded-lg shadow-lg border border-zinc-700">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-zinc-700 text-amber-200">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Actions / Pending</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.publicId} className="border-b border-zinc-700 hover:bg-zinc-700/40">
                    <td className="py-3 px-4">{user.name}</td>
                    <td className="py-3 px-4">{user.email}</td>
                    <td className="py-3 px-4">{user.phone ?? '-'}</td>
                    <td className="py-3 px-4">{user.role}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col md:flex-row md:items-center md:gap-2">
                        <div className="flex gap-2 mb-2 md:mb-0">
                          <button
                            onClick={() => handleEditClick(user)}
                            className="bg-amber-500 text-zinc-900 px-3 py-1 rounded hover:bg-amber-400"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user.publicId)}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500"
                          >
                            Delete
                          </button>
                        </div>

                        {/* Pending rider details (if any) */}
                        {user.details?.pendingDetails?.length ? (
                          <div className="mt-2 md:mt-0 space-y-2">
                            {user.details.pendingDetails.map((pending, index) => (
                              <div key={index} className="p-2 bg-amber-900/20 border border-amber-700 rounded">
                                <p className="text-sm"><strong>Pending #{index + 1}:</strong></p>
                                <p className="text-xs"><strong>Address:</strong> {pending.address}</p>
                                <p className="text-xs"><strong>CNIC:</strong> {pending.cnic}</p>
                                <p className="text-xs"><strong>Vehicle:</strong> {pending.vehicleType} / {pending.vehicleNumber}</p>
                                <div className="mt-2 flex gap-2">
                                  <button
                                    onClick={() => handleAction(user.id, index, 'approve')}
                                    className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-500 text-xs"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleAction(user.id, index, 'reject')}
                                    className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-500 text-xs"
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Edit User Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
              <div className="bg-zinc-800 p-6 rounded-lg shadow-lg w-full max-w-md border border-zinc-700">
                <h2 className="text-xl font-semibold text-amber-200 mb-4">Edit User</h2>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-zinc-300">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-zinc-700 rounded bg-zinc-900 text-amber-100 focus:ring-2 focus:ring-amber-400 outline-none"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-zinc-300">Email (cannot change)</label>
                  <input
                    type="email"
                    value={formData.email}
                    readOnly
                    disabled
                    className="w-full p-2 border border-zinc-700 rounded bg-zinc-900 text-zinc-400 cursor-not-allowed"
                    aria-disabled
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-zinc-300">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2 border border-zinc-700 rounded bg-zinc-900 text-amber-100 focus:ring-2 focus:ring-amber-400 outline-none"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-zinc-300">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'CUSTOMER' | 'RIDER' })}
                    className="w-full p-2 border border-zinc-700 rounded bg-zinc-900 text-amber-100 focus:ring-2 focus:ring-amber-400 outline-none"
                  >
                    {['ADMIN', 'CUSTOMER', 'RIDER'].map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setFormData({ name: '', email: '', phone: '', role: 'CUSTOMER' });
                    }}
                    className="bg-zinc-600 text-white px-4 py-2 rounded hover:bg-zinc-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateUser(selectedUser.publicId)}
                    className="bg-amber-500 text-zinc-900 px-4 py-2 rounded hover:bg-amber-400"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation */}
          {showDeletePopup && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
              <div className="bg-zinc-800 p-6 rounded-lg shadow-lg w-full max-w-sm border border-zinc-700">
                <h2 className="text-lg font-semibold text-amber-200 mb-2">Confirm Deletion</h2>
                <p className="mb-4 text-zinc-300">Are you sure you want to delete this user?</p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeletePopup(null)}
                    className="bg-zinc-600 text-white px-4 py-2 rounded hover:bg-zinc-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteUser(showDeletePopup)}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Approve/Reject Confirmation Dialog */}
          <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <DialogContent className="max-w-md bg-zinc-800 border border-zinc-700 text-amber-100">
              <h3 className="text-lg font-semibold mb-4">Confirm Action</h3>
              <p>Are you sure you want to {action} this request?</p>
              <div className="mt-4 space-x-2">
                <button
                  onClick={confirmAction}
                  className="py-2 px-4 bg-green-600 text-white rounded hover:bg-green-500"
                >
                  Yes
                </button>
                <button
                  onClick={() => setIsConfirmOpen(false)}
                  className="py-2 px-4 bg-zinc-600 text-white rounded hover:bg-zinc-500"
                >
                  No
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

      <button
        onClick={() => router.push('/admin')}
        className="mt-4 w-full py-2 bg-amber-500 text-zinc-900 rounded hover:bg-amber-400"
      >
        Back to Admin
      </button>
    </div>
  );
}












