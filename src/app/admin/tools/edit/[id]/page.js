'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';
import ToolForm from '@/components/ToolForm';
import { useToast } from '@/components/ui/Toast';

export default function EditToolPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const toolId = params.id;

  const [tool, setTool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (session.user.role !== 'admin' && session.user.role !== 'manager') {
      router.push('/dashboard');
      return;
    }

    if (toolId) {
      fetchTool();
    }
  }, [session, status, router, toolId]);

  const fetchTool = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/tools/${toolId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tool');
      }

      const data = await response.json();
      setTool(data.tool);
    } catch (error) {
      console.error('Error fetching tool:', error);
      setError('Failed to load tool');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (payload) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/tools/${toolId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // Show success toast
        toast.success(`Tool "${data.tool.name}" updated successfully!`, {
          title: 'Tool Updated',
          duration: 4000
        });
        
        // Redirect after showing toast
        setTimeout(() => {
          router.push('/admin/tools');
        }, 2000);
      } else {
        setError(data.error || 'Failed to update tool');
        toast.error(data.error || 'Failed to update tool', {
          title: 'Update Failed',
          duration: 6000
        });
      }
    } catch (error) {
      console.error('Error updating tool:', error);
      const errorMessage = 'Network error. Please check your connection and try again.';
      setError(errorMessage);
      toast.error(errorMessage, {
        title: 'Network Error',
        duration: 6000
      });
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0A0F24]">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
              {/* Header Skeleton */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-32 h-10 bg-[#0A0F24]/50 rounded-xl animate-pulse"></div>
                <div>
                  <div className="w-48 h-8 bg-[#0A0F24]/50 rounded animate-pulse mb-2"></div>
                  <div className="w-64 h-5 bg-[#0A0F24]/50 rounded animate-pulse"></div>
                </div>
              </div>

              {/* Form Skeleton */}
              <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="w-full h-12 bg-[#0A0F24]/50 rounded-xl animate-pulse"></div>
                    <div className="w-full h-12 bg-[#0A0F24]/50 rounded-xl animate-pulse"></div>
                  </div>
                  <div className="w-full h-24 bg-[#0A0F24]/50 rounded-xl animate-pulse"></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="w-full h-12 bg-[#0A0F24]/50 rounded-xl animate-pulse"></div>
                    <div className="w-full h-12 bg-[#0A0F24]/50 rounded-xl animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error && !tool) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0A0F24] flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-400 text-lg mb-4">{error}</div>
            <Link 
              href="/admin/tools"
              className="px-6 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-xl font-semibold hover:bg-[#00FFE0]/90 transition-colors"
            >
              Back to Tools
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#0A0F24]">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center mb-8"
            >
              <div>
                <h1 className="text-4xl font-bold text-[#F5F5F5]">Edit Tool</h1>
                <p className="text-[#CFCFCF] text-lg">
                  {tool?.name ? `Editing "${tool.name}"` : 'Update tool information'}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Loading Indicator */}
                {saving && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30"
                  >
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                    Updating tool...
                  </motion.div>
                )}
                
                <Link 
                  href="/admin/tools"
                  className="flex items-center gap-2 px-6 py-3 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 transition-colors cursor-pointer hover:scale-105 duration-200"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  Back to Tools
                </Link>
              </div>
            </motion.div>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl"
                >
                  <div className="flex items-start gap-4">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-red-400 mb-2">
                        Failed to Update Tool
                      </h3>
                      <p className="text-[#CFCFCF] mb-3">{error}</p>
                      <button
                        onClick={() => setError(null)}
                        className="px-4 py-2 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tool Form */}
            {tool && (
              <ToolForm
                mode="edit"
                initialData={tool}
                onSubmit={handleSubmit}
                isLoading={saving}
                error={null} // We handle errors above
                success={false}
              />
            )}

            {/* Cancel Button */}
            <div className="mt-8 flex justify-center">
              <Link
                href="/admin/tools"
                className="px-8 py-3 bg-[#0A0F24] border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 transition-colors font-semibold"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 