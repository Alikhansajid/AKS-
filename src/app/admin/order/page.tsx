'use client';

import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';
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

// ---- Fetchers ----
const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch');
  }
  return res.json();
};

const updateFetcher = async (
  url: string,
  { arg }: { arg: Record<string, unknown> }
) => {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(arg),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const { mutate } = useSWRConfig();

  // Orders + Riders
  const { data: ordersData, error: ordersError, isLoading: ordersLoading } =
    useSWR<{ orders: Order[] }>('/api/admin/orders', fetcher, {
      refreshInterval: 5000, // poll for updates
    });

  const { data: ridersData, error: ridersError, isLoading: ridersLoading } =
    useSWR<{ riders: User[] }>('/api/admin/riders', fetcher);

  // Mutations
  const { trigger: updateOrder } = useSWRMutation(
    '/api/admin/orders',
    updateFetcher
  );

  const { trigger: assignOrderTrigger } = useSWRMutation(
    '/api/admin/orders',
    updateFetcher
  );

  const orders = ordersData?.orders ?? [];
  const riders = ridersData?.riders ?? [];

  const handleAssignOrder = async (orderId: number, riderId: number) => {
    try {
      await assignOrderTrigger({ orderId, riderId });
      toast.success('Order assigned');
      mutate('/api/admin/orders'); // refresh orders
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error assigning');
    }
  };

  const handleUpdateStatus = async (
    orderId: number,
    status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  ) => {
    try {
      await updateOrder({ orderId, status });
      toast.success('Status updated');
      mutate('/api/admin/orders');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error updating');
    }
  };

  if (ordersLoading || ridersLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#18181b' }}
      >
        <p className="text-gray-400">Loading orders...</p>
      </div>
    );
  }

  if (ordersError || ridersError) {
    toast.error('Failed to load data');
    router.push('/');
    return null;
  }

  return (
    <div
      className="min-h-screen p-6 text-gray-200"
      style={{ backgroundColor: '#18181b' }}
    >
      <h1 className="text-3xl font-bold text-amber-500 mb-6">Manage Orders</h1>
      {orders.length === 0 ? (
        <p className="text-center text-gray-400">No orders found.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
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
                    {order.items.map((item) => (
                      <li key={item.id}>
                        {item.product.name} × {item.quantity} — ${item.price}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 items-center">
                {order.rider ? (
                  <span className="px-3 py-1 bg-green-700 text-green-200 rounded-full text-xs font-medium">
                    Assigned to {order.rider.name}
                  </span>
                ) : (
                  <select
                    onChange={(e) =>
                      handleAssignOrder(order.id, Number(e.target.value))
                    }
                    className="px-3 py-1 border border-gray-600 bg-gray-900 text-gray-200 rounded text-sm"
                  >
                    <option value="">Select Rider</option>
                    {riders.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                )}

                {order.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                  >
                    Cancel
                  </button>
                )}

                {order.status === 'PENDING' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}
                    className="px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600 text-xs"
                  >
                    Mark Shipped
                  </button>
                )}

                {order.status === 'SHIPPED' && (
                  <button
                    onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
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
