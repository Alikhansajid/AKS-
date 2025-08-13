
// 'use client';

// import Link from 'next/link';
// import Image from 'next/image';
// import { useRouter } from 'next/navigation';
// import useSWR, { useSWRConfig } from 'swr';
// import useSWRMutation from 'swr/mutation';
// import { useEffect, useState } from 'react';
// import { toast } from 'react-toastify';
// import { getLocalCart } from '@/utils/cart';

// async function fetcher(url: string) {
//   const res = await fetch(url);
//   if (!res.ok) throw new Error('Failed to fetch');
//   return res.json();
// }

// async function logoutFetcher(url: string) {
//   const res = await fetch(url, { method: 'POST' });
//   if (!res.ok) throw new Error('Logout failed');
//   return res.json();
// }

// export default function Navbar() {
//   const { data } = useSWR<{ user: { name: string; profilePic?: string; role?: string } | null }>('/api/auth/session', fetcher);
//   const { data: serverCart } = useSWR('/api/cart', fetcher);

//   const { mutate: globalMutate } = useSWRConfig();
//   const { trigger: triggerLogout, isMutating: isLoggingOut } = useSWRMutation(
//     '/api/auth/logout',
//     logoutFetcher
//   );

//   const router = useRouter();
//   const user = data?.user;
//   const userInitial = user?.name?.charAt(0).toUpperCase() ?? '';

//   const [localCartCount, setLocalCartCount] = useState(0);
//   const isLoggedIn = !!user;
//   const isAdmin = user?.role === 'ADMIN';

//   useEffect(() => {
//     if (!isLoggedIn) {
//       const localCart = getLocalCart();
//       setLocalCartCount(localCart.length);
//     }
//   }, [isLoggedIn]);

//   const cartCount = isLoggedIn ? serverCart?.length ?? 0 : localCartCount;

//   const handleLogout = async () => {
//     try {
//       await triggerLogout();
//       toast.success('Logged out successfully!');
//       globalMutate('/api/auth/session', { user: null }, { revalidate: true });
//       router.refresh();
//       router.push('/');
//     } catch (err) {
//       console.error('Logout error:', err);
//       toast.error('Logout failed');
//     }
//   };

//   return (
//     <header className="bg-blue-700 p-4 flex justify-between items-center sticky top-0 z-50">
//       <Link href={isAdmin ? '/admin' : '/'} className="text-2xl font-bold text-white">
//         AKS-Store
//       </Link>

//       <nav className="flex gap-4 items-center relative">
//         <Link href="/cart" className="text-white hover:text-blue-200 relative">
//           Cart
//           {cartCount > 0 && (
//             <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs px-1 rounded-full">
//               {cartCount}
//             </span>
//           )}
//         </Link>

//         <Link href="/about" className="text-white hover:text-blue-200">
//           About
//         </Link>

//         {user ? (
//           <>
//             <span className="text-white hidden sm:inline">Hello, {user.name}</span>
//             <Link href="/profile" className="text-white hover:text-blue-200">
//               {user.profilePic ? (
//                 <Image
//                   src={user.profilePic}
//                   alt="Profile"
//                   width={32}
//                   height={32}
//                   className="w-8 h-8 rounded-full object-cover"
//                 />
//               ) : (
//                 <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
//                   {userInitial}
//                 </div>
//               )}
//             </Link>
//             <button
//               onClick={handleLogout}
//               disabled={isLoggingOut}
//               className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
//             >
//               {isLoggingOut ? 'Logging out...' : 'Logout'}
//             </button>
//           </>
//         ) : (
//           <>
//             <Link href="/login" className="text-white hover:text-blue-200">
//               Login
//             </Link>
//             <Link href="/signup" className="text-white hover:text-blue-200">
//               Sign Up
//             </Link>
//           </>
//         )}
//       </nav>
//     </header>
//   );
// }










// 'use client';

// import Link from 'next/link';
// import Image from 'next/image';
// import { useRouter } from 'next/navigation';
// import useSWR, { useSWRConfig } from 'swr';
// import useSWRMutation from 'swr/mutation';
// import { useEffect, useState } from 'react';
// import { toast } from 'react-toastify';
// import { getLocalCart } from '@/utils/cart';

// async function fetcher(url: string) {
//   const res = await fetch(url);
//   if (!res.ok) throw new Error('Failed to fetch');
//   return res.json();
// }

// async function logoutFetcher(url: string) {
//   const res = await fetch(url, { method: 'POST' });
//   if (!res.ok) throw new Error('Logout failed');
//   return res.json();
// }

// export default function Navbar() {
//   const { data } = useSWR<{ user: { name: string; profilePic?: string; role?: string } | null }>(
//     '/api/auth/session',
//     fetcher
//   );
//   const { data: serverCart } = useSWR('/api/cart', fetcher);

//   const { mutate: globalMutate } = useSWRConfig();
//   const { trigger: triggerLogout, isMutating: isLoggingOut } = useSWRMutation(
//     '/api/auth/logout',
//     logoutFetcher
//   );

//   const router = useRouter();
//   const user = data?.user;
//   const userInitial = user?.name?.charAt(0).toUpperCase() ?? '';

//   const [localCartCount, setLocalCartCount] = useState(0);
//   const isLoggedIn = !!user;
//   const isAdmin = user?.role === 'ADMIN';

//   useEffect(() => {
//     if (!isLoggedIn) {
//       const localCart = getLocalCart();
//       setLocalCartCount(localCart.length);
//     }
//   }, [isLoggedIn]);

//   const cartCount = isLoggedIn ? serverCart?.length ?? 0 : localCartCount;

