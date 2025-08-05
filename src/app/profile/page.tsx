'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProfilePage() {
  const { data, error } = useSWR('/api/auth/session', fetcher);
  const { mutate } = useSWRConfig();
  const router = useRouter();

  const user = data?.user;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  if (error) return <p className="text-red-600">Failed to load profile.</p>;
  if (!user) return <p className="text-blue-600">Loading...</p>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      if (password.trim()) formData.append('password', password);
      if (profilePic) formData.append('profilePic', profilePic);

      const res = await fetch('/api/profile', {
        method: 'PUT',
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Profile update failed');
        return;
      }

      toast.success(result.message || 'Profile updated successfully');

      await mutate('/api/auth/session'); // refresh session
      router.refresh(); // reload UI

    } catch (err) {
      toast.error('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-md"
        encType="multipart/form-data"
      >
        <h2 className="text-2xl font-bold mb-6 text-blue-600">Update Profile</h2>

        <div className="mb-4">
          <label className="block mb-1 text-blue-700">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded text-black"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-blue-700">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-2 border rounded text-black"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-blue-700">New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded text-black"
            placeholder="Leave blank to keep current password"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-blue-700">Profile Picture</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProfilePic(e.target.files?.[0] || null)}
            className="w-full text-black"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </form>
    </div>
  );
}
