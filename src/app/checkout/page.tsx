'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { toast } from 'react-toastify';
import type { CartItem } from '@/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CheckoutPage() {
  const { data: cartItems } = useSWR<CartItem[]>('/api/cart', fetcher);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const router = useRouter();

  const total =
    cartItems?.reduce((acc, item) => acc + item.quantity * item.product.price, 0) || 0;

  const handleCheckout = async (method: 'COD' | 'card') => {
    if (!cartItems || cartItems.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    setIsPlacingOrder(true);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentMethod: method }),
      });

      const result = await res.json();
      setIsPlacingOrder(false);

      if (res.ok && method === 'COD') {
        toast.success('Order placed with COD');
        router.push('/checkout/success');
      } else if (res.ok && method === 'card' && result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        toast.error(result.error || 'Checkout failed');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Unexpected error occurred.');
      setIsPlacingOrder(false);
    }
  };

  if (!cartItems) return <p>Loading cart...</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Review Your Order</h1>

      {cartItems.length > 0 ? (
        <>
          <ul className="space-y-4">
            {cartItems.map((item) => (
              <li
                key={item.id}
                className="flex justify-between items-center border-b py-2"
              >
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
                <div>${(item.product.price * item.quantity).toFixed(2)}</div>
              </li>
            ))}
          </ul>

          <div className="text-xl font-bold mt-6">
            Total: ${total.toFixed(2)}
          </div>

          <div className="mt-8 flex gap-4">
            <button
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
              onClick={() => handleCheckout('COD')}
              disabled={isPlacingOrder}
            >
              {isPlacingOrder ? '...' : 'COD'}
            </button>

            <button
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
              onClick={() => handleCheckout('card')}
              disabled={isPlacingOrder}
            >
              {isPlacingOrder ? '...' : 'Card Payment'}
            </button>
          </div>
        </>
      ) : (
        <p>Your cart is empty.</p>
      )}
    </div>
  );
}
