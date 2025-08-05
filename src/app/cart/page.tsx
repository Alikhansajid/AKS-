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

      const res = await fetch('/api/me'); // check login status
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
    const res = await fetch('/api/me', {
      method: 'GET',
      credentials: 'include', // this is important for cookies to be sent
    });

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
  const total = displayCart?.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  ) ?? 0;

  if (!hydrated) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Cart</h1>

      {isLoading ? (
        <p>Loading cart...</p>
      ) : displayCart && displayCart.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b-2">
                  <th className="py-2 px-4">Product</th>
                  <th className="py-2 px-4">Price</th>
                  <th className="py-2 px-4">Quantity</th>
                  <th className="py-2 px-4">Total</th>
                  <th className="py-2 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayCart.map((item) => (
                  <tr key={`${item.id ?? 'local'}-${item.publicId}`} className="border-b">
                    <td className="py-3 px-4">
                      <Link href={`/product/${item.product.publicId}`} className="text-blue-600 hover:underline">
                        {item.product.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4">${item.product.price.toFixed(2)}</td>
                    <td className="py-3 px-4">{item.quantity}</td>
                    <td className="py-3 px-4">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => removeItem(item.id ?? item.publicId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}></td>
                  <td className="py-4 px-4 text-xl font-semibold">Total:</td>
                  <td className="py-4 px-4 text-xl font-bold">${total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-6 text-right">
            <button
              onClick={checkout}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            >
              Checkout
            </button>
          </div>
        </>
      ) : (
        <p className="text-gray-600">
          Your cart is empty.{' '}
          <Link href="/" className="text-blue-600 underline">
            Browse products
          </Link>
        </p>
      )}
    </div>
  );
}
