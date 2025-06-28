'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StarIcon } from '@heroicons/react/20/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { EyeIcon, EyeSlashIcon, TrashIcon, PencilIcon, ChatBubbleLeftRightIcon, FunnelIcon, ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function AdminReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    visible: 0,
    hidden: 0
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [replying, setReplying] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    confirmText: '',
    onConfirm: null
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    // Allow both admin and manager access to review moderation
    if (session.user.role !== 'admin' && session.user.role !== 'manager') {
      router.push('/dashboard');
      return;
    }

    fetchReviews();
  }, [session, status, router]);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/admin/reviews');
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        
        // Calculate stats
        const total = data.reviews.length;
        const visible = data.reviews.filter(r => r.status === 'visible').length;
        const hidden = data.reviews.filter(r => r.status === 'hidden').length;
        setStats({ total, visible, hidden });
        setIsInitialLoad(false);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setIsInitialLoad(false);
    } finally {
      setLoading(false);
    }
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      type: 'warning',
      title: '',
      message: '',
      confirmText: '',
      onConfirm: null
    });
  };

  const handleHideReview = async (reviewId) => {
    const review = reviews.find(r => r._id === reviewId);
    if (!review) return;

    setConfirmModal({
      isOpen: true,
      type: 'warning',
      title: 'Hide Review',
      message: `Are you sure you want to hide this review? It will no longer be visible to users.`,
      confirmText: 'Hide Review',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/reviews/${reviewId}/hide`, {
            method: 'PATCH'
          });
          if (response.ok) {
            fetchReviews();
          }
        } catch (error) {
          console.error('Error hiding review:', error);
        }
        closeConfirmModal();
      }
    });
  };

  const handleRestoreReview = async (reviewId) => {
    const review = reviews.find(r => r._id === reviewId);
    if (!review) return;

    setConfirmModal({
      isOpen: true,
      type: 'success',
      title: 'Restore Review',
      message: `Are you sure you want to restore this review? It will be visible to users again.`,
      confirmText: 'Restore Review',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/reviews/${reviewId}/restore`, {
            method: 'PATCH'
          });
          if (response.ok) {
            fetchReviews();
          }
        } catch (error) {
          console.error('Error restoring review:', error);
        }
        closeConfirmModal();
      }
    });
  };

  const handleReply = async (reviewId) => {
    if (!replyText.trim()) return;
    
    try {
      const response = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText })
      });
      if (response.ok) {
        setReplyText('');
        setReplyingTo(null);
        fetchReviews();
      }
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    const review = reviews.find(r => r._id === reviewId);
    if (!review) return;

    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Delete Review',
      message: `Are you sure you want to permanently delete this review? This action cannot be undone.`,
      confirmText: 'Delete Review',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/reviews/${reviewId}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            fetchReviews();
          }
        } catch (error) {
          console.error('Error deleting review:', error);
        }
        closeConfirmModal();
      }
    });
  };

  const filteredReviews = reviews.filter(review => {
    // Apply search filter
    if (searchQuery) {
      const matchesSearch = 
        (review.content?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (review.tool?.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (review.user?.username?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      if (review.status !== statusFilter) return false;
    }

    // Apply rating filter
    if (ratingFilter !== 'all') {
      if (review.rating !== parseInt(ratingFilter)) return false;
    }

    // Legacy filter support
    if (filter !== 'all') {
      return review.status === filter;
    }

    return true;
  });

  if (status === 'loading' || (loading && isInitialLoad)) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <div className="w-48 h-8 bg-[#00FFE0]/10 rounded-lg animate-pulse mb-2"></div>
                <div className="w-64 h-5 bg-[#00FFE0]/10 rounded-lg animate-pulse"></div>
              </div>
              <div className="w-32 h-12 bg-[#00FFE0]/10 rounded-xl animate-pulse"></div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="w-24 h-4 bg-[#00FFE0]/10 rounded-lg mb-2"></div>
                      <div className="w-16 h-8 bg-[#00FFE0]/10 rounded-lg"></div>
                    </div>
                    <div className="w-12 h-12 bg-[#00FFE0]/10 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Search and Filter Skeleton */}
            <div className="mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 h-12 bg-[#00FFE0]/10 rounded-xl animate-pulse"></div>
                <div className="w-40 h-12 bg-[#00FFE0]/10 rounded-xl animate-pulse"></div>
              </div>
            </div>

            {/* Reviews List Skeleton */}
            <div className="space-y-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6 animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#00FFE0]/10 rounded-full"></div>
                      <div>
                        <div className="w-24 h-4 bg-[#00FFE0]/10 rounded-lg mb-1"></div>
                        <div className="w-32 h-3 bg-[#00FFE0]/10 rounded-lg"></div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="w-16 h-6 bg-[#00FFE0]/10 rounded-full"></div>
                      <div className="w-20 h-8 bg-[#00FFE0]/10 rounded-lg"></div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="w-full h-4 bg-[#00FFE0]/10 rounded-lg mb-2"></div>
                    <div className="w-3/4 h-4 bg-[#00FFE0]/10 rounded-lg mb-2"></div>
                    <div className="w-1/2 h-4 bg-[#00FFE0]/10 rounded-lg"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="w-20 h-4 bg-[#00FFE0]/10 rounded-lg"></div>
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-[#00FFE0]/10 rounded-lg"></div>
                      <div className="w-8 h-8 bg-[#00FFE0]/10 rounded-lg"></div>
                      <div className="w-8 h-8 bg-[#00FFE0]/10 rounded-lg"></div>
                    </div>
                  </div>
                </div>
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
              <h1 className="text-3xl font-bold text-[#F5F5F5]">Review Moderation</h1>
              <p className="text-[#CFCFCF]">Manage and moderate user reviews across all tools</p>
            </div>
            <Link 
              href="/admin"
              className="flex items-center gap-2 px-6 py-3 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Admin
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 hover:border-[#00FFE0]/40 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#CFCFCF] text-sm font-medium">Total Reviews</p>
                  <p className="text-3xl font-bold text-[#F5F5F5]">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📝</span>
                </div>
              </div>
            </div>
            
            <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 hover:border-[#00FFE0]/40 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#CFCFCF] text-sm font-medium">Visible</p>
                  <p className="text-3xl font-bold text-[#00FFE0]">{stats.visible}</p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <EyeIcon className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 hover:border-[#00FFE0]/40 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#CFCFCF] text-sm font-medium">Hidden</p>
                  <p className="text-3xl font-bold text-[#FF4D4D]">{stats.hidden}</p>
                </div>
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <EyeSlashIcon className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#F5F5F5] mb-2" title="Search reviews by content or tool name">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search reviews..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] placeholder-[#CFCFCF] focus:border-[#00FFE0] focus:outline-none transition-all duration-200 cursor-text"
                  />
                  {searchInput !== searchQuery && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-[#00FFE0] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F5F5F5] mb-2" title="Filter by review status">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] focus:border-[#00FFE0] focus:outline-none transition-all duration-200 cursor-pointer"
                >
                  <option value="all">All Reviews</option>
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#F5F5F5] mb-2" title="Filter by review rating">Rating</label>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] focus:border-[#00FFE0] focus:outline-none transition-all duration-200 cursor-pointer"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchInput('');
                    setSearchQuery('');
                    setStatusFilter('all');
                    setRatingFilter('all');
                  }}
                  className="w-full px-4 py-2 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-all duration-200 font-semibold cursor-pointer hover:scale-105"
                  title="Clear all filters"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
          
          {/* Reviews List */}
          <div className="relative space-y-6">
            {(searchInput !== searchQuery) && (
              <div className="absolute inset-0 bg-[#0A0F24]/60 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center">
                <div className="flex items-center gap-3 px-6 py-3 bg-[#0A0F24]/90 backdrop-blur-lg border border-[#00FFE0]/20 rounded-xl">
                  <div className="w-4 h-4 border-2 border-[#00FFE0] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[#F5F5F5] text-sm font-medium">Searching reviews...</span>
                </div>
              </div>
            )}
            {filteredReviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-[#CFCFCF] text-lg">
                  {filter === 'all' ? 'No reviews to moderate yet.' : `No ${filter} reviews found.`}
                </p>
              </div>
            ) : (
              filteredReviews.map((review) => (
                <div key={review._id} className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8 hover:border-[#00FFE0]/40 transition-all duration-300 hover:shadow-xl">
                  {/* Review Header */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-xl font-bold text-[#F5F5F5]">
                          {review.toolId?.name || 'Unknown Tool'}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          review.status === 'visible' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                          'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}>
                          {review.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-[#CFCFCF] text-sm">
                        <span>by {review.userId?.name || 'Anonymous'}</span>
                        <span>•</span>
                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star}>
                              {star <= review.rating ? (
                                <StarIcon className="h-4 w-4 text-yellow-400" />
                              ) : (
                                <StarOutlineIcon className="h-4 w-4 text-gray-400" />
                              )}
                            </span>
                          ))}
                          <span className="ml-1">{review.rating}/5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Review Content */}
                  <div className="mb-6">
                    <p className="text-[#F5F5F5] text-lg leading-relaxed mb-4">{review.comment}</p>
                    
                    {/* Pros and Cons */}
                    {(review.pros?.length > 0 || review.cons?.length > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {review.pros?.length > 0 && (
                          <div className="bg-[#0A0F24] rounded-xl p-4">
                            <h4 className="text-[#00FFE0] font-medium mb-2">Pros</h4>
                            <ul className="space-y-1">
                              {review.pros.map((pro, index) => (
                                <li key={index} className="flex items-center text-[#CFCFCF] text-sm">
                                  <span className="w-1.5 h-1.5 bg-[#00FFE0] rounded-full mr-2"></span>
                                  {pro}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {review.cons?.length > 0 && (
                          <div className="bg-[#0A0F24] rounded-xl p-4">
                            <h4 className="text-[#FF4D4D] font-medium mb-2">Cons</h4>
                            <ul className="space-y-1">
                              {review.cons.map((con, index) => (
                                <li key={index} className="flex items-center text-[#CFCFCF] text-sm">
                                  <span className="w-1.5 h-1.5 bg-[#FF4D4D] rounded-full mr-2"></span>
                                  {con}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Admin Reply */}
                    {review.reply && (
                      <div className="bg-[#0A0F24] rounded-xl p-4 border border-[#00FFE0]/20">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[#00FFE0] text-sm font-medium">
                            {review.replyAuthor || 'Admin'} –
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                            review.replyRole === 'admin' 
                              ? 'bg-[#B936F4]/20 text-[#B936F4] border-[#B936F4]/30'
                              : review.replyRole === 'manager'
                              ? 'bg-[#FF6B35]/20 text-[#FF6B35] border-[#FF6B35]/30'
                              : review.replyRole === 'writer'
                              ? 'bg-[#4ECDC4]/20 text-[#4ECDC4] border-[#4ECDC4]/30'
                              : 'bg-[#00FFE0]/20 text-[#00FFE0] border-[#00FFE0]/30'
                          }`}>
                            {review.replyRole ? review.replyRole.charAt(0).toUpperCase() + review.replyRole.slice(1) : 'Admin'}
                          </span>
                        </div>
                        <p className="text-[#F5F5F5]">{review.reply}</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => review.status === 'visible' ? handleHideReview(review._id) : handleRestoreReview(review._id)}
                        className={`p-2 rounded-lg transition-all duration-200 cursor-pointer hover:scale-105 ${
                          review.status === 'visible'
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }`}
                        title={review.status === 'visible' ? 'Hide Review' : 'Restore Review'}
                      >
                        {review.status === 'visible' ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                      </button>
                      
                      <button
                        onClick={() => setReplyingTo(replyingTo === review._id ? null : review._id)}
                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all duration-200 cursor-pointer hover:scale-105"
                        title="Reply to Review"
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteReview(review._id)}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all duration-200 cursor-pointer hover:scale-105"
                        title="Delete Review"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Reply Form */}
                  {replyingTo === review._id && (
                    <div className="mt-4 bg-[#0A0F24]/30 rounded-xl p-4 border border-[#00FFE0]/20">
                      <h4 className="text-[#F5F5F5] font-medium mb-3">Reply to Review</h4>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write your reply..."
                        rows={3}
                        className="w-full px-4 py-3 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] placeholder-[#CFCFCF] focus:border-[#00FFE0] focus:outline-none transition-all duration-200 cursor-text resize-y"
                      />
                      <div className="flex items-center gap-3 mt-3">
                        <button
                          onClick={() => handleReply(review._id)}
                          disabled={!replyText.trim() || replying}
                          className={`px-4 py-2 bg-[#00FFE0] text-[#0A0F24] rounded-lg font-medium transition-all duration-200 ${
                            !replyText.trim() || replying
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-[#00FFE0]/90 cursor-pointer hover:scale-105'
                          }`}
                        >
                          {replying ? (
                            <>
                              <div className="w-4 h-4 border-2 border-[#0A0F24] border-t-transparent rounded-full animate-spin inline-block mr-2" />
                              Sending...
                            </>
                          ) : (
                            'Send Reply'
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                          className="px-4 py-2 bg-[#0A0F24] border border-[#00FFE0]/20 text-[#F5F5F5] rounded-lg hover:border-[#00FFE0]/40 transition-all duration-200 cursor-pointer hover:scale-105"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={closeConfirmModal}
          onConfirm={confirmModal.onConfirm}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          type={confirmModal.type}
        />
      </div>
    </Layout>
  );
} 
