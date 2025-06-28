'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import NeuralNetwork from '@/components/NeuralNetwork';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'AccessDenied':
        return 'You do not have permission to sign in.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      case 'Default':
      default:
        return 'An error occurred during authentication.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0F24] py-12 px-4 relative">
      <NeuralNetwork />
      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8 shadow-xl">
          <h2 className="text-3xl font-bold text-[#F5F5F5] text-center mb-2">Authentication Error</h2>
          <p className="text-center text-[#CFCFCF] mb-6">
            {getErrorMessage(error)}
          </p>
          <div className="bg-red-50/10 border border-red-500/20 rounded-lg p-4 mb-6">
            <div className="text-red-500 text-sm text-center">
              <strong>Error:</strong> {error || 'Unknown error'}
            </div>
          </div>
          <div className="flex flex-col space-y-4">
            <Link
              href="/login"
              className="w-full flex justify-center py-2 px-4 rounded-lg bg-[#00FFE0] text-[#0A0F24] font-semibold hover:bg-[#00FFE0]/90 transition-colors"
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="w-full flex justify-center py-2 px-4 rounded-lg border border-[#00FFE0]/20 text-[#00FFE0] hover:bg-[#00FFE0]/10 transition-colors font-semibold"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 
