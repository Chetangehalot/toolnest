'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  UserIcon, 
  BookmarkIcon, 
  ClockIcon, 
  ArrowRightIcon,
  StarIcon,
  EyeIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';
import { DashboardSkeleton } from '@/components/ui/SkeletonLoader';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({
    bookmarks: 0,
    reviews: 0,
    recentlyViewed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
    
    if (session) {
      fetchUserStats();
    }
  }, [status, router, session]);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
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

  if (status === 'unauthenticated') {
    return null; // Will redirect in useEffect
  }

  const getRoleDisplay = (role) => {
    const roleConfig = {
      admin: { label: 'Admin', color: 'bg-[#B936F4]/20 text-[#B936F4] border-[#B936F4]/30' },
      manager: { label: 'Manager', color: 'bg-[#FF6B35]/20 text-[#FF6B35] border-[#FF6B35]/30' },
      writer: { label: 'Writer', color: 'bg-[#4ECDC4]/20 text-[#4ECDC4] border-[#4ECDC4]/30' },
      user: { label: 'User', color: 'bg-[#00FFE0]/20 text-[#00FFE0] border-[#00FFE0]/30' }
    };
    return roleConfig[role] || roleConfig.user;
  };

  const roleDisplay = getRoleDisplay(session?.user?.role);

  // Helper function to check if user is staff
  const isStaff = (role) => {
    return ['admin', 'manager', 'writer'].includes(role);
  };

  // Helper function to get staff panel URL
  const getStaffPanelUrl = (role) => {
    switch (role) {
      case 'admin':
      case 'manager':
        return '/admin';
      case 'writer':
        return '/writer/dashboard';
      default:
        return '/admin';
    }
  };

  // Helper function to get staff panel name
  const getStaffPanelName = (role) => {
    switch (role) {
      case 'admin':
        return 'Admin Panel';
      case 'manager':
        return 'Manager Panel';
      case 'writer':
        return 'Writer Panel';
      default:
        return 'Staff Panel';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-[#F5F5F5] mb-2">
                Welcome back, {session?.user?.name || 'User'}!
              </h1>
              <p className="text-[#CFCFCF] text-lg">
                Here's your personal AI tools dashboard
              </p>
            </div>
            
            {/* Back to Panel Button for Staff */}
            {isStaff(session?.user?.role) && (
              <div className="flex items-center gap-4">
                <Link
                  href={getStaffPanelUrl(session?.user?.role)}
                  className="flex items-center gap-2 px-4 py-3 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 hover:scale-105 transition-all duration-200 cursor-pointer"
                  title={`Return to ${getStaffPanelName(session?.user?.role)}`}
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Back to {getStaffPanelName(session?.user?.role)}</span>
                  <span className="sm:hidden">Panel</span>
                </Link>
                
                {/* Role Badge */}
                <div className={`px-3 py-2 rounded-xl border text-sm font-medium ${roleDisplay.color}`}>
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4" />
                    <span>{roleDisplay.label}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Link 
              href="/dashboard/bookmarks" 
              className="block cursor-pointer hover:scale-105 transition-all duration-200"
              title="View your bookmarked tools"
            >
              <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 hover:border-[#00FFE0]/40 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#CFCFCF] text-sm font-medium cursor-help" title="Number of bookmarked tools">Bookmarks</p>
                    <p className="text-3xl font-bold text-[#F5F5F5]">{stats.bookmarks}</p>
                  </div>
                  <div className="w-12 h-12 bg-[#00FFE0]/20 rounded-xl flex items-center justify-center group-hover:bg-[#00FFE0]/30 transition-colors">
                    <BookmarkIcon className="w-6 h-6 text-[#00FFE0]" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[#00FFE0] text-sm">View all bookmarks</span>
                  <ArrowRightIcon className="w-4 h-4 text-[#00FFE0]" />
                </div>
              </div>
            </Link>
            
            <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 hover:border-[#00FFE0]/40 transition-all duration-300 cursor-help" title="Your review statistics">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#CFCFCF] text-sm font-medium">Reviews</p>
                  <p className="text-3xl font-bold text-[#F5F5F5]">{stats.reviews}</p>
                </div>
                <div className="w-12 h-12 bg-[#B936F4]/20 rounded-xl flex items-center justify-center">
                  <StarIcon className="w-6 h-6 text-[#B936F4]" />
                </div>
              </div>
              <p className="text-[#CFCFCF] text-xs mt-2">Visible reviews only</p>
            </div>
            
            <Link 
              href="/dashboard/recently-viewed" 
              className="block cursor-pointer hover:scale-105 transition-all duration-200"
              title="View recently viewed tools"
            >
              <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 hover:border-[#00FFE0]/40 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#CFCFCF] text-sm font-medium cursor-help" title="Tools you've recently visited">Recently Viewed</p>
                    <p className="text-3xl font-bold text-[#F5F5F5]">{stats.recentlyViewed}</p>
                  </div>
                  <div className="w-12 h-12 bg-[#FF4D4D]/20 rounded-xl flex items-center justify-center group-hover:bg-[#FF4D4D]/30 transition-colors">
                    <EyeIcon className="w-6 h-6 text-[#FF4D4D]" />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[#00FFE0] text-sm">Browse history</span>
                  <ArrowRightIcon className="w-4 h-4 text-[#00FFE0]" />
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Link 
              href="/dashboard/bookmarks" 
              className="block cursor-pointer hover:scale-105 transition-all duration-200"
              title="Manage your bookmarked tools"
            >
              <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 hover:border-[#00FFE0]/40 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-[#B936F4]/20 rounded-xl flex items-center justify-center">
                    <BookmarkIcon className="w-6 h-6 text-[#B936F4]" />
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-[#CFCFCF] group-hover:text-[#00FFE0] transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">My Bookmarks</h3>
                <p className="text-[#CFCFCF] text-sm">
                  View and manage your favorite AI tools.
                </p>
              </div>
            </Link>

            <Link 
              href="/dashboard/recently-viewed" 
              className="block cursor-pointer hover:scale-105 transition-all duration-200"
              title="Browse your recently viewed tools"
            >
              <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 hover:border-[#00FFE0]/40 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-[#FF4D4D]/20 rounded-xl flex items-center justify-center">
                    <ClockIcon className="w-6 h-6 text-[#FF4D4D]" />
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-[#CFCFCF] group-hover:text-[#00FFE0] transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">Recently Viewed</h3>
                <p className="text-[#CFCFCF] text-sm">
                  Browse your recently visited tools.
                </p>
              </div>
            </Link>

            <Link 
              href="/dashboard/profile" 
              className="block cursor-pointer hover:scale-105 transition-all duration-200"
              title="Manage your profile settings"
            >
              <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 hover:border-[#00FFE0]/40 transition-all duration-300 group">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-[#00FFE0]/20 rounded-xl flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-[#00FFE0]" />
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-[#CFCFCF] group-hover:text-[#00FFE0] transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-[#F5F5F5] mb-2">Profile Settings</h3>
                <p className="text-[#CFCFCF] text-sm">
                  Update your account information.
                </p>
              </div>
            </Link>
          </div>




        </div>
      </div>
    </Layout>
  );
} 
