'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';

interface Order {
  id: number;
  publicId: string;
  userId: number;
  user: { name: string; email: string };
  status: string;
  createdAt: string;
  updatedAt: string;
  items: { productId: number; quantity: number; price: number; product: { name: string } }[];
}

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then((res) => res.json());

export default function AdminOrders() {
  const router = useRouter();
  const { data: orders, mutate } = useSWR<Order[]>('/api/admin/orders', fetcher, { refreshInterval: 5000 });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');

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

  const updateStatus = async (publicId: number) => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }

    try {
      const res = await fetch(`/api/admin/orders/${publicId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Order status updated');
        mutate(); // Refetch data
        setSelectedOrder(null);
        setNewStatus('');
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Something went wrong');
    }
  };

  const statusOptions = ['pending', 'shipped', 'delivered', 'cancelled'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <h1 className="text-3xl font-bold text-blue-800 mb-6">Manage Orders</h1>
      {orders ? (
        <>
          <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
            <table className="min-w-full text-sm text-left text-gray-700">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Created At</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.publicId} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{order.publicId}</td>
                    <td className="py-3 px-4">{order.user.name} ({order.user.email})</td>
                    <td className="py-3 px-4">{order.status}</td>
                    <td className="py-3 px-4">
                      {order.items.map((item, idx) => (
                        <div key={idx}>{item.quantity} x {item.product.name} (${item.price.toFixed(2)})</div>
                      ))}
                    </td>
                    <td className="py-3 px-4">${order.items.reduce((sum, item) => sum + item.quantity * item.price, 0).toFixed(2)}</td>
                    <td className="py-3 px-4">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 mr-2"
                      >
                        Update Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selectedOrder && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">Update Order Status</h2>
                <p className="mb-2">Order ID: {selectedOrder.publicId}</p>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2 border rounded mb-4"
                >
                  <option value="">Select Status</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => { setSelectedOrder(null); setNewStatus(''); }}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => updateStatus(selectedOrder.id)}
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
        <div className="text-center text-gray-500">Loading orders...</div>
      )}
    </div>
  );
}