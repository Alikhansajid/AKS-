// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { toast } from 'react-toastify';
// import useSWRMutation from 'swr/mutation';
// import {
//   getLocalCart,
//   saveLocalCart,
//   type LocalCartItem,
// } from '@/utils/cart';

// interface LoginUserArgs {
//   email: string;
//   password: string;
//   localCart: LocalCartItem[];
// }

// const loginUser = async (
//   url: string,
//   { arg }: { arg: LoginUserArgs }
// ) => {
//   const res = await fetch(url, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(arg),
//   });

//   if (!res.ok) {
//     const err = await res.json();
//     throw new Error(err.error || 'Customer login failed');
//   }

//   return res.json();
// };

// const loginAdmin = async (
//   url: string,
//   { arg }: { arg: { adminKey: string } }
// ) => {
//   const res = await fetch(url, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(arg),
//   });

//   if (!res.ok) {
//     const err = await res.json();
//     throw new Error(err.error || 'Admin login failed');
//   }

//   return res.json();
// };

// export default function LoginPage() {
//   const [mode, setMode] = useState<'CUSTOMER' | 'ADMIN'>('CUSTOMER');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [adminKey, setAdminKey] = useState('');
//   const router = useRouter();

//   const {
//     trigger: triggerUser,
//     isMutating: loggingInUser,
//   } = useSWRMutation('/api/auth/login', loginUser);

//   const {
//     trigger: triggerAdmin,
//     isMutating: loggingInAdmin,
//   } = useSWRMutation('/api/auth/admin-login', loginAdmin);

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();

//     try {
//       if (mode === 'CUSTOMER') {
//         const localCart = getLocalCart();

//         await triggerUser({ email, password, localCart });

//         saveLocalCart([]); // Clear cart after sync
//         toast.success('Logged in!');
//         router.push('/');
//       } else {
//         await triggerAdmin({ adminKey });
//         toast.success('Admin logged in');
//         router.push('/admin');
//       }
//     } catch (error: unknown) {
//   if (error instanceof Error) {
//     toast.error(error.message);
//   } else {
//     toast.error('Login failed');
//   }
// }

//   };

//   return (
//     <div className="min-h-screen bg-blue-600 flex items-center justify-center p-4">
//       <form
//         onSubmit={handleLogin}
//         className="bg-white p-8 rounded shadow w-full max-w-md"
//       >
//         <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

//         {/* Mode Toggle */}
//         <div className="flex mb-6 justify-center">
//           <div className="inline-flex bg-gray-200 rounded-full p-1">
//             <button
//               type="button"
//               className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${
//                 mode === 'CUSTOMER' ? 'bg-white shadow' : ''
//               }`}
//               onClick={() => setMode('CUSTOMER')}
//             >
//               Customer
//             </button>
//             <button
//               type="button"
//               className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${
//                 mode === 'ADMIN' ? 'bg-white shadow' : ''
//               }`}
//               onClick={() => setMode('ADMIN')}
//             >
//               Admin
//             </button>
//           </div>
//         </div>

//         {/* Fields */}
//         {mode === 'CUSTOMER' ? (
//           <>
//             <label
//               htmlFor="email"
//               className="block mb-1 text-sm font-medium"
//             >
//               Email
//             </label>
//             <input
//               id="email"
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//               className="w-full p-2 border rounded mb-4"
//               placeholder="e.g. user@example.com"
//             />

//             <label
//               htmlFor="password"
//               className="block mb-1 text-sm font-medium"
//             >
//               Password
//             </label>
//             <input
//               id="password"
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//               className="w-full p-2 border rounded mb-4"
//               placeholder="Your password"
//             />
//           </>
//         ) : (
//           <>
//             <label
//               htmlFor="adminKey"
//               className="block mb-1 text-sm font-medium"
//             >
//               Admin Key
//             </label>
//             <input
//               id="adminKey"
//               type="password"
//               value={adminKey}
//               onChange={(e) => setAdminKey(e.target.value)}
//               required
//               className="w-full p-2 border rounded mb-4"
//               placeholder="Enter Admin Key"
//             />
//           </>
//         )}

//         <button
//           type="submit"
//           disabled={loggingInUser || loggingInAdmin}
//           className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
//         >
//           {mode === 'CUSTOMER'
//             ? loggingInUser
//               ? 'Logging in...'
//               : 'Login as Customer'
//             : loggingInAdmin
//             ? 'Logging in...'
//             : 'Login as Admin'}
//         </button>

