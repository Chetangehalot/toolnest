'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function SearchResultsRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      // Redirect to new unified search page
      router.replace(`/search?q=${encodeURIComponent(query)}`);
    } else {
      // Redirect to main search page if no query
      router.replace('/search');
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#0A0F24] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FFE0] mx-auto mb-4"></div>
        <p className="text-[#F5F5F5] text-lg">Redirecting to search...</p>
      </div>
    </div>
  );
} 
