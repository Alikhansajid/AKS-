'use client';

import { useEffect} from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter } from 'next/navigation';

export default function AdminHome() {
  // const [search, setSearch] = useState('');
  // const [filterCategory, setFilterCategory] = useState('All');
  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (!data.user || data.user.role !== 'ADMIN') {
          toast.error('Unauthorized access');
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        toast.error('Failed to verify session');
        router.push('/');
      }
    }

    checkAdmin();
  }, [router]);

  const handleUsers = () => {
    router.push('/admin/user');
  };

  const handleOrders = () => {
    router.push('/admin/order');
  };

  const handleProducts = () => {
    router.push('/admin/product');
  };

  return (
    <div className="bg-blue-50 min-h-screen font-sans">
      {/* Top bar */}
      <div className="bg-white px-4 py-3 shadow-sm sticky top-[64px] z-40 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded px-4 py-2 border w-full md:w-64 text-black"
          />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded px-4 py-2 border text-black"
          >
            <option value="All">All</option>
          </select>
        </div> */}
        <div className="flex gap-2">
          <button
            onClick={handleUsers}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Users
          </button>
          <button
            onClick={handleOrders}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Orders
          </button>
          <button
            onClick={handleProducts}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Products
          </button>
        </div>
      </div>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center p-8 bg-blue-600 text-white" id="hero">
        <h2 className="text-5xl font-bold mb-4">Admin Dashboard</h2>
        <p className="text-lg mb-6 max-w-lg">
          Manage users, orders, and products efficiently.
        </p>
      </section>

      {/* Footer */}
      <footer className="bg-blue-800 text-white p-6 mt-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-sm gap-4">
          <p>© 2025 AKS-Store. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:underline text-blue-200">Terms</Link>
            <Link href="/privacy" className="hover:underline text-blue-200">Privacy</Link>
            <Link href="/contact" className="hover:underline text-blue-200">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}