//         <p className="mt-4 text-blue-600 text-center">
//           Don&apos;t have an account?{' '}
//           <a href="/signup" className="underline">
//             Signup
//           </a>
//         </p>
//       </form>
//     </div>
//   );
// }










// 'use client';

// import { useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { toast } from 'react-toastify';
// import useSWRMutation from 'swr/mutation';
// import {
//   getLocalCart,
//   saveLocalCart,
//   type LocalCartItem,
// } from '@/utils/cart';

// interface LoginUserArgs {
//   email: string;
//   password: string;
//   localCart: LocalCartItem[];
// }

// const loginUser = async (
//   url: string,
//   { arg }: { arg: LoginUserArgs }
// ) => {
//   const res = await fetch(url, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(arg),
//   });

//   if (!res.ok) {
//     const err = await res.json();
//     throw new Error(err.error || 'Customer login failed');
//   }

//   return res.json();
// };

// const loginAdmin = async (
//   url: string,
//   { arg }: { arg: { adminKey: string } }
// ) => {
//   const res = await fetch(url, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(arg),
//   });

//   if (!res.ok) {
//     const err = await res.json();
//     throw new Error(err.error || 'Admin login failed');
//   }

//   return res.json();
// };

// export default function LoginPage() {
//   const [mode, setMode] = useState<'CUSTOMER' | 'ADMIN'>('CUSTOMER');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [adminKey, setAdminKey] = useState('');
//   const router = useRouter();

//   const {
//     trigger: triggerUser,
//     isMutating: loggingInUser,
//   } = useSWRMutation('/api/auth/login', loginUser);

//   const {
//     trigger: triggerAdmin,
//     isMutating: loggingInAdmin,
//   } = useSWRMutation('/api/auth/admin-login', loginAdmin);

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();

//     try {
//       if (mode === 'CUSTOMER') {
//         const localCart = getLocalCart();
//         const response = await triggerUser({ email, password, localCart });
//         saveLocalCart([]); // Clear cart after sync
//         toast.success('Logged in!');
//         router.push(response.redirect || '/'); // Use redirect from API response, fallback to '/'
//       } else {
//         await triggerAdmin({ adminKey });
//         toast.success('Admin logged in');
//         router.push('/admin');
//       }
//     } catch (error: unknown) {
//       if (error instanceof Error) {
//         toast.error(error.message);
//       } else {
//         toast.error('Login failed');
//       }
//     }
//   };

//   return (
//     <div className="min-h-screen bg-blue-600 flex items-center justify-center p-4">
//       <form
//         onSubmit={handleLogin}
//         className="bg-white p-8 rounded shadow w-full max-w-md"
//       >
//         <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

//         {/* Mode Toggle */}
//         <div className="flex mb-6 justify-center">
//           <div className="inline-flex bg-gray-200 rounded-full p-1">
//             <button
//               type="button"
//               className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${
//                 mode === 'CUSTOMER' ? 'bg-white shadow' : ''
//               }`}
//               onClick={() => setMode('CUSTOMER')}
//             >
//               Customer
//             </button>
//             <button
//               type="button"
//               className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${
//                 mode === 'ADMIN' ? 'bg-white shadow' : ''
//               }`}
//               onClick={() => setMode('ADMIN')}
//             >
//               Admin
//             </button>
//           </div>
//         </div>

//         {/* Fields */}
//         {mode === 'CUSTOMER' ? (
//           <>
//             <label
//               htmlFor="email"
//               className="block mb-1 text-sm font-medium"
//             >
//               Email
//             </label>
//             <input
//               id="email"
//               type="email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               required
//               className="w-full p-2 border rounded mb-4"
//               placeholder="e.g. user@example.com"
//             />

//             <label
//               htmlFor="password"
//               className="block mb-1 text-sm font-medium"
//             >
//               Password
//             </label>
//             <input
//               id="password"
//               type="password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//               className="w-full p-2 border rounded mb-4"
//               placeholder="Your password"
//             />
//           </>
//         ) : (
//           <>
//             <label
//               htmlFor="adminKey"
//               className="block mb-1 text-sm font-medium"
//             >
//               Admin Key
//             </label>
//             <input
//               id="adminKey"
//               type="password"
//               value={adminKey}
//               onChange={(e) => setAdminKey(e.target.value)}
//               required
//               className="w-full p-2 border rounded mb-4"
//               placeholder="Enter Admin Key"
//             />
//           </>
//         )}

