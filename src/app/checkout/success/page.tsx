'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type Product = {
  name: string;
};

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product: Product;
};

type Payment = {
  method: string;
  status: string;
};

type Order = {
  publicId: string;
  items: OrderItem[];
  payment: Payment;
};

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');

  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (orderId) {
        const res = await fetch(`/api/order/${orderId}`);
        if (!res.ok) {
          console.error('Failed to fetch order');
          return;
        }
        const data: Order = await res.json();
        setOrder(data);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (!order) return <p>Loading order details...</p>;

  const total = order.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">🎉 Order Placed Successfully!</h1>
      <p className="mb-4">
        Order ID: <strong>{order.publicId}</strong>
      </p>
      <p className="mb-4">Payment Method: {order.payment.method}</p>
      <p className="mb-4">Payment Status: {order.payment.status}</p>
      <p className="mb-4">Delivery Status: Pending</p>

      <h2 className="text-xl font-semibold mt-6 mb-2">Items:</h2>
      <ul className="list-disc list-inside space-y-1">
        {order.items.map((item) => (
          <li key={item.id}>
            {item.quantity} x {item.product.name} – ${item.price.toFixed(2)}
          </li>
        ))}
      </ul>

      <div className="mt-6 text-lg font-bold">Total: ${total.toFixed(2)}</div>
    </div>
  );
}
