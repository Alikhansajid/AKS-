'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Types
interface User {
  name?: string;
  phone?: string;
  email: string;
}

interface SessionResponse {
  user?: User;
}

interface UpdateProfileResponse {
  message?: string;
  error?: string;
}

// SWR fetcher
const fetcher = async (url: string): Promise<SessionResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch session');
  return res.json();
};

// SWR mutation fetcher
const updateProfileFetcher = async (
  url: string,
  { arg }: { arg: FormData }
): Promise<UpdateProfileResponse> => {
  const res = await fetch(url, {
    method: 'PUT',
    body: arg,
  });

  const data = (await res.json()) as UpdateProfileResponse;
  if (!res.ok) throw new Error(data.error || 'Profile update failed');
  return data;
};

export default function ProfilePage() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<SessionResponse>(
    '/api/auth/session',
    fetcher
  );

  const { trigger, isMutating } = useSWRMutation(
    '/api/profile',
    updateProfileFetcher
  );

  const user = data?.user;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [profilePic, setProfilePic] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  if (error) return <p className="text-red-500 text-center mt-10">Failed to load profile.</p>;
  if (isLoading) return <p className="text-amber-400 text-center mt-10">Loading...</p>;
  if (!user) return <p className="text-red-500 text-center mt-10">Unauthorized</p>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      if (password.trim()) formData.append('password', password);
      if (profilePic) formData.append('profilePic', profilePic);

      const result = await trigger(formData);

      toast.success(result.message || 'Profile updated successfully');

      await mutate(); // refresh session data
      router.refresh(); // refresh UI
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('Unexpected error occurred');
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-800/70 border border-zinc-700 p-8 rounded-xl shadow-lg w-full max-w-md"
        encType="multipart/form-data"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-amber-400">
          Update Profile
        </h2>

        {/* Name */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-amber-300">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-zinc-600 rounded bg-zinc-900 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
            required
          />
        </div>

        {/* Phone */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-amber-300">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-2 border border-zinc-600 rounded bg-zinc-900 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="block mb-1 text-sm font-medium text-amber-300">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-zinc-600 rounded bg-zinc-900 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
            placeholder="Leave blank to keep current password"
          />
        </div>

        {/* Profile Pic */}
        <div className="mb-6">
          <label className="block mb-1 text-sm font-medium text-amber-300">Profile Picture</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProfilePic(e.target.files?.[0] || null)}
            className="w-full text-zinc-100"
          />
        </div>

        <button
          type="submit"
          disabled={isMutating}
          className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded transition-colors disabled:opacity-50"
        >
          {isMutating ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
}
