// 'use client';

// import { useEffect, useState } from 'react';
// import { useSearchParams } from 'next/navigation';

// type Product = {
//   name: string;
// };

// type OrderItem = {
//   id: string;
//   quantity: number;
//   price: number;
//   product: Product;
// };

// type Payment = {
//   method: string;
//   status: string;
// };

// type Order = {
//   publicId: string;
//   items: OrderItem[];
//   payment: Payment;
// };

// export default function SuccessPage() {
//   const searchParams = useSearchParams();
//   const orderId = searchParams.get('order');

//   const [order, setOrder] = useState<Order | null>(null);

//   useEffect(() => {
//     const fetchOrder = async () => {
//       if (orderId) {
//         const res = await fetch(`/api/order/${orderId}`);
//         if (!res.ok) {
//           console.error('Failed to fetch order');
//           return;
//         }
//         const data: Order = await res.json();
//         setOrder(data);
//       }
//     };

//     fetchOrder();
//   }, [orderId]);

//   if (!order) return <p>Loading order details...</p>;

//   const total = order.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

//   return (
//     <div className="max-w-3xl mx-auto p-6">
//       <h1 className="text-2xl font-bold mb-4">🎉 Order Placed Successfully!</h1>
//       <p className="mb-4">
//         Order ID: <strong>{order.publicId}</strong>
//       </p>
//       <p className="mb-4">Payment Method: {order.payment.method}</p>
//       <p className="mb-4">Payment Status: {order.payment.status}</p>
//       <p className="mb-4">Delivery Status: Pending</p>

//       <h2 className="text-xl font-semibold mt-6 mb-2">Items:</h2>
//       <ul className="list-disc list-inside space-y-1">
//         {order.items.map((item) => (
//           <li key={item.id}>
//             {item.quantity} x {item.product.name} – ${item.price.toFixed(2)}
//           </li>
//         ))}
//       </ul>

//       <div className="mt-6 text-lg font-bold">Total: ${total.toFixed(2)}</div>
//     </div>
//   );
// }





















'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

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
  const router = useRouter();
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

  if (!order)
    return (
      <div className="flex justify-center items-center h-screen text-lg text-gray-500">
        Loading order details...
      </div>
    );

  const total = order.items.reduce((sum, item) => sum + item.quantity * item.price, 0);

  const paymentStatusColor =
    order.payment.status.toLowerCase() === 'successful'
      ? 'text-green-600 font-semibold'
      : 'text-yellow-600 font-semibold';

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg mt-8">
      {/* Success header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-green-600 animate-bounce">
          🎉 Order Placed Successfully!
        </h1>
        <p className="text-gray-600 mt-2">Thank you for your purchase.</p>
      </div>

      {/* Order details */}
      <div className="space-y-2">
        <p>
          <span className="font-semibold">Order ID:</span> {order.publicId}
        </p>
        <p>
          <span className="font-semibold">Payment Method:</span> {order.payment.method}
        </p>
        <p>
          <span className="font-semibold">Payment Status:</span>{' '}
          <span className={paymentStatusColor}>{order.payment.status}</span>
        </p>
        <p>
          <span className="font-semibold">Delivery Status:</span> Pending
        </p>
      </div>

      {/* Items list */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Items:</h2>
        <ul className="divide-y divide-gray-200">
          {order.items.map((item) => (
            <li key={item.id} className="py-2 flex justify-between">
              <span>
                {item.quantity} × {item.product.name}
              </span>
              <span>${item.price.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Total */}
      <div className="mt-6 text-lg font-bold border-t pt-4">
        Total: ${total.toFixed(2)}
      </div>

      {/* Continue shopping button */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={() => router.push('/')}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow transition"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
