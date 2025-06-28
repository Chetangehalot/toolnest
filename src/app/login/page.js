'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import NeuralNetwork from '@/components/NeuralNetwork';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Check for success message from signup
    const messageParam = searchParams.get('message');
    if (messageParam) {
      setMessage(messageParam);
    }

    // Redirect if already logged in
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [searchParams, status, router]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        // Check for specific blocked user error
        if (result.error.includes('blocked')) {
          setError('Your account has been blocked by the administrator. Please contact support for assistance.');
        } else if (result.error.includes('Invalid credentials')) {
          setError('Invalid email or password');
        } else {
          setError('Invalid email or password');
        }
      } else {
        // Redirect to home page on successful login
        router.push('/');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Check for specific network errors
      if (error.message?.includes('ERR_RESPONSE_HEADERS_TOO_BIG') || 
          error.message?.includes('headers too big') ||
          error.message?.includes('payload too large')) {
        setError('Login failed due to large user data. Please contact support for assistance.');
      } else {
        setError('An error occurred during login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-[#CFCFCF]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0F24] py-12 px-4 relative">
      <NeuralNetwork />
      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8 shadow-xl">
          <h2 className="text-3xl font-bold text-[#F5F5F5] text-center mb-2">Sign in to your account</h2>
          <p className="text-center text-[#CFCFCF] mb-6">
            Or{' '}
            <Link href="/signup" className="text-[#00FFE0] hover:underline">create a new account</Link>
          </p>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#CFCFCF] mb-1">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-4 py-2 rounded-lg border border-[#00FFE0]/20 bg-transparent text-[#F5F5F5] placeholder-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-[#00FFE0]"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#CFCFCF] mb-1">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full px-4 py-2 rounded-lg border border-[#00FFE0]/20 bg-transparent text-[#F5F5F5] placeholder-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-[#00FFE0]"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            {message && (
              <div className="text-green-500 text-sm text-center bg-green-50/10 border border-green-500/20 rounded-lg py-2 px-3">{message}</div>
            )}
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50/10 border border-red-500/20 rounded-lg py-2 px-3">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 rounded-lg bg-[#00FFE0] text-[#0A0F24] font-semibold hover:bg-[#00FFE0]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 
