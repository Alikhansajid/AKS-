'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Pusher from 'pusher-js';
import { getLocalCart } from '@/utils/cart';

// --- fetchers --- //
const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json() as Promise<T>;
};

const logoutFetcher = async (url: string): Promise<{ success: boolean }> => {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Logout failed');
  return res.json();
};

// --- component --- //
export default function Navbar() {
  const router = useRouter();
  const { mutate: globalMutate } = useSWRConfig();

  // user session
  const { data } = useSWR<{ user: { id: number; name: string; profilePic?: string; role?: string } | null }>(
    '/api/auth/session',
    fetcher
  );

  // cart
  const { data: serverCart, mutate: mutateCart } = useSWR<
    { id: number; quantity: number; product: { id: number; name: string; price: number } }[]
  >('/api/cart', fetcher);

  // logout mutation
  const { trigger: triggerLogout, isMutating: isLoggingOut } = useSWRMutation(
    '/api/auth/logout',
    (url: string) => logoutFetcher(url)
  );

  const user = data?.user;
  const userInitial = user?.name?.charAt(0).toUpperCase() ?? '';

  const [localCartCount, setLocalCartCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const isLoggedIn = !!user;
  const isAdmin = user?.role === 'ADMIN';
  const isRider = user?.role === 'RIDER';

  // local cart for guests
  useEffect(() => {
    if (!isLoggedIn) {
      const localCart = getLocalCart();
      setLocalCartCount(localCart.length);
    }
  }, [isLoggedIn]);

  const cartCount = isLoggedIn ? serverCart?.length ?? 0 : localCartCount;

  // real-time chat (admin)
  useEffect(() => {
    if (!user) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`private-user-${user.id}`);

    channel.bind('new-message', (data: { conversationId: string; senderId: number; content: string }) => {
      if (data.senderId !== user.id) {
        setUnreadMessages((prev) => prev + 1);
        toast.info(`New message: ${data.content}`);
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`private-user-${user.id}`);
      pusher.disconnect();
    };
  }, [user]);

  // revalidate cart in real-time (when server emits event)
  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe('cart-channel');

    channel.bind('cart-updated', () => {
      mutateCart(); // re-fetch /api/cart instantly
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe('cart-channel');
      pusher.disconnect();
    };
  }, [mutateCart]);

  const handleLogout = async () => {
    try {
      await triggerLogout();
      toast.success('Logged out successfully!');
      globalMutate('/api/auth/session', { user: null }, { revalidate: true });
      router.refresh();
      router.push('/');
    } catch {
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
        {/* Cart (customers only) */}
        {!isAdmin && !isRider && (
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
        )}

        {/* Chat (admins only) */}
        {isAdmin && (
          <Link
            href="/admin/chat"
            className="text-zinc-300 hover:text-amber-400 relative transition-colors"
          >
            Chat
            {unreadMessages > 0 && (
              <span className="absolute -top-2 -right-5 bg-red-500 text-white font-bold text-xs px-1.5 py-0.5 rounded-full shadow-md">
                {unreadMessages}
              </span>
            )}
          </Link>
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