//   const handleLogout = async () => {
//     try {
//       await triggerLogout();
//       toast.success('Logged out successfully!');
//       globalMutate('/api/auth/session', { user: null }, { revalidate: true });
//       router.refresh();
//       router.push('/');
//     } catch (err) {
//       console.error('Logout error:', err);
//       toast.error('Logout failed');
//     }
//   };

//   return (
//     <header className="bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 p-4 flex justify-between items-center sticky top-0 z-50 shadow-lg">
//       {/* Logo */}
//       <Link
//         href={isAdmin ? '/admin' : '/'}
//         className="text-2xl font-extrabold tracking-wide text-amber-400 hover:text-amber-300 transition-colors"
//       >
//         AKS-Store
//       </Link>

//       {/* Nav */}
//       <nav className="flex gap-6 items-center relative text-sm font-medium">
//         <Link
//           href="/cart"
//           className="text-zinc-300 hover:text-amber-400 relative transition-colors"
//         >
//           Cart
//           {cartCount > 0 && (
//             <span className="absolute -top-2 -right-4 bg-amber-500 text-black font-bold text-xs px-1.5 py-0.5 rounded-full shadow-md">
//               {cartCount}
//             </span>
//           )}
//         </Link>

//         <Link
//           href="/about"
//           className="text-zinc-300 hover:text-amber-400 transition-colors"
//         >
//           About
//         </Link>

//         {user ? (
//           <>
//             <span className="text-zinc-400 hidden sm:inline">Hi, {user.name}</span>
//             <Link href="/profile" className="hover:opacity-80 transition">
//               {user.profilePic ? (
//                 <Image
//                   src={user.profilePic}
//                   alt="Profile"
//                   width={32}
//                   height={32}
//                   className="w-8 h-8 rounded-full object-cover border border-amber-500 shadow-sm"
//                 />
//               ) : (
//                 <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold border border-amber-300">
//                   {userInitial}
//                 </div>
//               )}
//             </Link>
//             <button
//               onClick={handleLogout}
//               disabled={isLoggingOut}
//               className="bg-amber-500 text-black px-4 py-1.5 rounded-md hover:bg-amber-400 transition-colors font-semibold shadow disabled:opacity-50"
//             >
//               {isLoggingOut ? 'Logging out...' : 'Logout'}
//             </button>
//           </>
//         ) : (
//           <>
//             <Link
//               href="/login"
//               className="text-zinc-300 hover:text-amber-400 transition-colors"
//             >
//               Login
//             </Link>
//             <Link
//               href="/signup"
//               className="text-black bg-amber-500 hover:bg-amber-400 px-3 py-1.5 rounded-md font-semibold shadow transition-colors"
//             >
//               Sign Up
//             </Link>
//           </>
//         )}
//       </nav>
//     </header>
//   );
// }










































































'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { getLocalCart } from '@/utils/cart';

async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

async function logoutFetcher(url: string) {
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error('Logout failed');
  return res.json();
}

export default function Navbar() {
  const { data } = useSWR<{ user: { name: string; profilePic?: string; role?: string } | null }>(
    '/api/auth/session',
    fetcher
  );
  const { data: serverCart } = useSWR('/api/cart', fetcher);

  const { mutate: globalMutate } = useSWRConfig();
  const { trigger: triggerLogout, isMutating: isLoggingOut } = useSWRMutation(
    '/api/auth/logout',
    logoutFetcher
  );

  const router = useRouter();
  const user = data?.user;
  const userInitial = user?.name?.charAt(0).toUpperCase() ?? '';

  const [localCartCount, setLocalCartCount] = useState(0);
  const isLoggedIn = !!user;
  const isAdmin = user?.role === 'ADMIN';
  const isRider = user?.role === 'RIDER';

  useEffect(() => {
    if (!isLoggedIn) {
      const localCart = getLocalCart();
      setLocalCartCount(localCart.length);
    }
  }, [isLoggedIn]);

  const cartCount = isLoggedIn ? serverCart?.length ?? 0 : localCartCount;

  const handleLogout = async () => {
    try {
      await triggerLogout();
      toast.success('Logged out successfully!');
      globalMutate('/api/auth/session', { user: null }, { revalidate: true });
      router.refresh();
      router.push('/');
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('Logout failed');
    }
  };

  return (
    <header className="bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 p-4 flex justify-between items-center sticky top-0 z-50 shadow-lg">
      {/* Logo */}
      <Link
        href={isAdmin ? '/admin' : '/'}
        className="text-2xl font-extrabold tracking-wide text-amber-400 hover:text-amber-300 transition-colors"
      >
        AKS-Store
      </Link>

      {/* Nav */}
      <nav className="flex gap-6 items-center relative text-sm font-medium">
        {/* Cart and About only for customers */}
        {!isAdmin && !isRider && (
          <>
            <Link
              href="/cart"
              className="text-zinc-300 hover:text-amber-400 relative transition-colors"
            >
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-4 bg-amber-500 text-black font-bold text-xs px-1.5 py-0.5 rounded-full shadow-md">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              href="/about"
              className="text-zinc-300 hover:text-amber-400 transition-colors"
            >
              About
            </Link>
          </>
        )}

        {user ? (
          <>
            <span className="text-zinc-400 hidden sm:inline">Hi, {user.name}</span>
            <Link href="/profile" className="hover:opacity-80 transition">
              {user.profilePic ? (
                <Image
                  src={user.profilePic}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover border border-amber-500 shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-black font-bold border border-amber-300">
                  {userInitial}
                </div>
              )}
            </Link>
            {/* Logout for all roles */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-amber-500 text-black px-4 py-1.5 rounded-md hover:bg-amber-400 transition-colors font-semibold shadow disabled:opacity-50"
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-zinc-300 hover:text-amber-400 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="text-black bg-amber-500 hover:bg-amber-400 px-3 py-1.5 rounded-md font-semibold shadow transition-colors"
            >
              Sign Up
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
