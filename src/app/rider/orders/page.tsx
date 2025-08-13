'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { Order, OrderStatus } from '@/types/order';

export default function RiderOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/rider/orders', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to fetch orders');
        }
        const data = await res.json();
        setOrders(data.orders);
      } catch (error: unknown) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Failed to load orders');
        }
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [router]);

  const updateOrderStatus = async (orderId: number, status: OrderStatus) => {
    try {
      const res = await fetch('/api/rider/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update order status');
      }
      toast.success('Order status updated!');
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status } : order
      ));
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to update order status');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
        <p className="text-gray-700 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Rider Orders</h1>
        {orders.length === 0 ? (
          <p className="text-center text-gray-500">No orders assigned.</p>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.publicId} className="p-4 border border-gray-200 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800">Order #{order.publicId}</h3>
                <p className="text-gray-700"><strong>Customer:</strong> {order.user.name}</p>
                <p className="text-gray-700"><strong>Status:</strong> {order.status}</p>
                <p className="text-gray-600"><strong>Created:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                <div className="mt-2">
                  <h4 className="font-medium text-gray-800">Items:</h4>
                  <ul className="list-disc pl-5 text-gray-700">
                    {order.items.map(item => (
                      <li key={item.id}>
                        {item.product.name} - Quantity: {item.quantity}, Price: ${item.price}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {order.status === OrderStatus.PENDING && (
                    <button
                      onClick={() => updateOrderStatus(order.id, OrderStatus.SHIPPED)}
                      className="py-2 px-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                    >
                      Mark as Shipped
                    </button>
                  )}
                  {order.status === OrderStatus.SHIPPED && (
                    <button
                      onClick={() => updateOrderStatus(order.id, OrderStatus.DELIVERED)}
                      className="py-2 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Mark as Delivered
                    </button>
                  )}
                  {order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.DELIVERED && (
                    <button
                      onClick={() => updateOrderStatus(order.id, OrderStatus.CANCELLED)}
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
