'use client';

import useSWRMutation from 'swr/mutation';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface LoginResponse {
  message: string;
  user: { publicId: string; email: string; name: string | null };
}

interface LoginArg {
  email: string;
  password: string;
}

async function loginUser(url: string, { arg }: { arg: LoginArg }): Promise<LoginResponse> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(arg),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error?.error || 'Login failed');
  }

  return res.json();
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { trigger, isMutating} = useSWRMutation('/api/auth/login', loginUser);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await trigger({ email, password });
      console.log('Logged in user:', user);
      toast.success('Login successful!', { autoClose: 2000 });
      router.push('/');
    } catch (err: unknown) { 
      const error = err as Error; 
      toast.error(error.message || 'Login failed');
    }
  };

  return (
    <div className="bg-blue-600 min-h-screen flex items-center justify-center p-8">
      <div className="bg-blue-100 w-full max-w-md p-8 rounded-lg shadow-lg">
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col items-center justify-center min-h-40 p-8 gap-8 font-sans">
            <h1 className="text-3xl font-bold text-blue-600">Login</h1>
            <p className="text-lg text-blue-600">Welcome back!</p>
            <div className="flex flex-col gap-4 mt-4 w-full max-w-md">
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
              <button
                type="submit"
                className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                disabled={isMutating}
              >
                {isMutating ? 'Logging in...' : 'Login'}
              </button>
              {/* {error && <p className="text-red-500 text-sm">{error.message}</p>} */}
              <p className="text-sm">
                Not a member?{' '}
                <a className="text-blue-600 hover:underline" href="/signup">
                  Sign up
                </a>
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}