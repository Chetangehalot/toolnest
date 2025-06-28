'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  UserGroupIcon,
  ArrowPathIcon,
  NoSymbolIcon,
  HeartIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';
import ConfirmModal from '@/components/ui/ConfirmModal';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    draft: { color: 'bg-slate-500/15 text-slate-300 border-slate-500/25', icon: DocumentTextIcon, label: 'Draft' },
    pending_approval: { color: 'bg-amber-500/15 text-amber-300 border-amber-500/25', icon: ClockIcon, label: 'Pending' },
    published: { color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25', icon: CheckCircleIcon, label: 'Published' },
    rejected: { color: 'bg-rose-500/15 text-rose-300 border-rose-500/25', icon: XCircleIcon, label: 'Rejected' },
    unpublished: { color: 'bg-orange-500/15 text-orange-300 border-orange-500/25', icon: NoSymbolIcon, label: 'Unpublished' }
  };

  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border ${config.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};

const SoftDeleteIndicator = ({ post }) => {
  if (!post.trashedByWriter && !post.permanentlyHiddenFromWriter && !post.unpublishedBy) return null;
  
  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      {post.trashedByWriter && (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-500/15 text-red-300 border border-red-500/25">
          <TrashIcon className="w-3 h-3" />
          🗑️ Trashed by Writer
        </span>
      )}
      {post.permanentlyHiddenFromWriter && (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-500/15 text-gray-300 border border-gray-500/25">
          <EyeIcon className="w-3 h-3 opacity-50" />
          Hidden from Writer
        </span>
      )}
      {post.unpublishedBy && post.status === 'unpublished' && (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/25">
          <NoSymbolIcon className="w-3 h-3" />
          🚫 Unpublished by {post.unpublishedBy?.name || 'Admin'}
        </span>
      )}
      <div className="flex flex-wrap items-center gap-3 text-xs text-[#B0B0B0]">
        {post.deletedAt && (
          <span>
            <strong>Deleted:</strong> {new Date(post.deletedAt).toLocaleDateString()}
          </span>
        )}
        {post.unpublishedAt && (
          <span>
            <strong>Unpublished:</strong> {new Date(post.unpublishedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};

const StatsCard = ({ icon: Icon, label, value, color = "text-[#00FFE0]", bgColor = "from-[#00FFE0]/20 to-[#B936F4]/20" }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-xl p-6"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[#CFCFCF] text-sm mb-1">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${bgColor} flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  </motion.div>
);

export default function BlogManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    published: 0,
    rejected: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    author: '',
    page: 1,
    limit: 10
  });
  const [searchInput, setSearchInput] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    hasNext: false,
    hasPrev: false
  });
  const [actionLoading, setActionLoading] = useState(null);
  
  // Modal states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: null,
    postId: null,
    action: null
  });

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setIsFiltering(true);
        setFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
      }
          }, 250);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    if (!['manager', 'admin'].includes(session.user.role)) {
      router.push('/dashboard');
      return;
    }

    fetchPosts();
  }, [session, status, router, filters]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const response = await fetch(`/api/blog/posts?${params}&populate=approvals`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      
      const data = await response.json();
      setPosts(data.posts || []);
      setPagination(data.pagination || {});
      setIsFiltering(false);
      setIsInitialLoad(false);
      
      // Calculate stats
      const allPostsResponse = await fetch('/api/blog/posts?limit=1000&populate=approvals');
      const allPostsData = await allPostsResponse.json();
      const allPosts = allPostsData.posts || [];
      
      setStats({
        total: allPosts.length,
        pending: allPosts.filter(p => p.status === 'pending_approval').length,
        published: allPosts.filter(p => p.status === 'published').length,
        rejected: allPosts.filter(p => p.status === 'rejected').length
      });
      
    } catch (error) {
      setError('Failed to load posts');
      setIsFiltering(false);
      setIsInitialLoad(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (postId, newStatus) => {
    setActionLoading(postId);
    
    try {
      const response = await fetch(`/api/blog/posts/${postId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!response.ok) throw new Error('Failed to update post status');
      
      // Update the post in the local state immediately
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId ? { ...post, status: newStatus } : post
        )
      );
      
      // Refresh data to get updated stats
      fetchPosts();
      closeModal();
      
    } catch (error) {
      console.error('Status change error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (postId) => {
    setActionLoading(postId);
    
    try {
      const response = await fetch(`/api/blog/posts/${postId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete post');
      
      // Remove the post from local state immediately
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      
      // Refresh data to get updated stats
      fetchPosts();
      closeModal();
      
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (postId, action) => {
    setActionLoading(postId);
    
    try {
      const response = await fetch(`/api/blog/posts/${postId}/restore`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, status: action === 'repost' ? 'published' : undefined })
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to restore post');
      
      // Update the post in local state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId ? { ...post, ...data.post } : post
        )
      );
      
      // Refresh data to get updated stats
      fetchPosts();
      closeModal();
      
      // Show success message (will be handled by toast system)
      } catch (error) {
      console.error('Restore error:', error);
      // Show error message (will be handled by toast system)
      console.error('❌ Restore failed:', error.message || 'Failed to restore post');
    } finally {
      setActionLoading(null);
    }
  };

  const openConfirmModal = (config) => {
    setConfirmModal({
      isOpen: true,
      ...config
    });
  };

  const closeModal = () => {
    setConfirmModal({
      isOpen: false,
      type: 'info',
      title: '',
      message: '',
      confirmText: 'Confirm',
      onConfirm: null,
      postId: null,
      action: null
    });
  };

  const getStatusAction = (post) => {
    // If post is soft deleted, show restore options
    if (post.trashedByWriter) {
      return {
        key: 'restore',
        label: '🔁 Repost Blog',
        icon: ArrowPathIcon,
        className: 'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-500/20 to-indigo-500/20 hover:from-blue-500/30 hover:to-indigo-500/30 text-blue-300 border border-blue-500/40 hover:border-blue-400/60 transition-all duration-200 shadow-sm hover:shadow-blue-500/10',
        onClick: () => openConfirmModal({
          type: 'info',
          title: 'Restore & Repost Blog',
          message: 'This will restore the blog from trash and republish it for readers. Do you want to repost this blog?',
          confirmText: 'Repost Blog',
          onConfirm: () => handleRestore(post._id, 'repost'),
          postId: post._id,
          action: 'repost'
        })
      };
    }

    switch (post.status) {
      case 'draft':
        return {
          key: 'publish',
          label: 'Publish',
          icon: CheckCircleIcon,
          className: 'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 hover:from-emerald-500/30 hover:to-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400/60 transition-all duration-200 shadow-sm hover:shadow-emerald-500/10',
          onClick: () => openConfirmModal({
            type: 'success',
            title: 'Publish Draft Post',
            message: 'This will publish the draft post and make it visible to all readers. Do you want to publish this post?',
            confirmText: 'Publish',
            onConfirm: () => handleStatusChange(post._id, 'published'),
            postId: post._id,
            action: 'publish'
          })
        };
        
      case 'pending_approval':
        return {
          key: 'approve',
          label: 'Approve & Publish',
          icon: CheckCircleIcon,
          className: 'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 hover:from-emerald-500/30 hover:to-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400/60 transition-all duration-200 shadow-sm hover:shadow-emerald-500/10',
          onClick: () => openConfirmModal({
            type: 'success',
            title: 'Approve & Publish Post',
            message: 'This will make the post visible to all readers. Do you want to approve and publish this post?',
            confirmText: 'Approve & Publish',
            onConfirm: () => handleStatusChange(post._id, 'published'),
            postId: post._id,
            action: 'approve'
          })
        };
        
      case 'published':
        return {
          key: 'unpublish',
          label: 'Unpublish',
          icon: NoSymbolIcon,
          className: 'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 hover:border-amber-400/60 transition-all duration-200 shadow-sm hover:shadow-amber-500/10',
          onClick: () => openConfirmModal({
            type: 'warning',
            title: 'Unpublish Post',
            message: 'This will make the post invisible to readers. Do you want to unpublish this post?',
            confirmText: 'Unpublish',
            onConfirm: () => handleStatusChange(post._id, 'unpublished'),
            postId: post._id,
            action: 'unpublish'
          })
        };
        
      case 'rejected':
      case 'unpublished':
        return {
          key: 'publish',
          label: 'Publish',
          icon: CheckCircleIcon,
          className: 'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 hover:from-emerald-500/30 hover:to-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400/60 transition-all duration-200 shadow-sm hover:shadow-emerald-500/10',
          onClick: () => openConfirmModal({
            type: 'success',
            title: 'Publish Post',
            message: `This will make the ${post.status === 'rejected' ? 'previously rejected' : 'unpublished'} post visible to readers. Do you want to publish this post?`,
            confirmText: 'Publish',
            onConfirm: () => handleStatusChange(post._id, 'published'),
            postId: post._id,
            action: 'publish'
          })
        };
        
      default:
        return null;
    }
  };

  const handleFilterChange = (key, value) => {
    if (key === 'search') {
      setSearchInput(value);
    } else {
      setFilters(prev => ({
        ...prev,
        [key]: value,
        page: 1 // Reset to first page when filtering
      }));
    }
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  if (loading && isInitialLoad) {
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
              <div className="flex items-center gap-4">
                <div className="w-32 h-12 bg-[#00FFE0]/10 rounded-xl animate-pulse"></div>
                <div className="w-40 h-12 bg-[#00FFE0]/10 rounded-xl animate-pulse"></div>
                <div className="w-40 h-12 bg-[#00FFE0]/10 rounded-xl animate-pulse"></div>
              </div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="w-20 h-4 bg-[#00FFE0]/10 rounded-lg mb-2"></div>
                      <div className="w-12 h-8 bg-[#00FFE0]/10 rounded-lg"></div>
                    </div>
                    <div className="w-12 h-12 bg-[#00FFE0]/10 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters Skeleton */}
            <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6 mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-5 h-5 bg-[#00FFE0]/10 rounded animate-pulse"></div>
                <div className="w-16 h-6 bg-[#00FFE0]/10 rounded-lg animate-pulse"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i}>
                    <div className="w-16 h-4 bg-[#00FFE0]/10 rounded-lg animate-pulse mb-2"></div>
                    <div className="w-full h-10 bg-[#00FFE0]/10 rounded-lg animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Posts Table Skeleton */}
            <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0A0F24]/30 border-b border-[#00FFE0]/10">
                    <tr>
                      {['Post', 'Author', 'Status', 'Date', 'Stats', 'Actions'].map((header, i) => (
                        <th key={i} className="px-6 py-4 text-left">
                          <div className="w-16 h-4 bg-[#00FFE0]/10 rounded-lg animate-pulse"></div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(8)].map((_, index) => (
                      <tr key={index} className="border-b border-[#00FFE0]/5 animate-pulse">
                        <td className="px-6 py-4">
                          <div>
                            <div className="w-48 h-5 bg-[#00FFE0]/10 rounded-lg mb-2"></div>
                            <div className="w-64 h-4 bg-[#00FFE0]/10 rounded-lg"></div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[#00FFE0]/10 rounded-full"></div>
                            <div className="w-20 h-4 bg-[#00FFE0]/10 rounded-lg"></div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-24 h-6 bg-[#00FFE0]/10 rounded-full"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-20 h-4 bg-[#00FFE0]/10 rounded-lg"></div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="w-16 h-3 bg-[#00FFE0]/10 rounded"></div>
                            <div className="w-20 h-3 bg-[#00FFE0]/10 rounded"></div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <div className="w-8 h-8 bg-[#00FFE0]/10 rounded-lg"></div>
                            <div className="w-8 h-8 bg-[#00FFE0]/10 rounded-lg"></div>
                            <div className="w-8 h-8 bg-[#00FFE0]/10 rounded-lg"></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
              <h1 className="text-3xl font-bold text-[#F5F5F5]">Blog Management</h1>
              <p className="text-[#CFCFCF]">Manage and moderate all blog posts</p>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/admin"
                className="flex items-center gap-2 px-6 py-3 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Admin
              </Link>
              <Link
                href="/admin/blogs/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00FFE0] to-[#00D4FF] text-[#0A0F24] rounded-xl hover:from-[#00FFE0]/90 hover:to-[#00D4FF]/90 transition-all duration-300 font-semibold shadow-lg hover:shadow-[#00FFE0]/20"
              >
                <PlusIcon className="w-5 h-5" />
                Create New Post
              </Link>
              <Link
                href="/admin/writers"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#B936F4] to-[#9333EA] text-white rounded-xl hover:from-[#B936F4]/90 hover:to-[#9333EA]/90 transition-all duration-300 font-semibold shadow-lg hover:shadow-[#B936F4]/20"
              >
                <UserGroupIcon className="w-5 h-5" />
                Writers Overview
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <StatsCard 
              icon={DocumentTextIcon} 
              label="Total Posts" 
              value={stats.total} 
              color="text-[#00FFE0]"
            />
            <StatsCard 
              icon={ClockIcon} 
              label="Pending Approval" 
              value={stats.pending} 
              color="text-amber-300"
              bgColor="from-amber-500/20 to-orange-500/20"
            />
            <StatsCard 
              icon={CheckCircleIcon} 
              label="Published" 
              value={stats.published} 
              color="text-emerald-300"
              bgColor="from-emerald-500/20 to-green-500/20"
            />
            <StatsCard 
              icon={XCircleIcon} 
              label="Rejected" 
              value={stats.rejected} 
              color="text-rose-300"
              bgColor="from-rose-500/20 to-red-500/20"
            />
          </motion.div>

          {/* Filters */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#F5F5F5] mb-2" title="Filter by post status">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-4 py-2 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] focus:border-[#00FFE0] focus:outline-none transition-all duration-200 cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="published">Published</option>
                  <option value="rejected">Rejected</option>
                  <option value="unpublished">Unpublished</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#F5F5F5] mb-2" title="Search posts by title or content">Search</label>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search posts..."
                  className="w-full px-4 py-2 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] placeholder-[#CFCFCF] focus:border-[#00FFE0] focus:outline-none transition-all duration-200 cursor-text"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#F5F5F5] mb-2" title="Number of posts per page">Posts per page</label>
                <select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] focus:border-[#00FFE0] focus:outline-none transition-all duration-200 cursor-pointer"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchInput('');
                    setFilters({ status: '', search: '', author: '', page: 1, limit: 10 });
                  }}
                  className="w-full px-4 py-2 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-all duration-200 font-semibold cursor-pointer hover:scale-105"
                  title="Clear all filters"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </motion.div>

          {/* Posts Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl overflow-hidden"
          >
            {isFiltering && (
              <div className="absolute inset-0 bg-[#0A0F24]/70 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center">
                <div className="flex items-center gap-3 px-6 py-3 bg-[#0A0F24]/90 backdrop-blur-lg border border-[#00FFE0]/20 rounded-xl">
                  <div className="w-4 h-4 border-2 border-[#00FFE0] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[#F5F5F5] text-sm font-medium">Filtering posts...</span>
                </div>
              </div>
            )}
            {posts.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="w-16 h-16 text-[#CFCFCF]/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-[#F5F5F5] mb-2">No posts found</h3>
                <p className="text-[#CFCFCF]">No posts match your current filters.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#0A0F24]/30 border-b border-[#00FFE0]/10">
                      <tr>
                        <th className="px-6 py-4 text-left text-[#F5F5F5] font-semibold">Post</th>
                        <th className="px-6 py-4 text-left text-[#F5F5F5] font-semibold">Author</th>
                        <th className="px-6 py-4 text-left text-[#F5F5F5] font-semibold">Status</th>
                        <th className="px-6 py-4 text-left text-[#F5F5F5] font-semibold">Date</th>
                        <th className="px-6 py-4 text-left text-[#F5F5F5] font-semibold">Stats</th>
                        <th className="px-6 py-4 text-left text-[#F5F5F5] font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map((post) => {
                        const statusAction = getStatusAction(post);
                        
                        return (
                          <tr key={post._id} className="border-b border-[#00FFE0]/5 hover:bg-[#0A0F24]/20 transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <h4 className="text-[#F5F5F5] font-medium mb-1">{post.title}</h4>
                                {post.excerpt && (
                                  <p className="text-[#CFCFCF] text-sm line-clamp-2">{post.excerpt}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1 text-sm">
                                <div className="flex items-center gap-2">
                                  <UserIcon className="w-4 h-4 text-[#CFCFCF]" />
                                  <div>
                                    <p className="text-[#F5F5F5] font-medium">
                                      {post.authorId?.name || 'Unknown'}
                                    </p>
                                    <p className="text-[#CFCFCF] text-xs">
                                      {post.authorId?.email || 'No email'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-2">
                                <StatusBadge status={post.status} />
                                <SoftDeleteIndicator post={post} />
                                {post.status === 'published' && post.approvedBy && (
                                  <div className="text-xs text-[#CFCFCF]">
                                    <p><strong>Approved by:</strong> {post.approvedBy?.name || 'Unknown'}</p>
                                    {post.approvedAt && (
                                      <p><strong>Date:</strong> {new Date(post.approvedAt).toLocaleDateString('en-US', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      })}</p>
                                    )}
                                  </div>
                                )}
                                {post.status === 'rejected' && post.rejectedBy && (
                                  <div className="text-xs text-rose-300">
                                    <p><strong>Rejected by:</strong> {post.rejectedBy?.name || 'Unknown'}</p>
                                    {post.rejectedAt && (
                                      <p><strong>Date:</strong> {new Date(post.rejectedAt).toLocaleDateString('en-US', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      })}</p>
                                    )}
                                    {post.rejectionReason && (
                                      <p className="mt-1 italic">&ldquo;{post.rejectionReason}&rdquo;</p>
                                    )}
                                  </div>
                                )}
                                {post.repostedBy && (
                                  <div className="text-xs text-blue-300">
                                    <p><strong>Reposted by:</strong> {post.repostedBy?.name || 'Unknown'}</p>
                                    {post.repostedAt && (
                                      <p><strong>Date:</strong> {new Date(post.repostedAt).toLocaleDateString('en-US', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      })}</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-[#CFCFCF] text-sm">
                                <CalendarIcon className="w-4 h-4" />
                                <div>
                                  <p>Created: {new Date(post.createdAt).toLocaleDateString('en-US', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                  })}</p>
                                  {post.publishedAt && (
                                    <p className="text-xs text-emerald-300">
                                      Published: {new Date(post.publishedAt).toLocaleDateString('en-US', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3 text-sm text-[#CFCFCF]">
                                <span className="flex items-center gap-1">
                                  <EyeIcon className="w-4 h-4" />
                                  {post.views || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <HeartIcon className="w-4 h-4" />
                                  {post.likes || 0}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 flex-wrap min-w-0">
                                {/* Primary Status Action */}
                                {statusAction && (
                                  <button
                                    onClick={statusAction.onClick}
                                    disabled={actionLoading === post._id}
                                    className={`${statusAction.className} disabled:opacity-50 disabled:cursor-not-allowed min-w-0 flex-shrink-0`}
                                    title={statusAction.label}
                                  >
                                    {actionLoading === post._id ? (
                                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <statusAction.icon className="w-4 h-4 flex-shrink-0" />
                                    )}
                                    <span className="hidden sm:inline truncate">{statusAction.label}</span>
                                  </button>
                                )}
                                
                                {/* Standard Actions */}
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/blog/${post.slug}`}
                                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-sky-500/20 to-blue-500/20 hover:from-sky-500/30 hover:to-blue-500/30 text-sky-300 border border-sky-500/40 hover:border-sky-400/60 transition-all duration-200 shadow-sm hover:shadow-sky-500/10"
                                    title="View post"
                                  >
                                    <EyeIcon className="w-4 h-4" />
                                    <span className="hidden lg:inline">View</span>
                                  </Link>
                                  
                                  <Link
                                    href={`/admin/blogs/edit/${post._id}`}
                                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-[#00FFE0]/20 to-[#00D4FF]/20 hover:from-[#00FFE0]/30 hover:to-[#00D4FF]/30 text-[#00FFE0] border border-[#00FFE0]/40 hover:border-[#00FFE0]/60 transition-all duration-200 shadow-sm hover:shadow-[#00FFE0]/10"
                                    title="Edit post"
                                  >
                                    <PencilIcon className="w-4 h-4" />
                                    <span className="hidden lg:inline">Edit</span>
                                  </Link>
                                  
                                  <button
                                    onClick={() => openConfirmModal({
                                      type: 'danger',
                                      title: 'Delete Post',
                                      message: 'Are you sure you want to delete this post? This action cannot be undone.',
                                      confirmText: 'Delete Post',
                                      onConfirm: () => handleDelete(post._id),
                                      postId: post._id,
                                      action: 'delete'
                                    })}
                                    disabled={actionLoading === post._id}
                                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-rose-500/20 to-red-500/20 hover:from-rose-500/30 hover:to-red-500/30 text-rose-300 border border-rose-500/40 hover:border-rose-400/60 transition-all duration-200 shadow-sm hover:shadow-rose-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Delete post"
                                  >
                                    {actionLoading === post._id ? (
                                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <TrashIcon className="w-4 h-4" />
                                    )}
                                    <span className="hidden lg:inline">Delete</span>
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-[#00FFE0]/10">
                    <div className="text-[#CFCFCF] text-sm">
                      Showing {((pagination.currentPage - 1) * filters.limit) + 1} to {Math.min(pagination.currentPage * filters.limit, pagination.total)} of {pagination.total} posts
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={!pagination.hasPrev}
                        className="flex items-center gap-1 px-3 py-2 bg-[#0A0F24]/30 border border-[#00FFE0]/20 text-[#F5F5F5] rounded-lg hover:border-[#00FFE0]/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeftIcon className="w-4 h-4" />
                        Previous
                      </button>
                      
                      <span className="px-4 py-2 text-[#F5F5F5]">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>
                      
                      <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={!pagination.hasNext}
                        className="flex items-center gap-1 px-3 py-2 bg-[#0A0F24]/30 border border-[#00FFE0]/20 text-[#F5F5F5] rounded-lg hover:border-[#00FFE0]/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        type={confirmModal.type}
        isLoading={actionLoading === confirmModal.postId}
      />
    </Layout>
  );
} 
