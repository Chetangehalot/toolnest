'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useNotifications from '@/hooks/useNotifications';
import { 
  UsersIcon, 
  SparklesIcon, 
  StarIcon, 
  ShieldCheckIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  CogIcon,
  UserGroupIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';
import { DashboardSkeleton } from '@/components/ui/SkeletonLoader';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Initialize real-time notifications for admins
  useNotifications();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTools: 0,
    totalReviews: 0
  });
  const [loading, setLoading] = useState(true);
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

    fetchAdminStats();
  }, [session, status, router]);

  const fetchAdminStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setError(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch admin statistics:', response.status, errorData);
        setError(`Failed to fetch admin statistics: ${errorData.error || response.status}`);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      setError(`Error loading admin statistics: ${error.message}`);
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
            <DashboardSkeleton />
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0A0F24] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ExclamationTriangleIcon className="w-12 h-12 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-[#F5F5F5] mb-4">Error Loading Dashboard</h2>
            <p className="text-[#CFCFCF] mb-6 cursor-text select-text">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 hover:scale-105 transition-all duration-200 font-semibold cursor-pointer"
              title="Retry loading the dashboard"
            >
              Retry
            </button>
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
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-[#F5F5F5] mb-2 cursor-text select-text">
                {session?.user?.role === 'admin' ? 'Admin Dashboard' : 'Manager Dashboard'}
              </h1>
              <p className="text-[#CFCFCF] text-lg cursor-text select-text">
                Platform management and oversight tools
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="px-4 py-2 bg-[#0A0F24]/50 border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 hover:scale-105 transition-all duration-200 cursor-pointer"
                title="Return to user dashboard"
              >
                User Dashboard
              </Link>
            </div>
          </div>

          {/* Main Stats Grid - 3 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 hover:border-[#00FFE0]/30 hover:scale-105 transition-all duration-200 cursor-help group" title="Total registered users on the platform">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#CFCFCF] text-sm font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-[#F5F5F5] cursor-text select-text">{stats.totalUsers}</p>
                  <p className="text-xs text-[#CFCFCF] mt-1">Active platform members</p>
                </div>
                <div className="w-12 h-12 bg-[#00FFE0]/20 rounded-xl flex items-center justify-center group-hover:bg-[#00FFE0]/30 transition-colors">
                  <UsersIcon className="w-6 h-6 text-[#00FFE0]" />
                </div>
              </div>
            </div>
            
            <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#B936F4]/20 rounded-2xl p-6 hover:border-[#B936F4]/30 hover:scale-105 transition-all duration-200 cursor-help group" title="Total AI tools in the directory">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#CFCFCF] text-sm font-medium">Total Tools</p>
                  <p className="text-3xl font-bold text-[#F5F5F5] cursor-text select-text">{stats.totalTools}</p>
                  <p className="text-xs text-[#CFCFCF] mt-1">AI tools catalog</p>
                </div>
                <div className="w-12 h-12 bg-[#B936F4]/20 rounded-xl flex items-center justify-center group-hover:bg-[#B936F4]/30 transition-colors">
                  <SparklesIcon className="w-6 h-6 text-[#B936F4]" />
                </div>
              </div>
            </div>
            
            <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#FF4D4D]/20 rounded-2xl p-6 hover:border-[#FF4D4D]/30 hover:scale-105 transition-all duration-200 cursor-help group" title="Total user reviews and feedback">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#CFCFCF] text-sm font-medium">Total Reviews</p>
                  <p className="text-3xl font-bold text-[#F5F5F5] cursor-text select-text">{stats.totalReviews}</p>
                  <p className="text-xs text-[#CFCFCF] mt-1">User feedback</p>
                </div>
                <div className="w-12 h-12 bg-[#FF4D4D]/20 rounded-xl flex items-center justify-center group-hover:bg-[#FF4D4D]/30 transition-colors">
                  <StarIcon className="w-6 h-6 text-[#FF4D4D]" />
                </div>
              </div>
            </div>
          </div>

          {/* Management Panels Grid - 3 Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* 1st: User Management */}
            <Link 
              href="/admin/users" 
              className="block cursor-pointer hover:scale-105 transition-all duration-200 group"
              title="Manage user accounts and roles"
            >
              <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#B936F4]/20 rounded-2xl p-8 hover:border-[#B936F4]/40 transition-all duration-300 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-[#B936F4]/20 rounded-2xl flex items-center justify-center group-hover:bg-[#B936F4]/30 transition-colors">
                    <UsersIcon className="w-8 h-8 text-[#B936F4]" />
                  </div>
                  <ArrowRightIcon className="w-6 h-6 text-[#CFCFCF] group-hover:text-[#B936F4] group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-2xl font-bold text-[#F5F5F5] mb-3">User Management</h3>
                <p className="text-[#CFCFCF] text-sm leading-relaxed">
                  Manage user accounts, roles, and permissions. Monitor user activity and handle account issues.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-[#B936F4]">
                  <UserGroupIcon className="w-4 h-4" />
                  <span>Roles & Permissions</span>
                </div>
              </div>
            </Link>

            {/* 2nd: Tool Management */}
            <Link 
              href="/admin/tools" 
              className="block cursor-pointer hover:scale-105 transition-all duration-200 group"
              title="Manage AI tools and categories"
            >
              <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8 hover:border-[#00FFE0]/40 transition-all duration-300 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-[#00FFE0]/20 rounded-2xl flex items-center justify-center group-hover:bg-[#00FFE0]/30 transition-colors">
                    <SparklesIcon className="w-8 h-8 text-[#00FFE0]" />
                  </div>
                  <ArrowRightIcon className="w-6 h-6 text-[#CFCFCF] group-hover:text-[#00FFE0] group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-2xl font-bold text-[#F5F5F5] mb-3">Tool Management</h3>
                <p className="text-[#CFCFCF] text-sm leading-relaxed">
                  Add, edit, and manage AI tools in the directory. Control tool categories, pricing, and availability.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-[#00FFE0]">
                  <CogIcon className="w-4 h-4" />
                  <span>Configure & Organize</span>
                </div>
              </div>
            </Link>

            {/* 3rd: Review Moderation */}
            <Link 
              href="/admin/reviews" 
              className="block cursor-pointer hover:scale-105 transition-all duration-200 group"
              title="Moderate and manage user reviews"
            >
              <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#FF4D4D]/20 rounded-2xl p-8 hover:border-[#FF4D4D]/40 transition-all duration-300 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-[#FF4D4D]/20 rounded-2xl flex items-center justify-center group-hover:bg-[#FF4D4D]/30 transition-colors">
                    <StarIcon className="w-8 h-8 text-[#FF4D4D]" />
                  </div>
                  <ArrowRightIcon className="w-6 h-6 text-[#CFCFCF] group-hover:text-[#FF4D4D] group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-2xl font-bold text-[#F5F5F5] mb-3">Review Moderation</h3>
                <p className="text-[#CFCFCF] text-sm leading-relaxed">
                  Moderate user reviews and feedback. Handle inappropriate content and maintain review quality.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-[#FF4D4D]">
                  <ShieldCheckIcon className="w-4 h-4" />
                  <span>Content Moderation</span>
                </div>
              </div>
            </Link>

            {/* 4th: Blog Management */}
            <Link 
              href="/admin/blogs" 
              className="block cursor-pointer hover:scale-105 transition-all duration-200 group"
              title="Manage blog posts and content"
            >
              <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#4ECDC4]/20 rounded-2xl p-8 hover:border-[#4ECDC4]/40 transition-all duration-300 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-[#4ECDC4]/20 rounded-2xl flex items-center justify-center group-hover:bg-[#4ECDC4]/30 transition-colors">
                    <DocumentTextIcon className="w-8 h-8 text-[#4ECDC4]" />
                  </div>
                  <ArrowRightIcon className="w-6 h-6 text-[#CFCFCF] group-hover:text-[#4ECDC4] group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-2xl font-bold text-[#F5F5F5] mb-3">Blog Management</h3>
                <p className="text-[#CFCFCF] text-sm leading-relaxed">
                  Manage blog posts and content. Review submissions, moderate content, and oversee publications.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-[#4ECDC4]">
                  <DocumentTextIcon className="w-4 h-4" />
                  <span>Content Publishing</span>
                </div>
              </div>
            </Link>

            {/* 5th: Analytics & Insights */}
            <Link 
              href="/admin/analytics" 
              className="block cursor-pointer hover:scale-105 transition-all duration-200 group"
              title="View platform analytics and performance metrics"
            >
              <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#F59E0B]/20 rounded-2xl p-8 hover:border-[#F59E0B]/40 transition-all duration-300 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-[#F59E0B]/20 rounded-2xl flex items-center justify-center group-hover:bg-[#F59E0B]/30 transition-colors">
                    <ChartBarIcon className="w-8 h-8 text-[#F59E0B]" />
                  </div>
                  <ArrowRightIcon className="w-6 h-6 text-[#CFCFCF] group-hover:text-[#F59E0B] group-hover:translate-x-1 transition-all" />
                </div>
                <h3 className="text-2xl font-bold text-[#F5F5F5] mb-3">Analytics & Insights</h3>
                <p className="text-[#CFCFCF] text-sm leading-relaxed">
                  Monitor content performance, track user engagement, and analyze platform-wide metrics and trends.
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-[#F59E0B]">
                  <ChartBarIcon className="w-4 h-4" />
                  <span>Track & Analyze</span>
                </div>
              </div>
            </Link>

            {/* Future Functions Placeholder */}
            <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#CFCFCF]/10 rounded-2xl p-8 transition-all duration-300 h-full opacity-60">
              <div className="flex items-center justify-between mb-6">
                <div className="w-16 h-16 bg-[#CFCFCF]/10 rounded-2xl flex items-center justify-center">
                  <CogIcon className="w-8 h-8 text-[#CFCFCF]/50" />
                </div>
                <ArrowRightIcon className="w-6 h-6 text-[#CFCFCF]/30" />
              </div>
              <h3 className="text-2xl font-bold text-[#CFCFCF]/50 mb-3">Future Functions</h3>
              <p className="text-[#CFCFCF]/40 text-sm leading-relaxed">
                Additional administrative functions and features will be added here as the platform grows.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-[#CFCFCF]/40">
                <CogIcon className="w-4 h-4" />
                <span>Coming Soon</span>
              </div>
            </div>
          </div>


        </div>
      </div>
    </Layout>
  );
} 
