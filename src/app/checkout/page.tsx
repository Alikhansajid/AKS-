'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { toast } from 'react-toastify';
import type { CartItem } from '@/types';

// --- Types ---
interface ShippingDetails {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
}

interface CheckoutArgs {
  method: 'COD' | 'card';
  shippingDetails: ShippingDetails;
}

interface CheckoutResponse {
  success?: boolean;
  paymentUrl?: string;
  error?: string;
  details?: string;
}

// --- Cart fetcher ---
const fetcher = async (url: string): Promise<CartItem[]> => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    const errorData: { error?: string; details?: string } = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.details || 'Failed to fetch cart');
  }
  const data = await res.json();
  return Array.isArray(data) ? (data as CartItem[]) : [];
};

// --- Checkout mutation fetcher (no fetch in component) ---
const checkoutFetcher = async (
  url: string,
  { arg }: { arg: CheckoutArgs }
): Promise<CheckoutResponse> => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      paymentMethod: arg.method,
      shippingDetails: arg.shippingDetails,
      paymentStatus: arg.method === 'COD' ? 'pending' : 'successful',
    }),
  });

  const result: CheckoutResponse = await res.json();
  if (!res.ok) {
    throw new Error(result.error || result.details || 'Checkout failed');
  }
  return result;
};

export default function CheckoutPage() {
  const { data: cartItems, error } = useSWR<CartItem[], Error>('/api/cart', fetcher);

  const { trigger: checkout, isMutating } = useSWRMutation<
    CheckoutResponse,
    Error,
    '/api/checkout',
    CheckoutArgs
  >('/api/checkout', checkoutFetcher);

  const [shippingDetails, setShippingDetails] = useState<ShippingDetails>({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
  });

  const router = useRouter();

  const total =
    cartItems?.reduce((acc, item) => acc + item.quantity * item.product.price, 0) || 0;

  const handleCheckout = async (method: 'COD' | 'card') => {
    if (!cartItems || cartItems.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }

    const { name, address, city, postalCode, phone } = shippingDetails;
    if (!name || !address || !city || !postalCode || !phone) {
      toast.error('Please fill in all shipping details.');
      return;
    }

    try {
      const result = await checkout({ method, shippingDetails });

      if (method === 'COD') {
        toast.success('Order placed with Cash on Delivery (Pending)');
        router.push('/checkout/success');
      } else if (method === 'card' && result.paymentUrl) {
        window.location.href = result.paymentUrl;
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Unexpected error occurred');
      }
    }
  };

  if (error) {
    return <p className="text-center text-red-500">Error: {error.message}</p>;
  }

  if (!cartItems) {
    return <p className="text-center text-gray-500">Loading cart...</p>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-gray-800 text-center">Checkout</h1>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Cart Summary */}
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Your Order</h2>
          {cartItems.length > 0 ? (
            <ul className="space-y-4">
              {cartItems.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between items-center border-b pb-3"
                >
                  <div>
                    <p className="font-medium text-gray-800">{item.product.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-gray-700 font-semibold">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Your cart is empty.</p>
          )}

          <div className="text-xl font-bold mt-6 text-gray-800">
            Total: ${total.toFixed(2)}
          </div>
        </div>

        {/* Shipping Form */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Shipping Details</h2>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={shippingDetails.name}
              onChange={(e) =>
                setShippingDetails({ ...shippingDetails, name: e.target.value })
              }
              className="w-full border rounded px-4 py-2"
            />
            <input
              type="text"
              placeholder="Address"
              value={shippingDetails.address}
              onChange={(e) =>
                setShippingDetails({ ...shippingDetails, address: e.target.value })
              }
              className="w-full border rounded px-4 py-2"
            />
            <input
              type="text"
              placeholder="City"
              value={shippingDetails.city}
              onChange={(e) =>
                setShippingDetails({ ...shippingDetails, city: e.target.value })
              }
              className="w-full border rounded px-4 py-2"
            />
            <input
              type="text"
              placeholder="Postal Code"
              value={shippingDetails.postalCode}
              onChange={(e) =>
                setShippingDetails({ ...shippingDetails, postalCode: e.target.value })
              }
              className="w-full border rounded px-4 py-2"
            />
            <input
              type="text"
              placeholder="Phone Number"
              value={shippingDetails.phone}
              onChange={(e) =>
                setShippingDetails({ ...shippingDetails, phone: e.target.value })
              }
              className="w-full border rounded px-4 py-2"
            />
          </div>

          {/* Payment Buttons */}
          <div className="mt-6 flex gap-4">
            <button
              className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700 transition w-full"
              onClick={() => handleCheckout('COD')}
              disabled={isMutating}
            >
              {isMutating ? 'Processing...' : 'Cash on Delivery'}
            </button>
            <button
              className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700 transition w-full"
              onClick={() => handleCheckout('card')}
              disabled={isMutating}
            >
              {isMutating ? 'Processing...' : 'Card Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
