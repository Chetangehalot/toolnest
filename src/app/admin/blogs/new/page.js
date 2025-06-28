'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import BlogEditor from '@/components/Blog/BlogEditor';

export default function NewBlogPost() {
  const { data: session, status } = useSession();
  const router = useRouter();

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
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-[#0A0F24]/50 rounded mb-8 w-64"></div>
              <div className="h-96 bg-[#0A0F24]/50 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!session || !['manager', 'admin'].includes(session.user.role)) {
    return null;
  }

  return (
    <BlogEditor 
      mode="create"
      onBack={() => router.push('/admin/blogs')}
    />
  );
} 
