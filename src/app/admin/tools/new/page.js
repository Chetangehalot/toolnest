'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';
import ToolForm from '@/components/ToolForm';
import { useToast } from '@/components/ui/Toast';

export default function AddToolPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

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
  }, [session, status, router]);

  const handleSubmit = async (payload) => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        // Show success toast
        toast.success(`Tool "${data.tool.name}" created successfully!`, {
          title: 'Tool Created',
          duration: 4000
        });
        
        // Redirect after showing toast
        setTimeout(() => {
          router.push('/admin/tools');
        }, 2000);
      } else {
        setError(data.error || 'Failed to create tool');
        toast.error(data.error || 'Failed to create tool', {
          title: 'Creation Failed',
          duration: 6000
        });
      }
    } catch (error) {
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

  if (status === 'loading') {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0A0F24] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#00FFE0] mx-auto mb-4"></div>
            <p className="text-[#F5F5F5] text-lg">Loading...</p>
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
                <h1 className="text-4xl font-bold text-[#F5F5F5]">Add New Tool</h1>
                <p className="text-[#CFCFCF] text-lg">Create a new AI tool for the directory</p>
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
                    Creating tool...
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
                        Failed to Create Tool
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
            <ToolForm
              mode="add"
              onSubmit={handleSubmit}
              isLoading={saving}
              error={null} // We handle errors above
              success={false}
            />

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