//         <button
//           type="submit"
//           disabled={loggingInUser || loggingInAdmin}
//           className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
//         >
//           {mode === 'CUSTOMER'
//             ? loggingInUser
//               ? 'Logging in...'
//               : 'Login as Customer'
//             : loggingInAdmin
//             ? 'Logging in...'
//             : 'Login as Admin'}
//         </button>

//         <p className="mt-4 text-blue-600 text-center">
//           Don&apos;t have an account?{' '}
//           <a href="/signup" className="underline">
//             Signup
//           </a>
//         </p>
//       </form>
//     </div>
//   );
// }













































'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import useSWRMutation from 'swr/mutation';
import { getLocalCart, saveLocalCart, type LocalCartItem } from '@/utils/cart';

interface LoginUserArgs {
  email: string;
  password: string;
  localCart: LocalCartItem[];
}

const loginUser = async (
  url: string,
  { arg }: { arg: LoginUserArgs }
) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Customer login failed');
  }

  return res.json();
};

const loginAdmin = async (
  url: string,
  { arg }: { arg: { adminKey: string } }
) => {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Admin login failed');
  }

  return res.json();
};

export default function LoginPage() {
  const [mode, setMode] = useState<'CUSTOMER' | 'ADMIN'>('CUSTOMER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const router = useRouter();

  const { trigger: triggerUser, isMutating: loggingInUser } =
    useSWRMutation('/api/auth/login', loginUser);

  const { trigger: triggerAdmin, isMutating: loggingInAdmin } =
    useSWRMutation('/api/auth/admin-login', loginAdmin);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (mode === 'CUSTOMER') {
        const localCart = getLocalCart();
        const response = await triggerUser({ email, password, localCart });
        saveLocalCart([]);
        toast.success('Logged in!');
        router.push(response.redirect || '/');
      } else {
        await triggerAdmin({ adminKey });
        toast.success('Admin logged in');
        router.push('/admin');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <form
        onSubmit={handleLogin}
        className="bg-zinc-800/70 border border-zinc-700 p-8 rounded-xl shadow-lg w-full max-w-md"
      >
        <h1 className="text-3xl font-bold mb-6 text-center text-amber-400">Login</h1>

        {/* Mode Toggle */}
        <div className="flex mb-6 justify-center">
          <div className="inline-flex bg-zinc-700 rounded-full p-1">
            <button
              type="button"
              className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${
                mode === 'CUSTOMER'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-amber-300 hover:text-amber-200'
              }`}
              onClick={() => setMode('CUSTOMER')}
            >
              Customer
            </button>
            <button
              type="button"
              className={`px-4 py-1 rounded-full text-sm font-medium transition-all ${
                mode === 'ADMIN'
                  ? 'bg-amber-500 text-black shadow'
                  : 'text-amber-300 hover:text-amber-200'
              }`}
              onClick={() => setMode('ADMIN')}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Fields */}
        {mode === 'CUSTOMER' ? (
          <>
            <label htmlFor="email" className="block mb-1 text-sm font-medium text-amber-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 border border-zinc-600 rounded bg-zinc-900 text-zinc-100 mb-4 focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="e.g. user@example.com"
            />

            <label htmlFor="password" className="block mb-1 text-sm font-medium text-amber-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-2 border border-zinc-600 rounded bg-zinc-900 text-zinc-100 mb-4 focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Your password"
            />
          </>
        ) : (
          <>
            <label htmlFor="adminKey" className="block mb-1 text-sm font-medium text-amber-300">
              Admin Key
            </label>
            <input
              id="adminKey"
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              required
              className="w-full p-2 border border-zinc-600 rounded bg-zinc-900 text-zinc-100 mb-4 focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="Enter Admin Key"
            />
          </>
        )}

        <button
          type="submit"
          disabled={loggingInUser || loggingInAdmin}
          className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded transition-colors disabled:opacity-50"
        >
          {mode === 'CUSTOMER'
            ? loggingInUser
              ? 'Logging in...'
              : 'Login as Customer'
            : loggingInAdmin
            ? 'Logging in...'
            : 'Login as Admin'}
        </button>

        <p className="mt-4 text-center text-zinc-400">
          Don&apos;t have an account?{' '}
          <a href="/signup" className="text-amber-400 hover:underline">
            Signup
          </a>
        </p>
      </form>
    </div>
  );
}
