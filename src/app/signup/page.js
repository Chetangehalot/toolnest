'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NeuralNetwork from '@/components/NeuralNetwork';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Redirect to login page after successful signup
      router.push('/login?message=Account created successfully! Please log in.');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0F24] py-12 px-4 relative">
      <NeuralNetwork />
      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8 shadow-xl">
          <h2 className="text-3xl font-bold text-[#F5F5F5] text-center mb-2">Create your account</h2>
          <p className="text-center text-[#CFCFCF] mb-6">
            Or{' '}
            <Link href="/login" className="text-[#00FFE0] hover:underline">sign in to your existing account</Link>
          </p>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#CFCFCF] mb-1">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-4 py-2 rounded-lg border border-[#00FFE0]/20 bg-transparent text-[#F5F5F5] placeholder-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-[#00FFE0]"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
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
                autoComplete="new-password"
                required
                className="w-full px-4 py-2 rounded-lg border border-[#00FFE0]/20 bg-transparent text-[#F5F5F5] placeholder-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-[#00FFE0]"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50/10 border border-red-500/20 rounded-lg py-2 px-3">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 rounded-lg bg-[#00FFE0] text-[#0A0F24] font-semibold hover:bg-[#00FFE0]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 
