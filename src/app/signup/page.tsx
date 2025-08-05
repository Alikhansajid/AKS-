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
    
    <div className="min-h-screen bg-blue-600 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-blue-600 mb-6">Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-blue-600 mb-2">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded text-black"
              required
              disabled={isMutating}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-blue-600 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded text-black"
              required
              disabled={isMutating}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="phone" className="block text-blue-600 mb-2">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2 border rounded text-black"
              disabled={isMutating}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-blue-600 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded text-black"
              required
              disabled={isMutating}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-blue-600 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border rounded text-black"
              required
              disabled={isMutating}
            />
          </div>
          <button
            type="submit"
            disabled={isMutating}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isMutating ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-4 text-blue-600">
          Already have an account? <a href="/login" className="underline">Login</a>
        </p>
      </div>
    </div>
  );
}
