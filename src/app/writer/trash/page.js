'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeftIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function WriterTrashPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [trashedPosts, setTrashedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user.role !== 'writer') {
      router.push('/login');
      return;
    }

    fetchTrashedPosts();
  }, [session, status, router]);

  const fetchTrashedPosts = async () => {
    try {
      setLoading(true);
      // Fetch only the writer's own posts to filter on client side
      const response = await fetch(`/api/blog/posts?author=${session.user.id}&limit=1000&populate=approvals`);
      const data = await response.json();
      
      if (response.ok) {
        // Filter for trashed posts that aren't permanently hidden
        const trashed = data.posts.filter(post => 
          post.trashedByWriter && !post.permanentlyHiddenFromWriter
        );
        setTrashedPosts(trashed);
      } else {
        setError(data.error || 'Failed to fetch trashed posts');
      }
    } catch (error) {
      console.error('Error fetching trashed posts:', error);
      setError('Failed to fetch trashed posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDelete = async (postId) => {
    if (!confirm('Are you sure you want to permanently delete this post? This action cannot be undone and the post will be removed from your view forever.')) {
      return;
    }

    try {
      setDeletingId(postId);
      const response = await fetch(`/api/blog/posts/${postId}/delete?permanent=true`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setTrashedPosts(prev => prev.filter(post => post._id !== postId));
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Failed to delete post permanently');
      }
    } catch (error) {
      console.error('Error deleting post permanently:', error);
      toast.error('Failed to delete post permanently');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      draft: 'bg-gray-500/20 text-gray-300',
      pending_approval: 'bg-yellow-500/20 text-yellow-300',
      published: 'bg-green-500/20 text-green-300',
      rejected: 'bg-red-500/20 text-red-300',
      unpublished: 'bg-orange-500/20 text-orange-300'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-500/20 text-gray-300'}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0A0F24] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FFE0] mx-auto mb-4"></div>
          <p className="text-[#F5F5F5]">Loading trash...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F24] text-[#F5F5F5]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#00FFE0] to-[#0066CC] bg-clip-text text-transparent">
              🗑️ Trash
            </h1>
            <p className="text-[#CFCFCF] text-lg mt-1">
              Manage your deleted blog posts
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              href="/writer/dashboard"
              className="flex items-center gap-2 px-6 py-3 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 transition-all duration-200 cursor-pointer hover:scale-105"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Trash Content */}
        {trashedPosts.length === 0 ? (
          <div className="text-center py-12">
            <TrashIcon className="w-16 h-16 text-[#B0B0B0] mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-[#F5F5F5] mb-2">
              Your trash is empty
            </h3>
            <p className="text-[#B0B0B0]">
              Deleted blog posts will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Info Banner */}
            <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 px-4 py-3 rounded-lg">
              <p className="text-sm">
                <strong>Note:</strong> Posts in trash are unpublished and hidden from your dashboard. 
                You can permanently delete them here, but admins can still access and recover them if needed.
              </p>
            </div>

            {/* Trashed Posts List */}
            {trashedPosts.map((post) => (
              <div
                key={post._id}
                className="bg-[#1A1A2E]/50 backdrop-blur-lg border border-[#00FFE0]/10 rounded-xl p-6 hover:border-[#00FFE0]/20 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-[#F5F5F5]">
                        {post.title}
                      </h3>
                      {getStatusBadge(post.status)}
                      <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-medium">
                        TRASHED
                      </span>
                    </div>
                    
                    <p className="text-[#B0B0B0] text-sm mb-3 line-clamp-2">
                      {post.excerpt || 'No excerpt available'}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs text-[#B0B0B0]">
                      <span>Created: {formatDate(post.createdAt)}</span>
                      {post.deletedAt && (
                        <span>Deleted: {formatDate(post.deletedAt)}</span>
                      )}
                      <span>{post.readTime} min read</span>
                      <span>👁 {post.views} views</span>
                      <span>❤️ {post.likes} likes</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {/* View Post Button */}
                    {post.status === 'published' && (
                      <Link
                        href={`/blog/${post.slug}`}
                        className="flex items-center gap-1 px-3 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                      >
                        <EyeIcon className="w-4 h-4" />
                        View
                      </Link>
                    )}
                    
                    {/* Delete Forever Button */}
                    <button
                      onClick={() => handlePermanentDelete(post._id)}
                      disabled={deletingId === post._id}
                      className="flex items-center gap-1 px-3 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors text-sm disabled:opacity-50"
                    >
                      <TrashIcon className="w-4 h-4" />
                      {deletingId === post._id ? 'Deleting...' : 'Delete Forever'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
