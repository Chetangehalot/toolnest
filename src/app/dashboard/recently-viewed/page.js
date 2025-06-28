'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, ClockIcon } from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';
import ToolCard from '@/components/ToolCard';
import { CardSkeleton } from '@/components/ui/SkeletonLoader';

export default function RecentlyViewedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [recentViews, setRecentViews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    
    if (session) {
      fetchRecentViews();
    }
  }, [status, router, session]);

  const fetchRecentViews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/recently-viewed');
      if (response.ok) {
        const data = await response.json();
        setRecentViews(data.recentViews || []);
      }
    } catch (error) {
      console.error('Error fetching recent views:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show skeleton while loading
  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <div className="h-8 bg-[#00FFE0]/10 rounded w-64 mb-2 animate-pulse"></div>
                <div className="h-5 bg-[#00FFE0]/10 rounded w-48 animate-pulse"></div>
              </div>
              <div className="h-12 bg-[#00FFE0]/10 rounded w-48 animate-pulse"></div>
            </div>

            {/* Stats Skeleton */}
            <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 mb-8 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#00FFE0]/10 rounded-xl"></div>
                <div>
                  <div className="h-6 bg-[#00FFE0]/10 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-[#00FFE0]/10 rounded w-48"></div>
                </div>
              </div>
            </div>

            {/* Cards Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect in useEffect
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#F5F5F5] cursor-text select-text">Recently Viewed Tools</h1>
              <p className="text-[#CFCFCF] cursor-text select-text" title="Your browsing history">Tools you've recently visited</p>
            </div>
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 px-6 py-3 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 hover:scale-105 transition-all duration-200 cursor-pointer"
              title="Return to main dashboard"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Dashboard
            </Link>
          </div>

          {/* Stats Card */}
          {recentViews.length > 0 && (
            <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 mb-8 hover:border-[#00FFE0]/30 transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#FF4D4D]/20 rounded-xl flex items-center justify-center cursor-help" title="Recently viewed icon">
                  <ClockIcon className="w-6 h-6 text-[#FF4D4D]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#F5F5F5] mb-1 cursor-text select-text">
                    {recentViews.length} Recently Viewed {recentViews.length === 1 ? 'Tool' : 'Tools'}
                  </h3>
                  <p className="text-[#CFCFCF] text-sm cursor-help" title="Your recent browsing activity">
                    Based on your recent browsing activity
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          {recentViews.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-32 h-32 bg-gradient-to-r from-[#FF4D4D]/20 to-[#FF6B35]/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <ClockIcon className="w-16 h-16 text-[#FF4D4D]" />
              </div>
              <h3 className="text-2xl font-bold text-[#F5F5F5] mb-4">No Recently Viewed Tools</h3>
              <p className="text-[#CFCFCF] mb-8 max-w-md mx-auto leading-relaxed cursor-text select-text">
                Start exploring AI tools to see them appear here. Your browsing history will help you find tools you've visited before.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/tools"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 hover:scale-105 transition-all duration-200 font-semibold cursor-pointer"
                  title="Browse all available AI tools"
                >
                  Browse Tools
                </Link>
                <Link
                  href="/top-rated"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A0F24]/50 border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 hover:scale-105 transition-all duration-200 font-semibold cursor-pointer"
                  title="View top-rated AI tools"
                >
                  Top Rated
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <p className="text-[#CFCFCF] cursor-text select-text" title="Number of tools in your history">
                  Showing {recentViews.length} recently viewed {recentViews.length === 1 ? 'tool' : 'tools'}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentViews.map((view) => (
                  <div key={view.tool._id} className="relative">
                    <ToolCard
                      {...view.tool}
                      slug={view.tool.slug}
                    />
                    {/* Viewed timestamp overlay */}
                    <div className="absolute top-4 right-4 bg-[#0A0F24]/80 backdrop-blur-sm border border-[#00FFE0]/20 rounded-lg px-2 py-1 cursor-help" title={`Viewed on ${new Date(view.viewedAt).toLocaleString()}`}>
                      <p className="text-[#CFCFCF] text-xs">
                        {new Date(view.viewedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Clear History Button */}
              <div className="text-center mt-12">
                <button
                  onClick={() => {
                                            if (confirm('Are you sure you want to clear your viewing history? This action cannot be undone.')) {
                      // Clear history functionality
                      }
                  }}
                  className="px-6 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/30 hover:scale-105 transition-all duration-200 font-semibold cursor-pointer"
                  title="Clear all recently viewed tools from your history"
                >
                  Clear History
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 
