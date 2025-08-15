'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
  getLocalCart,
  saveLocalCart,
  syncLocalCartToServer,
} from '@/utils/cart';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CartItem {
  id?: number;
  publicId: string;
  quantity: number;
  product: {
    publicId: string;
    name: string;
    price: number;
  };
}

export default function CartPage() {
  const { data: cartData, mutate, isLoading } = useSWR<CartItem[]>('/api/cart', fetcher);
  const [localCart, setLocalCart] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const initializeCart = async () => {
      const local = getLocalCart();
      setLocalCart(local);

      const res = await fetch('/api/me');
      if (res.ok) {
        await syncLocalCartToServer();
        await mutate();
        saveLocalCart([]);
      }

      setHydrated(true);
    };

    initializeCart();
  }, [mutate]);

  const removeItem = async (itemIdOrPublicId: number | string) => {
    if (typeof itemIdOrPublicId === 'number') {
      await fetch(`/api/cart/${itemIdOrPublicId}`, { method: 'DELETE' });
      mutate();
    } else {
      const updatedCart = localCart.filter((item) => item.publicId !== itemIdOrPublicId);
      setLocalCart(updatedCart);
      saveLocalCart(updatedCart);
    }
    toast.success('Item removed');
  };

  const checkout = async () => {
    try {
      const res = await fetch('/api/me', { method: 'GET', credentials: 'include' });
      if (!res.ok) {
        toast.info('Please log in to checkout');
        router.push('/login');
        return;
      }
      router.push('/checkout');
    } catch {
      toast.error('Error during checkout');
    }
  };

  const displayCart = cartData && cartData.length > 0 ? cartData : localCart;
  const total =
    displayCart?.reduce((sum, item) => sum + item.product.price * item.quantity, 0) ?? 0;

  if (!hydrated) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 bg-neutral-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-neutral-800">Your Cart</h1>

      {isLoading ? (
        <p className="text-neutral-500">Loading cart...</p>
      ) : displayCart && displayCart.length > 0 ? (
        <>
          <div className="space-y-4">
            {displayCart.map((item) => (
              <div
                key={`${item.id ?? 'local'}-${item.publicId}`}
                className="bg-white border border-neutral-200 rounded-xl shadow-sm p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <Link
                    href={`/product/${item.product.publicId}`}
                    className="text-amber-600 font-medium hover:underline text-lg"
                  >
                    {item.product.name}
                  </Link>

                  <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-neutral-600">
                    <p>
                      <span className="font-medium text-neutral-800">Price:</span>{' '}
                      ${item.product.price.toFixed(2)}
                    </p>
                    <p>
                      <span className="font-medium text-neutral-800">Quantity:</span>{' '}
                      {item.quantity}
                    </p>
                    <p>
                      <span className="font-medium text-neutral-800">Total:</span>{' '}
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => removeItem(item.id ?? item.publicId)}
                  className="mt-3 sm:mt-0 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-white border border-neutral-200 rounded-xl shadow-sm flex justify-between items-center">
            <p className="text-lg font-semibold text-neutral-800">
              Total: ${total.toFixed(2)}
            </p>
            <button
              onClick={checkout}
              className="bg-amber-600 text-white px-6 py-2 rounded hover:bg-amber-700 transition"
            >
              Checkout
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm">
          <p className="text-neutral-500 mb-4">Your cart is empty.</p>
          <Link
            href="/"
            className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
          >
            Browse products
          </Link>
        </div>
      )}
    </div>
  );
}
