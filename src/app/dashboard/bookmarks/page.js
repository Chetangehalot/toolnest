'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StarIcon } from '@heroicons/react/20/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { BookmarkIcon, TrashIcon, ArrowLeftIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';
import { CardSkeleton } from '@/components/ui/SkeletonLoader';

export default function BookmarksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingIds, setRemovingIds] = useState(new Set());

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    fetchBookmarks();
  }, [session, status, router]);

  const fetchBookmarks = async () => {
    try {
      const response = await fetch('/api/bookmarks');
      if (response.ok) {
        const data = await response.json();
        setBookmarks(data.bookmarks);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (toolId) => {
    setRemovingIds(prev => new Set([...prev, toolId]));
    
    try {
      const response = await fetch(`/api/bookmarks?toolId=${toolId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setBookmarks(bookmarks.filter(tool => tool._id !== toolId));
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
    } finally {
      setRemovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(toolId);
        return newSet;
      });
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
                <div className="h-10 bg-[#00FFE0]/10 rounded w-64 mb-2 animate-pulse"></div>
                <div className="h-6 bg-[#00FFE0]/10 rounded w-96 animate-pulse"></div>
              </div>
              <div className="h-12 bg-[#00FFE0]/10 rounded w-48 animate-pulse"></div>
            </div>

            {/* Stats Skeleton */}
            <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 mb-8 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#00FFE0]/10 rounded-xl"></div>
                  <div>
                    <div className="h-4 bg-[#00FFE0]/10 rounded w-24 mb-2"></div>
                    <div className="h-8 bg-[#00FFE0]/10 rounded w-16"></div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 bg-[#00FFE0]/10 rounded w-20 mb-2"></div>
                  <div className="h-5 bg-[#00FFE0]/10 rounded w-24"></div>
                </div>
              </div>
            </div>

            {/* Cards Skeleton Grid */}
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-[#F5F5F5] mb-2">My Bookmarks</h1>
              <p className="text-[#CFCFCF] text-lg cursor-text select-text" title="Your saved AI tools collection">Your saved AI tools and favorites</p>
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

          {/* Stats */}
          <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 mb-8 hover:border-[#00FFE0]/30 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#00FFE0]/20 rounded-xl flex items-center justify-center cursor-help" title="Bookmarks icon">
                  <BookmarkIcon className="w-6 h-6 text-[#00FFE0]" />
                </div>
                <div>
                  <p className="text-[#CFCFCF] text-sm font-medium cursor-help" title="Number of bookmarked tools">Total Bookmarks</p>
                  <p className="text-2xl font-bold text-[#F5F5F5] cursor-text select-text">{bookmarks.length}</p>
                </div>
              </div>
              <div className="text-right cursor-help" title="Last update information">
                <p className="text-[#CFCFCF] text-sm">Last updated</p>
                <p className="text-[#F5F5F5] font-medium cursor-text select-text">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          {/* Bookmarks Grid */}
          {bookmarks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-32 h-32 bg-gradient-to-r from-[#00FFE0]/20 to-[#B936F4]/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <BookmarkIcon className="w-16 h-16 text-[#00FFE0]" />
              </div>
              <h3 className="text-2xl font-bold text-[#F5F5F5] mb-4">No Bookmarks Yet</h3>
              <p className="text-[#CFCFCF] mb-8 max-w-md mx-auto leading-relaxed cursor-text select-text">
                Start exploring and bookmark your favorite AI tools to build your personal collection.
              </p>
              <Link
                href="/tools"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 hover:scale-105 transition-all duration-200 font-semibold cursor-pointer"
                title="Browse available AI tools to bookmark"
              >
                Browse Tools
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarks.map((tool) => (
                <div key={tool._id} className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 hover:border-[#00FFE0]/40 transition-all duration-300 hover:scale-105 hover:shadow-xl group">
                  {/* Tool Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#0A0F24] border border-[#00FFE0]/20 cursor-help" title={`${tool.name} logo`}>
                        <img 
                          src={tool.logo || '/images/placeholder-logo.jpeg'} 
                          alt={tool.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#F5F5F5] group-hover:text-[#00FFE0] transition-colors cursor-text select-text" title={`Tool name: ${tool.name}`}>{tool.name}</h3>
                        <p className="text-[#00FFE0] text-sm font-medium cursor-help" title={`Category: ${tool.category}`}>{tool.category}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveBookmark(tool._id)}
                      disabled={removingIds.has(tool._id)}
                      className={`w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                        removingIds.has(tool._id) 
                          ? 'cursor-wait opacity-50' 
                          : 'cursor-pointer hover:scale-110'
                      }`}
                      title="Remove from bookmarks"
                    >
                      {removingIds.has(tool._id) ? (
                        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <TrashIcon className="w-4 h-4 text-red-400" />
                      )}
                    </button>
                  </div>
                  
                  {/* Description */}
                  <p className="text-[#CFCFCF] text-sm mb-4 line-clamp-3 leading-relaxed cursor-text select-text" title="Tool description">
                    {tool.description}
                  </p>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-4 cursor-help" title={`Average rating: ${tool.rating ? tool.rating.toFixed(1) : '0.0'} out of 5 stars`}>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className="cursor-help" title={`${star} star${star > 1 ? 's' : ''}`}>
                          {star <= Math.floor(tool.rating || 0) ? (
                            <StarIcon className="h-4 w-4 text-yellow-400" />
                          ) : (
                            <StarOutlineIcon className="h-4 w-4 text-gray-400" />
                          )}
                        </span>
                      ))}
                    </div>
                    <span className="text-[#F5F5F5] text-sm font-medium cursor-text select-text">
                      {tool.rating ? tool.rating.toFixed(1) : '0.0'}
                    </span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      href={`/tools/${tool.slug}`}
                      className="flex-1 px-4 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 hover:scale-105 transition-all duration-200 font-semibold text-center cursor-pointer"
                      title={`View detailed information about ${tool.name}`}
                    >
                      View Tool
                    </Link>
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-3 bg-[#0A0F24] border border-[#00FFE0]/20 text-[#00FFE0] rounded-xl hover:border-[#00FFE0]/40 hover:scale-105 transition-all duration-200 cursor-pointer"
                      title={`Visit ${tool.name} website (opens in new tab)`}
                    >
                      <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 
