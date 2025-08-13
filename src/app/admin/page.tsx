'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

type OrderStatusType = 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
type PaymentStatusType = 'PENDING' | 'SUCCESS' | 'FAILED';
type Timeframe = '1w' | '1m' | '1y' | 'lifetime';

interface DashboardData {
  timeframe: Timeframe;

  ridersCount: number;
  customersCount: number;
  totalOrders: number;
  totalRevenue: number;

  ordersByStatus: { status: OrderStatusType; _count: { status: number } }[];
  ordersByCategory: { categoryName: string; orderCount: number }[];
  paymentsByStatusOverTime: { bucket: string; status: PaymentStatusType; count: number }[];
  revenueOverTime: { bucket: string; totalRevenue: number }[];

  riderLeaderboard: { riderName: string; completionRate: number; totalDeliveries: number }[];
  topCustomers: { customerName: string; orders: number; totalSpent: number }[];
}

export default function AdminHome() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>('lifetime');
  const [loading, setLoading] = useState(false);

  // auth check
  useEffect(() => {
    async function checkAdmin() {
      try {
        const res = await fetch('/api/auth/session');
        const sessionData = await res.json();
        if (!sessionData.user || sessionData.user.role !== 'ADMIN') {
          toast.error('Unauthorized access');
          router.push('/');
        }
      } catch {
        toast.error('Failed to verify session');
        router.push('/');
      }
    }
    checkAdmin();
  }, [router]);

  // fetch dashboard data
  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/dashboard?timeframe=${timeframe}`)
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.error) {
          toast.error(payload.error ?? 'Failed to fetch dashboard data');
          setData(null);
        } else {
          setData(payload as DashboardData);
        }
      })
      .catch(() => {
        toast.error('Failed to fetch dashboard data');
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [timeframe]);

  // --- Chart data builders with colors ---

  const ordersStatusData = useMemo(() => {
    const labels = data?.ordersByStatus?.map((o) => o.status) ?? [];
    const values = data?.ordersByStatus?.map((o) => o._count.status) ?? [];
    const colors = ['#FBBF24', '#3B82F6', '#10B981', '#EF4444']; // amber, blue, green, red
    return {
      labels,
      datasets: [{
        label: 'Orders',
        data: values,
        backgroundColor: colors.slice(0, values.length),
      }],
    };
  }, [data]);

  const ordersByCategoryData = useMemo(() => {
    const labels = data?.ordersByCategory?.map((c) => c.categoryName) ?? [];
    const values = data?.ordersByCategory?.map((c) => c.orderCount) ?? [];
    const colors = ['#F59E0B', '#2563EB', '#10B981', '#8B5CF6', '#EF4444'];
    return {
      labels,
      datasets: [{
        label: 'Orders by Category',
        data: values,
        backgroundColor: colors.slice(0, values.length),
      }],
    };
  }, [data]);

  const paymentsOverTimeData = useMemo(() => {
    if (!data) return { labels: [], datasets: [] };

    const buckets = Array.from(new Set(data.paymentsByStatusOverTime.map((p) => p.bucket))).sort();
    const statuses: PaymentStatusType[] = ['PENDING', 'SUCCESS', 'FAILED'];
    const colors: Record<PaymentStatusType, string> = {
      PENDING: '#FBBF24',
      SUCCESS: '#10B981',
      FAILED: '#EF4444',
    };

    const datasets = statuses.map((status) => {
      const series = buckets.map((b) => {
        const entry = data.paymentsByStatusOverTime.find((p) => p.bucket === b && p.status === status);
        return entry?.count ?? 0;
      });
      return {
        label: status,
        data: series,
        stack: 'payments',
        backgroundColor: colors[status],
      };
    });

    return { labels: buckets, datasets };
  }, [data]);

  const revenueOverTimeData = useMemo(() => {
    const labels = data?.revenueOverTime?.map((r) => r.bucket) ?? [];
    const values = data?.revenueOverTime?.map((r) => r.totalRevenue) ?? [];
    return {
      labels,
      datasets: [{
        label: 'Revenue',
        data: values,
        tension: 0.3,
        fill: true,
        borderColor: '#FBBF24',
        backgroundColor: 'rgba(251, 191, 36, 0.2)',
      }],
    };
  }, [data]);

  const riderLeaderboardData = useMemo(() => {
    const labels = data?.riderLeaderboard?.map((r) => r.riderName) ?? [];
    const values = data?.riderLeaderboard?.map((r) => Math.round(r.completionRate * 100)) ?? [];
    return {
      labels,
      datasets: [{
        label: 'Completion Rate (%)',
        data: values,
        backgroundColor: '#3B82F6',
      }],
    };
  }, [data]);

  const handleUsers = () => router.push('/admin/user');
  const handleOrders = () => router.push('/admin/order');
  const handleProducts = () => router.push('/admin/product');

  const currency = (n: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

  return (
    <div className="bg-zinc-900 min-h-screen font-sans text-zinc-100 flex flex-col p-6 space-y-8">
      {/* Nav buttons */}
      <div className="flex gap-4 mb-6">
        <button onClick={handleUsers} className="bg-amber-500 text-black px-4 py-2 rounded hover:bg-amber-400 transition-colors font-semibold">Users</button>
        <button onClick={handleOrders} className="bg-amber-500 text-black px-4 py-2 rounded hover:bg-amber-400 transition-colors font-semibold">Orders</button>
        <button onClick={handleProducts} className="bg-amber-500 text-black px-4 py-2 rounded hover:bg-amber-400 transition-colors font-semibold">Products</button>
      </div>

      {/* Header */}
      <header className="flex flex-col md:flex-row gap-4 md:gap-0 md:justify-between md:items-center">
        <h1 className="text-4xl font-bold text-amber-400">Admin Dashboard</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-zinc-400">Timeframe</label>
          <select
            className="bg-zinc-800 text-zinc-100 px-3 py-2 rounded"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as Timeframe)}
          >
            <option value="1w">Last 1 Week</option>
            <option value="1m">Last 1 Month</option>
            <option value="1y">Last 1 Year</option>
            <option value="lifetime">Lifetime</option>
          </select>
        </div>
      </header>

      {loading && <p>Loading data...</p>}

      {data && !loading && (
        <>
          {/* Top cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-zinc-800 p-4 rounded-2xl shadow text-center">
              <h3 className="text-sm text-zinc-400">Riders</h3>
              <p className="text-3xl text-amber-400 font-bold">{data.ridersCount}</p>
            </div>
            <div className="bg-zinc-800 p-4 rounded-2xl shadow text-center">
              <h3 className="text-sm text-zinc-400">Customers</h3>
              <p className="text-3xl text-amber-400 font-bold">{data.customersCount}</p>
            </div>
            <div className="bg-zinc-800 p-4 rounded-2xl shadow text-center">
              <h3 className="text-sm text-zinc-400">Total Orders</h3>
              <p className="text-3xl text-amber-400 font-bold">{data.totalOrders}</p>
            </div>
            <div className="bg-zinc-800 p-4 rounded-2xl shadow text-center">
              <h3 className="text-sm text-zinc-400">Revenue</h3>
              <p className="text-3xl text-amber-400 font-bold">{currency(data.totalRevenue)}</p>
            </div>
          </div>

          {/* Charts row 1 */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-zinc-800 p-4 rounded-2xl shadow">
              <h4 className="text-xl mb-3 font-semibold">Orders by Status</h4>
              <Bar data={ordersStatusData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </div>

            <div className="bg-zinc-800 p-4 rounded-2xl shadow">
              <h4 className="text-xl mb-3 font-semibold">Orders by Category</h4>
              <Doughnut data={ordersByCategoryData} />
            </div>
          </section>

          {/* Charts row 2 */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-zinc-800 p-4 rounded-2xl shadow">
              <h4 className="text-xl mb-3 font-semibold">Payments by Status (Daily)</h4>
              <Bar
                data={paymentsOverTimeData}
                options={{
                  responsive: true,
                  scales: { x: { stacked: true }, y: { stacked: true } },
                }}
              />
            </div>

            <div className="bg-zinc-800 p-4 rounded-2xl shadow">
              <h4 className="text-xl mb-3 font-semibold">Revenue Over Time</h4>
              <Line data={revenueOverTimeData} options={{ responsive: true }} />
            </div>
          </section>

          {/* Leaderboards / Tables */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-zinc-800 p-4 rounded-2xl shadow">
              <h4 className="text-xl mb-3 font-semibold">Rider Leaderboard</h4>
              <Bar
                data={riderLeaderboardData}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  scales: { x: { min: 0, max: 100 } },
                }}
              />
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-zinc-400">
                    <tr>
                      <th className="py-2">Rider</th>
                      <th className="py-2">Deliveries</th>
                      <th className="py-2">Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.riderLeaderboard.map((r) => (
                      <tr key={r.riderName} className="border-t border-zinc-700">
                        <td className="py-2">{r.riderName}</td>
                        <td className="py-2">{r.totalDeliveries}</td>
                        <td className="py-2">{Math.round(r.completionRate * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-zinc-800 p-4 rounded-2xl shadow">
              <h4 className="text-xl mb-3 font-semibold">Top Customers</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-zinc-400">
                    <tr>
                      <th className="py-2">Customer</th>
                      <th className="py-2">Orders</th>
                      <th className="py-2">Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topCustomers.map((c) => (
                      <tr key={c.customerName} className="border-t border-zinc-700">
                        <td className="py-2">{c.customerName}</td>
                        <td className="py-2">{c.orders}</td>
                        <td className="py-2">{currency(c.totalSpent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
