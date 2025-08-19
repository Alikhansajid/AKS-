'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWRMutation from 'swr/mutation';
import { toast } from 'react-toastify';

// Types
interface RiderDetails {
  address: string;
  cnic: string;
  vehicleType: string;
  vehicleNumber: string;
}

interface ApiResponse {
  message?: string;
  error?: string;
}

// SWR Mutation fetcher (PATCH)
async function submitRiderDetails(
  url: string,
  { arg }: { arg: RiderDetails }
): Promise<ApiResponse> {
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pendingDetails: arg }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to submit details');
  }

  return res.json();
}

export default function RiderDetailPage() {
  const [details, setDetails] = useState<RiderDetails>({
    address: '',
    cnic: '',
    vehicleType: '',
    vehicleNumber: '',
  });
  const router = useRouter();

  const { trigger, isMutating } = useSWRMutation('/api/rider/detail', submitRiderDetails);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await trigger(details);
      toast.success('Details submitted successfully!');
      router.push('/rider/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) toast.error(err.message);
      else toast.error('Failed to submit details');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-800">
      <div className="bg-gray-900 border border-amber-500 shadow-xl rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-amber-400 mb-6">
          Rider Details
        </h1>
        <p className="text-center text-gray-300 mb-6">
          Please complete your profile before continuing
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-200">
              Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              value={details.address}
              onChange={handleChange}
              required
              className="w-full mt-1 p-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label htmlFor="cnic" className="block text-sm font-medium text-gray-200">
              CNIC
            </label>
            <input
              id="cnic"
              name="cnic"
              type="text"
              value={details.cnic}
              onChange={handleChange}
              required
              className="w-full mt-1 p-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-200">
              Vehicle Type
            </label>
            <input
              id="vehicleType"
              name="vehicleType"
              type="text"
              value={details.vehicleType}
              onChange={handleChange}
              required
              className="w-full mt-1 p-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-200">
              Vehicle Number
            </label>
            <input
              id="vehicleNumber"
              name="vehicleNumber"
              type="text"
              value={details.vehicleNumber}
              onChange={handleChange}
              required
              className="w-full mt-1 p-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-100 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={isMutating}
            className="w-full py-2 px-4 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 transition disabled:opacity-50"
          >
            {isMutating ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
