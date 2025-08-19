'use client';

import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';
import { toast } from 'react-toastify';
import { Order, OrderStatus } from '@/types/order';

// ---- Fetchers ----
const fetchOrders = async (url: string): Promise<{ orders: Order[] }> => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to fetch orders');
  }
  return res.json();
};

const updateOrderFetcher = async (
  url: string,
  { arg }: { arg: { orderId: number; status: OrderStatus } }
) => {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(arg),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update order status');
  }
  return res.json();
};

export default function RiderOrdersPage() {
  const router = useRouter();
  const { mutate } = useSWRConfig();

  // Auto-refresh orders every 5 seconds
  const { data, error, isLoading } = useSWR<{ orders: Order[] }>(
    '/api/rider/orders',
    fetchOrders,
    { refreshInterval: 5000 }
  );

  // Mutation hook for updating order status
  const { trigger: updateOrderStatus } = useSWRMutation(
    '/api/rider/orders',
    updateOrderFetcher
  );

  const orders = data?.orders ?? [];

  const handleUpdateStatus = async (orderId: number, status: OrderStatus) => {
    try {
      await mutate(
        '/api/rider/orders',
        async (currentData?: { orders: Order[] }) => {
          await updateOrderStatus({ orderId, status });

          toast.success('Order status updated!');

          if (!currentData) return { orders: [] };

          return {
            orders: currentData.orders.map((order) =>
              order.id === orderId ? { ...order, status } : order
            ),
          };
        },
        { revalidate: false }
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to update order status');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <p className="text-amber-400 text-lg">Loading...</p>
      </div>
    );
  }

  if (error) {
    toast.error(error.message);
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="bg-neutral-800 p-8 rounded-2xl shadow-lg w-full max-w-4xl text-white">
        <h1 className="text-3xl font-bold mb-6 text-center text-amber-400">
          Rider Orders
        </h1>
        {orders.length === 0 ? (
          <p className="text-center text-gray-400">No orders assigned.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.publicId}
                className="p-4 border border-neutral-700 rounded-lg shadow-sm bg-neutral-900"
              >
                <h3 className="text-lg font-semibold text-amber-300">
                  Order #{order.publicId}
                </h3>
                <p>
                  <strong>Customer:</strong> {order.user.name}
                </p>
                <p>
                  <strong>Status:</strong> {order.status}
                </p>
                <p className="text-gray-400">
                  <strong>Created:</strong>{' '}
                  {new Date(order.createdAt).toLocaleString()}
                </p>
                <div className="mt-2">
                  <h4 className="font-medium text-amber-400">Items:</h4>
                  <ul className="list-disc pl-5 text-gray-300">
                    {order.items.map((item) => (
                      <li key={item.id}>
                        {item.product.name} - Quantity: {item.quantity}, Price: $
                        {item.price}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {order.status === OrderStatus.PENDING && (
                    <button
                      onClick={() =>
                        handleUpdateStatus(order.id, OrderStatus.SHIPPED)
                      }
                      className="py-2 px-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      Mark as Shipped
                    </button>
                  )}
                  {order.status === OrderStatus.SHIPPED && (
                    <button
                      onClick={() =>
                        handleUpdateStatus(order.id, OrderStatus.DELIVERED)
                      }
                      className="py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Mark as Delivered
                    </button>
                  )}
                  {order.status !== OrderStatus.CANCELLED &&
                    order.status !== OrderStatus.DELIVERED && (
                      <button
                        onClick={() =>
                          handleUpdateStatus(order.id, OrderStatus.CANCELLED)
                        }
                        className="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Cancel Order
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => router.push('/rider/dashboard')}
          className="mt-6 w-full py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
