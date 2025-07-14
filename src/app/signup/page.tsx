// app/signup/page.tsx
'use client';

import { useState } from 'react';
import useSWRMutation from 'swr/mutation';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface SignupResponse {
  message: string;
  user: { publicId: string; email: string; name: string };
}

interface SignupArg {
  name: string;
  phone: string;
  email: string;
  password: string;
}

async function signupUser(url: string, { arg }: { arg: SignupArg }): Promise<SignupResponse> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.error || 'Signup failed');
  }

  return res.json();
}

export default function Signup() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { trigger, isMutating} = useSWRMutation('/api/auth/signup', signupUser);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

   
    if (!name || !phone || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const user = await trigger({ name, phone, email, password });
      console.log('User signed up:', user);
      toast.success('Signup successful!', {
        autoClose: 2000,
        onClose: () => router.push('/'), 
      });
    } catch (err: unknown) {
      const error = err as Error;
      console.error('Signup error:', error);
      toast.error(error.message || 'Signup failed');
    }
  };

  return (
    <div className="bg-blue-600 min-h-screen flex items-center justify-center p-8">
      <div className="bg-blue-100 w-full max-w-md p-8 rounded-lg shadow-lg">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col items-center justify-center min-h-40 p-8 gap-8 font-sans">
            <h1 className="text-3xl font-bold text-blue-600">Sign Up</h1>
            <div className="flex flex-col gap-4 mt-4 w-full max-w-md">
              <input
                type="text"
                placeholder="Username"
                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                type="text"
                placeholder="Phone number"
                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Enter your email"
                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Confirm Password"
                className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                disabled={isMutating}
              >
                {isMutating ? 'Signing Up...' : 'Sign Up'}
              </button>
              {/* {error && <p className="text-red-500 text-sm mt-2">{error.message}</p>} */}
              <p className="text-sm">
                Already have an account?{' '}
                <a className="text-blue-600 hover:underline" href="/login">
                  Login
                </a>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}