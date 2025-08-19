'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';
import { toast } from 'react-toastify';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Dialog, DialogContent } from '@/app/components/ui/dialog';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface RiderDetails {
  address?: string;
  cnic?: string;
  vehicleType?: string;
  vehicleNumber?: string;
}

interface RiderProfile {
  publicId: string;
  email: string;
  name: string;
  phone?: string;
  profilePic?: string;
  details?: RiderDetails & { pendingDetails?: RiderDetails[] };
}

interface PerformanceData {
  labels: string[];
  data: number[];
}

type TimeRange = 'today' | 'lastWeek' | 'lastMonth' | 'lastYear' | 'lifetime';

export default function RiderDashboardPage() {
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<PerformanceData>({ labels: [], data: [] });
  const [timeRange, setTimeRange] = useState<TimeRange>('lastMonth');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDetails, setEditDetails] = useState<RiderDetails>({});
  const router = useRouter();
  const { mutate: globalMutate } = useSWRConfig();

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch('/api/rider/profile');
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch profile');
      const data: { user: RiderProfile } = await res.json();
      setProfile(data.user);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to load profile');
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchPerformance = useCallback(async () => {
    try {
      const res = await fetch(`/api/rider/performance?range=${timeRange}`);
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch performance data');
      const data: PerformanceData = await res.json();
      setPerformanceData(data);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to load performance data');
    }
  }, [timeRange]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  const chartData = {
    labels: performanceData.labels,
    datasets: [
      {
        label: 'Delivered Orders',
        data: performanceData.data,
        borderColor: 'rgb(16, 185, 129)', // emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' as const },
      title: {
        display: true,
        text: `Performance - ${
          timeRange.charAt(0).toUpperCase() + timeRange.slice(1).replace('last', 'Last ')
        }`,
      },
    },
  };

  async function logoutFetcher(url: string) {
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error('Logout failed');
    return res.json();
  }

  const { trigger: triggerLogout, isMutating: isLoggingOut } = useSWRMutation(
    '/api/auth/logout',
    logoutFetcher,
  );

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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/rider/detail', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingDetails: editDetails }),
      });
      if (!res.ok) throw new Error('Failed to submit details');
      toast.success('Details submitted for approval!');
      setIsEditOpen(false);
      setEditDetails({});
      await fetchProfile();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit details');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <p className="text-slate-700 text-lg">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <p className="text-slate-700 text-lg">No profile data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-5xl space-y-8">
        <h1 className="text-3xl font-bold text-center text-slate-800">Rider Dashboard</h1>

        {/* Performance Chart */}
        <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-lg shadow-inner">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-emerald-800">Performance</h2>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRange)}
              className="p-2 border rounded focus:ring-2 focus:ring-emerald-400"
            >
              <option value="today">Today</option>
              <option value="lastWeek">Last Week</option>
              <option value="lastMonth">Last Month</option>
              <option value="lastYear">Last Year</option>
              <option value="lifetime">Lifetime</option>
            </select>
          </div>
          <div className="h-80 bg-white p-4 rounded shadow-sm">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Rider Details */}
        <div>
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Rider Details</h2>
          {profile.details && (
            <div className="space-y-2">
              <p><strong>Address:</strong> {profile.details.address || 'Not set'}</p>
              <p><strong>CNIC:</strong> {profile.details.cnic || 'Not set'}</p>
              <p><strong>Vehicle Type:</strong> {profile.details.vehicleType || 'Not set'}</p>
              <p><strong>Vehicle Number:</strong> {profile.details.vehicleNumber || 'Not set'}</p>
              {profile.details.pendingDetails?.length ? (
                <div className="mt-4 space-y-2">
                  {profile.details.pendingDetails.map((pending, index) => (
                    <div key={index} className="p-4 bg-yellow-50 border border-yellow-300 rounded">
                      <h4 className="font-semibold text-yellow-800">Pending Details #{index + 1}</h4>
                      <p><strong>Address:</strong> {pending.address}</p>
                      <p><strong>CNIC:</strong> {pending.cnic}</p>
                      <p><strong>Vehicle Type:</strong> {pending.vehicleType}</p>
                      <p><strong>Vehicle Number:</strong> {pending.vehicleNumber}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
          <button
            onClick={() => {
              setEditDetails({
                address: profile.details?.address || '',
                cnic: profile.details?.cnic || '',
                vehicleType: profile.details?.vehicleType || '',
                vehicleNumber: profile.details?.vehicleNumber || '',
              });
              setIsEditOpen(true);
            }}
            className="mt-4 py-2 px-4 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            Edit Details
          </button>
        </div>

        {/* Orders Button */}
        <button
          onClick={() => router.push('/rider/orders')}
          className="w-full py-2 bg-emerald-500 text-white rounded hover:bg-emerald-600"
        >
          View Orders
        </button>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full py-2 bg-rose-500 text-white rounded hover:bg-rose-600 disabled:opacity-50"
        >
          {isLoggingOut ? 'Logging out...' : 'Logout'}
        </button>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <h3 className="text-lg font-semibold mb-4">Edit Rider Details</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label htmlFor="address" className="block mb-1">Address</label>
                <input
                  id="address"
                  type="text"
                  value={editDetails.address || ''}
                  onChange={(e) => setEditDetails({ ...editDetails, address: e.target.value })}
                  required
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label htmlFor="cnic" className="block mb-1">CNIC</label>
                <input
                  id="cnic"
                  type="text"
                  value={editDetails.cnic || ''}
                  onChange={(e) => setEditDetails({ ...editDetails, cnic: e.target.value })}
                  required
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label htmlFor="vehicleType" className="block mb-1">Vehicle Type</label>
                <input
                  id="vehicleType"
                  type="text"
                  value={editDetails.vehicleType || ''}
                  onChange={(e) => setEditDetails({ ...editDetails, vehicleType: e.target.value })}
                  required
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label htmlFor="vehicleNumber" className="block mb-1">Vehicle Number</label>
                <input
                  id="vehicleNumber"
                  type="text"
                  value={editDetails.vehicleNumber || ''}
                  onChange={(e) => setEditDetails({ ...editDetails, vehicleNumber: e.target.value })}
                  required
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <button
                type="submit"
                disabled={Object.values(editDetails).some(v => !v)}
                className="w-full py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
              >
                Submit for Approval
              </button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
