'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

interface OrderItem {
  id: number;
  product: { name: string };
  quantity: number;
  price: number;
}

interface User {
  id: number;
  name: string;
}

interface Order {
  id: number;
  publicId: string;
  user: { name: string };
  rider: User | null;
  status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  items: OrderItem[];
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningOrderId, setAssigningOrderId] = useState<number | null>(null);
  const [selectedRider, setSelectedRider] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAdmin();
    fetchData();
  }, [router]);

  const checkAdmin = async () => {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'include' });
      const data = await res.json();
      if (!data.user || data.user.role !== 'ADMIN') {
        toast.error('Unauthorized access');
        router.push('/');
      }
    } catch {
      toast.error('Failed to verify session');
      router.push('/');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, ridersRes] = await Promise.all([
        fetch('/api/admin/orders'),
        fetch('/api/admin/riders'),
      ]);
      if (!ordersRes.ok || !ridersRes.ok) throw new Error('Failed to fetch data');
      const ordersData = await ordersRes.json();
      const ridersData = await ridersRes.json();
      setOrders(ordersData.orders);
      setRiders(ridersData.riders);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const assignOrder = async (orderId: number) => {
    if (!selectedRider) {
      toast.error('Please select a rider');
      return;
    }
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, riderId: selectedRider }),
      });
      if (!res.ok) throw new Error('Failed to assign order');
      toast.success('Order assigned');
      setSelectedRider(null);
      setAssigningOrderId(null);
      await fetchData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error assigning order');
    }
  };

  const updateOrderStatus = async (
    orderId: number,
    status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  ) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast.success('Order status updated');
      await fetchData();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error updating status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#18181b' }}>
        <p className="text-gray-400">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 text-gray-200" style={{ backgroundColor: '#18181b' }}>
      <h1 className="text-3xl font-bold text-amber-500 mb-6">Manage Orders</h1>
      {orders.length === 0 ? (
        <p className="text-center text-gray-400">No orders found.</p>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div
              key={order.publicId}
              className="border border-gray-700 rounded-xl shadow-md p-5"
              style={{ backgroundColor: '#3f3f47' }}
            >
              <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-3">
                <div>
                  <p className="text-sm text-gray-400">Order ID</p>
                  <p className="font-semibold text-gray-100">{order.publicId}</p>
                </div>
                <p className="text-sm text-gray-400">
                  {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Customer</p>
                  <p className="font-medium">{order.user.name}</p>
                </div>
                <div>
                  <p className="text-gray-400">Status</p>
                  <p
                    className={`font-medium ${
                      order.status === 'PENDING'
                        ? 'text-amber-400'
                        : order.status === 'SHIPPED'
                        ? 'text-blue-400'
                        : order.status === 'DELIVERED'
                        ? 'text-green-400'
                        : 'text-red-400'
                    }`}
                  >
                    {order.status}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400">Items</p>
                  <ul className="list-disc list-inside text-gray-300">
                    {order.items.map(item => (
                      <li key={item.id}>
                        {item.product.name} × {item.quantity} — ${item.price}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 items-center">
                {order.rider ? (
                  <>
                    <span className="px-3 py-1 bg-green-700 text-green-200 rounded-full text-xs font-medium">
                      Assigned to {order.rider.name}
                    </span>
                    {order.status !== 'CANCELLED' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                      >
                        Cancel
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <select
                      value={assigningOrderId === order.id ? selectedRider || '' : ''}
                      onChange={(e) => {
                        setAssigningOrderId(order.id);
                        setSelectedRider(Number(e.target.value));
                      }}
                      className="px-3 py-1 border border-gray-600 bg-gray-900 text-gray-200 rounded text-sm"
                    >
                      <option value="">Select Rider</option>
                      {riders.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                    {assigningOrderId === order.id && selectedRider && (
                      <button
                        onClick={() => assignOrder(order.id)}
                        className="px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 text-xs"
                      >
                        Assign
                      </button>
                    )}
                  </>
                )}

                {order.status !== 'DELIVERED' &&
                  order.status !== 'CANCELLED' &&
                  !order.rider && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'SHIPPED')}
                      className="px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 text-xs"
                    >
                      Mark Shipped
                    </button>
                  )}

                {order.status === 'SHIPPED' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => router.push('/admin')}
        className="mt-6 w-full py-2 bg-amber-500 text-white rounded hover:bg-amber-600"
      >
        Back to Admin
      </button>
    </div>
  );
}
