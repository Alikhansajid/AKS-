'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useSWRMutation from 'swr/mutation';
import { useSWRConfig } from 'swr';

async function signupFetcher(
  url: string,
  {
    arg,
  }: {
    arg: { email: string; password: string; name: string; phone?: string };
  }
) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Signup failed');
  }
  return res.json();
}

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const { trigger, isMutating } = useSWRMutation('/api/auth/signup', signupFetcher);
  const { mutate } = useSWRConfig();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    try {
      const result = await trigger({ email, password, name, phone });
      toast.success('Signed up successfully!');
      await mutate('/api/auth/session', { user: result.user }, { revalidate: true });
      router.push('/');
      router.refresh();
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An error occurred');
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="bg-zinc-800/70 border border-zinc-700 p-8 rounded-xl shadow-lg max-w-md w-full">
        <h2 className="text-3xl font-bold text-amber-400 mb-6">Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-amber-300 mb-2 font-medium">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-zinc-600 rounded bg-zinc-900 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
              required
              disabled={isMutating}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-amber-300 mb-2 font-medium">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-zinc-600 rounded bg-zinc-900 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
              required
              disabled={isMutating}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="phone" className="block text-amber-300 mb-2 font-medium">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2 border border-zinc-600 rounded bg-zinc-900 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
              disabled={isMutating}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-amber-300 mb-2 font-medium">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border border-zinc-600 rounded bg-zinc-900 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
              required
              disabled={isMutating}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-amber-300 mb-2 font-medium">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border border-zinc-600 rounded bg-zinc-900 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-400"
              required
              disabled={isMutating}
            />
          </div>
          <button
            type="submit"
            disabled={isMutating}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold p-2 rounded transition-colors disabled:opacity-50"
          >
            {isMutating ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-4 text-zinc-400">
          Already have an account?{' '}
          <a href="/login" className="text-amber-400 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
