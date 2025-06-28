'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import BlogEditor from '@/components/Blog/BlogEditor';

export default function EditBlogPost() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

    if (id) {
      fetchPost();
    }
  }, [id, session, status]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/blog/posts/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Post not found');
        } else if (response.status === 403) {
          setError('Access denied');
        } else {
          setError('Failed to load post');
        }
        return;
      }

      const data = await response.json();
      setPost(data.post);
    } catch (error) {
      console.error('Error fetching post:', error);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/admin/blogs');
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8">
                <div className="h-8 bg-[#00FFE0]/20 rounded mb-4"></div>
                <div className="h-4 bg-[#00FFE0]/10 rounded mb-2"></div>
                <div className="h-4 bg-[#00FFE0]/10 rounded mb-6 w-3/4"></div>
                <div className="h-64 bg-[#00FFE0]/10 rounded"></div>
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
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0A0F24]/50 backdrop-blur-lg border border-red-500/20 rounded-2xl p-8"
            >
              <h1 className="text-2xl font-bold text-red-400 mb-4">{error}</h1>
              <p className="text-[#CFCFCF] mb-6">
                {error === 'Post not found' 
                  ? 'The blog post you\'re trying to edit doesn\'t exist or has been removed.'
                  : error === 'Access denied'
                  ? 'You don\'t have permission to edit this post.'
                  : 'Something went wrong while loading the post.'
                }
              </p>
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-colors font-semibold"
              >
                Back to Blog Management
              </button>
            </motion.div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!post) return null;

  return (
    <Layout>
      <BlogEditor
        postId={id}
        initialData={post}
        onBack={handleBack}
        mode="edit"
      />
    </Layout>
  );
} 