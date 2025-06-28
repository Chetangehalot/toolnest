'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import useNotifications from '@/hooks/useNotifications';
import { useToast } from '@/components/ui/Toast';
import { 
  PencilIcon,
  DocumentTextIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  PaperAirplaneIcon,
  BellIcon,
  ArrowPathIcon,
  ChartBarIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';
import ConfirmModal from '@/components/ui/ConfirmModal';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    draft: { color: 'bg-slate-500/15 text-slate-300 border-slate-500/25', icon: DocumentTextIcon, label: 'Draft' },
    pending_approval: { color: 'bg-amber-500/15 text-amber-300 border-amber-500/25', icon: ClockIcon, label: 'Pending' },
    published: { color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25', icon: CheckCircleIcon, label: 'Published' },
    rejected: { color: 'bg-rose-500/15 text-rose-300 border-rose-500/25', icon: XCircleIcon, label: 'Rejected' }
  };

  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${config.color}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
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

export default function WriterDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  // Initialize real-time notifications
  useNotifications();
  
  const [posts, setPosts] = useState([]);
  const [trashedPosts, setTrashedPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'trash'
  const [stats, setStats] = useState({
    totalPosts: 0,
    publishedPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    pendingPosts: 0,
    trashedPosts: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (!['writer', 'manager', 'admin'].includes(session.user.role)) {
      router.push('/dashboard');
      return;
    }

    fetchWriterData();
  }, [session, status, router]);

  const fetchWriterData = async () => {
    try {
      setLoading(true);
      
      // Fetch all writer's posts (including trashed ones) using a special parameter
      const allPostsResponse = await fetch(`/api/blog/posts?author=${session.user.id}&includeTrash=true&limit=1000&populate=approvals`);
      if (!allPostsResponse.ok) throw new Error('Failed to fetch posts');
      const allPostsData = await allPostsResponse.json();
      
      const allPosts = allPostsData.posts || [];
      
      // Separate active and trashed posts
      const activePosts = allPosts.filter(post => !post.trashedByWriter && !post.permanentlyHiddenFromWriter);
      const trashed = allPosts.filter(post => post.trashedByWriter && !post.permanentlyHiddenFromWriter);
      
      setPosts(activePosts);
      setTrashedPosts(trashed);
      
      // Calculate stats
      const totalPosts = activePosts.length;
      const publishedPosts = activePosts.filter(p => p.status === 'published').length;
      const pendingPosts = activePosts.filter(p => p.status === 'pending_approval').length;
      const totalViews = activePosts.reduce((sum, p) => sum + (p.views || 0), 0);
      const totalLikes = activePosts.reduce((sum, p) => sum + (p.likes || 0), 0);
      const trashedPostsCount = trashed.length;
      
      setStats({
        totalPosts,
        publishedPosts,
        totalViews,
        totalLikes,
        pendingPosts,
        trashedPosts: trashedPostsCount
      });
      
    } catch (error) {
      setError('Failed to load writer data');
    } finally {
      setLoading(false);
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

  const handleDeletePost = async (postId) => {
    setActionLoading(postId);
    
    try {
      const response = await fetch(`/api/blog/posts/${postId}/delete`, {
        method: 'PATCH'
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to delete post');
      
      // Remove from current view (it's now in trash)
      setPosts(posts.filter(p => p._id !== postId));
      fetchWriterData(); // Refresh stats
      closeModal();
      
      // Show success message
      toast.success(data.message);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete post');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmitForApproval = async (postId) => {
    setActionLoading(postId);
    
    try {
      const response = await fetch(`/api/blog/posts/${postId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'pending_approval' })
      });
      
      if (!response.ok) throw new Error('Failed to submit post');
      
      // Update the post in local state immediately
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post._id === postId ? { ...post, status: 'pending_approval' } : post
        )
      );
      
      fetchWriterData(); // Refresh data
      closeModal();
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestorePost = async (postId) => {
    setActionLoading(postId);
    
    try {
      const response = await fetch(`/api/blog/posts/${postId}/restore`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' })
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to restore post');
      
      // Refresh data to update both active and trashed lists
      fetchWriterData();
      closeModal();
      
      toast.success('Post restored successfully');
    } catch (error) {
      console.error('Restore error:', error);
      toast.error(error.message || 'Failed to restore post');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePermanentDelete = async (postId) => {
    setActionLoading(postId);
    
    try {
      const response = await fetch(`/api/blog/posts/${postId}/delete?permanent=true`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to delete post permanently');
      
      // Remove from trashed posts
      setTrashedPosts(prev => prev.filter(post => post._id !== postId));
      fetchWriterData(); // Refresh stats
      closeModal();
      
      toast.success(data.message);
    } catch (error) {
      console.error('Permanent delete error:', error);
      toast.error(error.message || 'Failed to delete post permanently');
    } finally {
      setActionLoading(null);
    }
  };

  const getPostActions = (post) => {
    const actions = [];
    
    // Edit action - always available
    actions.push({
      key: 'edit',
      component: (
        <Link
          href={`/writer/posts/edit/${post._id}`}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-[#00FFE0]/20 to-[#00D4FF]/20 hover:from-[#00FFE0]/30 hover:to-[#00D4FF]/30 text-[#00FFE0] border border-[#00FFE0]/40 hover:border-[#00FFE0]/60 transition-all duration-200 shadow-sm hover:shadow-[#00FFE0]/10"
          title="Edit post"
        >
          <PencilIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Edit</span>
        </Link>
      )
    });
    
    // Status-specific actions
    if (post.status === 'draft' || post.status === 'unpublished') {
      actions.push({
        key: 'submit',
        component: (
          <button
            onClick={() => openConfirmModal({
              type: 'info',
              title: 'Submit for Approval',
              message: 'This will submit your post for review by the editorial team. Do you want to submit this post?',
              confirmText: 'Submit for Approval',
              onConfirm: () => handleSubmitForApproval(post._id),
              postId: post._id,
              action: 'submit'
            })}
            disabled={actionLoading === post._id}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 hover:border-amber-400/60 transition-all duration-200 shadow-sm hover:shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Submit for approval"
          >
            {actionLoading === post._id ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <PaperAirplaneIcon className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Submit</span>
          </button>
        )
      });
    }
    
    if (post.status === 'rejected') {
      actions.push({
        key: 'resubmit',
        component: (
          <button
            onClick={() => openConfirmModal({
              type: 'info',
              title: 'Resubmit for Approval',
              message: 'This will resubmit your previously rejected post for review. Make sure you have addressed the feedback.',
              confirmText: 'Resubmit for Approval',
              onConfirm: () => handleSubmitForApproval(post._id),
              postId: post._id,
              action: 'resubmit'
            })}
            disabled={actionLoading === post._id}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-sky-500/20 to-blue-500/20 hover:from-sky-500/30 hover:to-blue-500/30 text-sky-300 border border-sky-500/40 hover:border-sky-400/60 transition-all duration-200 shadow-sm hover:shadow-sky-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Resubmit for approval"
          >
            {actionLoading === post._id ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <PaperAirplaneIcon className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Resubmit</span>
          </button>
        )
      });
    }
    
    // View action for published posts
    if (post.status === 'published') {
      actions.push({
        key: 'view',
        component: (
          <Link
            href={`/blog/${post.slug}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400/60 transition-all duration-200 shadow-sm hover:shadow-emerald-500/10"
            title="View post"
          >
            <EyeIcon className="w-4 h-4" />
            <span className="hidden sm:inline">View Live</span>
          </Link>
        )
      });
    }
    
    // Delete action - always available
    actions.push({
      key: 'delete',
      component: (
        <button
          onClick={() => openConfirmModal({
            type: 'danger',
            title: 'Delete Post',
            message: post.status === 'published' 
              ? 'Are you sure you want to delete this post? It will be unpublished and moved to your Trash. You can delete it permanently later.'
              : 'Are you sure you want to delete this post? It will be moved to your Trash. You can delete it permanently later.',
            confirmText: 'Move to Trash',
            onConfirm: () => handleDeletePost(post._id),
            postId: post._id,
            action: 'delete'
          })}
          disabled={actionLoading === post._id}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-rose-500/20 to-red-500/20 hover:from-rose-500/30 hover:to-red-500/30 text-rose-300 border border-rose-500/40 hover:border-rose-400/60 transition-all duration-200 shadow-sm hover:shadow-rose-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete post"
        >
          {actionLoading === post._id ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <TrashIcon className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Delete</span>
        </button>
      )
    });
    
    return actions;
  };

  const getTrashPostActions = (post) => {
    const actions = [];
    
    // Restore action
    actions.push({
      key: 'restore',
      component: (
        <button
          onClick={() => openConfirmModal({
            type: 'info',
            title: 'Restore Post',
            message: 'This will restore the post from trash and make it available in your active posts. Do you want to restore this post?',
            confirmText: 'Restore Post',
            onConfirm: () => handleRestorePost(post._id),
            postId: post._id,
            action: 'restore'
          })}
          disabled={actionLoading === post._id}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400/60 transition-all duration-200 shadow-sm hover:shadow-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Restore post"
        >
          {actionLoading === post._id ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <ArrowPathIcon className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Restore</span>
        </button>
      )
    });
    
    // Delete Forever action
    actions.push({
      key: 'delete-forever',
      component: (
        <button
          onClick={() => openConfirmModal({
            type: 'danger',
            title: 'Delete Forever',
            message: 'Are you sure you want to permanently delete this post? This action cannot be undone and the post will be removed from your view forever.',
            confirmText: 'Delete Forever',
            onConfirm: () => handlePermanentDelete(post._id),
            postId: post._id,
            action: 'delete-forever'
          })}
          disabled={actionLoading === post._id}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-rose-500/20 to-red-500/20 hover:from-rose-500/30 hover:to-red-500/30 text-rose-300 border border-rose-500/40 hover:border-rose-400/60 transition-all duration-200 shadow-sm hover:shadow-rose-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete forever"
        >
          {actionLoading === post._id ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <TrashIcon className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Delete Forever</span>
        </button>
      )
    });
    
    return actions;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-[#0A0F24]/50 rounded mb-8 w-64"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-[#0A0F24]/50 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-red-500/10 backdrop-blur-lg border border-red-500/20 rounded-2xl p-8">
              <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-[#F5F5F5] mb-4">Error Loading Dashboard</h2>
            <p className="text-[#CFCFCF] mb-6">{error}</p>
            <button
                onClick={fetchWriterData}
              className="px-6 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-colors font-semibold"
            >
                Try Again
            </button>
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
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[#F5F5F5] mb-2">Writer Dashboard</h1>
                <p className="text-[#CFCFCF]">Manage your blog posts and track your writing progress</p>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A0F24]/50 border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 hover:scale-105 transition-all duration-200"
                  title="Return to user dashboard"
                >
                  <CogIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">User Dashboard</span>
                </Link>
                <Link
                  href="/writer/analytics"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A0F24]/50 border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 hover:scale-105 transition-all duration-200"
                >
                  <ChartBarIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Analytics</span>
                </Link>
                <Link
                  href="/writer/notifications"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#B936F4]/20 text-[#B936F4] border border-[#B936F4]/30 rounded-xl hover:bg-[#B936F4]/30 transition-colors font-medium"
                >
                  <BellIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Notifications</span>
                </Link>
                <Link
                  href="/writer/posts/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00FFE0] to-[#00D4FF] text-[#0A0F24] rounded-xl hover:from-[#00FFE0]/90 hover:to-[#00D4FF]/90 transition-all duration-300 font-semibold shadow-lg hover:shadow-[#00FFE0]/20"
                >
                  <PlusIcon className="w-5 h-5" />
                  New Post
                </Link>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                  activeTab === 'active'
                    ? 'bg-[#00FFE0]/20 text-[#00FFE0] border border-[#00FFE0]/40'
                    : 'text-[#CFCFCF] hover:text-[#F5F5F5] hover:bg-[#0A0F24]/30'
                }`}
                title="View active posts"
              >
                <DocumentTextIcon className="w-4 h-4" />
                Active Posts ({stats.totalPosts})
              </button>
            <button
                onClick={() => setActiveTab('trash')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer ${
                  activeTab === 'trash'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'text-[#CFCFCF] hover:text-[#F5F5F5] hover:bg-[#0A0F24]/30'
                }`}
                title="View trashed posts"
              >
                <TrashIcon className="w-4 h-4" />
                Trash ({stats.trashedPosts})
            </button>
          </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
          >
            <StatsCard 
              icon={DocumentTextIcon} 
              label="Total Posts" 
              value={stats.totalPosts} 
              color="text-[#00FFE0]"
            />
            <StatsCard 
              icon={CheckCircleIcon} 
              label="Published" 
              value={stats.publishedPosts} 
              color="text-emerald-300"
              bgColor="from-emerald-500/20 to-green-500/20"
            />
            <StatsCard 
              icon={ClockIcon} 
              label="Pending" 
              value={stats.pendingPosts} 
              color="text-amber-300"
              bgColor="from-amber-500/20 to-orange-500/20"
            />
            <StatsCard 
              icon={EyeIcon} 
              label="Total Views" 
              value={stats.totalViews} 
              color="text-sky-300"
              bgColor="from-sky-500/20 to-blue-500/20"
            />
            <StatsCard 
              icon={HeartIcon} 
              label="Total Likes" 
              value={stats.totalLikes} 
              color="text-rose-300"
              bgColor="from-rose-500/20 to-pink-500/20"
            />
          </motion.div>

          {/* Posts List */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6"
          >
            {activeTab === 'active' ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#F5F5F5]">Active Posts</h2>
                  <div className="text-sm text-[#CFCFCF]">
                    {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                </div>
                </div>

                {posts.length === 0 ? (
                  <div className="text-center py-12">
                    <DocumentTextIcon className="w-16 h-16 text-[#CFCFCF]/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[#F5F5F5] mb-2">No active posts</h3>
                    <p className="text-[#CFCFCF] mb-6">Start writing your first blog post to share your knowledge with the community.</p>
                    <Link
                      href="/writer/posts/new"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00FFE0] to-[#00D4FF] text-[#0A0F24] rounded-xl hover:from-[#00FFE0]/90 hover:to-[#00D4FF]/90 transition-colors font-semibold shadow-lg hover:shadow-[#00FFE0]/20"
                    >
                      <PlusIcon className="w-5 h-5" />
                      Create Your First Post
                    </Link>
              </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <motion.div
                        key={post._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-[#0A0F24]/30 border border-[#00FFE0]/10 rounded-xl p-4 hover:border-[#00FFE0]/20 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-[#F5F5F5] hover:text-[#00FFE0] transition-colors">
                                <Link href={`/writer/posts/edit/${post._id}`}>
                                  {post.title}
                                </Link>
                              </h3>
                              <StatusBadge status={post.status} />
            </div>
                            
                            {post.excerpt && (
                              <p className="text-[#CFCFCF] mb-3 line-clamp-2">{post.excerpt}</p>
                            )}
                            
                            <div className="flex items-center gap-4 text-sm text-[#CFCFCF]">
                              <span>Created: {new Date(post.createdAt).toLocaleDateString()}</span>
                              {post.publishedAt && (
                                <span>Published: {new Date(post.publishedAt).toLocaleDateString()}</span>
                              )}
              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                  <EyeIcon className="w-4 h-4" />
                                  {post.views || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <HeartIcon className="w-4 h-4" />
                                  {post.likes || 0}
                                </span>
                </div>
              </div>
            </div>
                          
                          <div className="flex items-center gap-2 ml-4 flex-wrap">
                            {getPostActions(post).map((action) => (
                              <div key={action.key}>
                                {action.component}
                </div>
                            ))}
            </div>
          </div>

                        {post.rejectionReason && (
                          <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                            <p className="text-rose-300 text-sm">
                              <strong>Rejection Reason:</strong> {post.rejectionReason}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-[#F5F5F5]">Trash</h2>
                    <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-medium">
                      🗑️ Deleted Posts
                    </span>
                  </div>
                  <div className="text-sm text-[#CFCFCF]">
                    {trashedPosts.length} {trashedPosts.length === 1 ? 'post' : 'posts'}
                  </div>
                  </div>

                {trashedPosts.length === 0 ? (
                  <div className="text-center py-12">
                    <TrashIcon className="w-16 h-16 text-[#CFCFCF]/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[#F5F5F5] mb-2">Trash is empty</h3>
                    <p className="text-[#CFCFCF]">Deleted blog posts will appear here. You can restore them or delete them permanently.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 px-4 py-3 rounded-lg mb-6">
                      <p className="text-sm">
                        <strong>Note:</strong> Posts in trash are unpublished and hidden from your active posts. 
                        You can restore them or permanently delete them.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      {trashedPosts.map((post) => (
                        <motion.div
                          key={post._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 hover:border-red-500/30 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-[#F5F5F5]">
                                  {post.title}
                                </h3>
                                <StatusBadge status={post.status} />
                                <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-medium">
                                  TRASHED
                                </span>
                              </div>
                              
                              {post.excerpt && (
                                <p className="text-[#CFCFCF] mb-3 line-clamp-2">{post.excerpt}</p>
                              )}
                              
                              <div className="flex items-center gap-4 text-sm text-[#CFCFCF]">
                                <span>Created: {new Date(post.createdAt).toLocaleDateString()}</span>
                                {post.deletedAt && (
                                  <span className="text-red-300">
                                    Moved to Trash: {new Date(post.deletedAt).toLocaleDateString()}
                                  </span>
                                )}
                                <div className="flex items-center gap-3">
                                  <span className="flex items-center gap-1">
                                    <EyeIcon className="w-4 h-4" />
                                    {post.views || 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <HeartIcon className="w-4 h-4" />
                                    {post.likes || 0}
                                  </span>
                  </div>
                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 ml-4 flex-wrap">
                              {getTrashPostActions(post).map((action) => (
                                <div key={action.key}>
                                  {action.component}
              </div>
            ))}
          </div>
              </div>
                        </motion.div>
                      ))}
            </div>
                  </>
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
