'use client';

import useSWR from 'swr';
import type { Order } from '@/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function OrdersPage() {
  const { data: orders, isLoading } = useSWR<Order[]>('/api/orders', fetcher);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Orders</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : orders?.length ? (
        orders.map((order) => (
          <div key={order.id} className="mb-4 border p-4 rounded">
            <h2 className="text-xl font-semibold">Order #{order.id}</h2>
            <p>Status: {order.status}</p>
            <ul className="ml-4 mt-2 list-disc">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.product.name} - {item.quantity} × ${item.price.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        ))
      ) : (
        <p>No orders found.</p>
      )}
    </div>
  );
}
