'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  UserGroupIcon,
  DocumentTextIcon,
  EyeIcon,
  HeartIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowLeftIcon,
  ChatBubbleLeftIcon,
  ChartBarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';

const StatsCard = ({ icon: Icon, label, value, color = "text-[#00FFE0]", bgColor = "from-[#00FFE0]/20 to-[#B936F4]/20", change, changeType }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-xl p-6"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[#CFCFCF] text-sm mb-1">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {change && (
          <p className={`text-sm mt-1 ${changeType === 'increase' ? 'text-green-400' : 'text-red-400'}`}>
            {changeType === 'increase' ? '↗' : '↘'} {change}
          </p>
        )}
      </div>
      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${bgColor} flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  </motion.div>
);

const SimpleChart = ({ data = [], type = 'views' }) => {
  if (!data.length) return <div className="text-[#CFCFCF] text-center py-4">No data available</div>;
  
  const maxValue = Math.max(...data.map(d => d[type] || 0));
  if (maxValue === 0) return <div className="text-[#CFCFCF] text-center py-4">No {type} data</div>;

  return (
    <div className="flex items-end gap-1 h-32">
      {data.slice(-14).map((day, index) => {
        const height = maxValue > 0 ? (day[type] / maxValue) * 100 : 0;
        return (
          <div
            key={index}
            className="flex-1 bg-gradient-to-t from-[#00FFE0]/30 to-[#00FFE0]/60 rounded-t"
            style={{ height: `${height}%` }}
            title={`${day.date}: ${day[type]} ${type}`}
          />
        );
      })}
    </div>
  );
};

export default function WritersOverview() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [writers, setWriters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('totalViews');
  const [sortOrder, setSortOrder] = useState('desc');
  const [timeRange, setTimeRange] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');
  const [platformAnalytics, setPlatformAnalytics] = useState(null);
  const [stats, setStats] = useState({
    totalWriters: 0,
    activeWriters: 0,
    totalPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    avgEngagementRate: 0,
    avgViewsPerPost: 0,
    avgLikesPerPost: 0
  });

  // State restoration functionality
  useEffect(() => {
    const saveState = () => {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('writers-overview-active-tab', activeTab);
        sessionStorage.setItem('writers-overview-time-range', timeRange);
        sessionStorage.setItem('writers-overview-search', searchTerm);
        sessionStorage.setItem('writers-overview-scroll-position', window.scrollY.toString());
      }
    };

    // Save state when values change
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('writers-overview-active-tab', activeTab);
      sessionStorage.setItem('writers-overview-time-range', timeRange);
      sessionStorage.setItem('writers-overview-search', searchTerm);
    }

    // Save state before page unload
    window.addEventListener('beforeunload', saveState);
    
    return () => {
      window.removeEventListener('beforeunload', saveState);
    };
  }, [activeTab, timeRange, searchTerm]);

  // Restore state when returning from individual writer analytics - run only once
  useEffect(() => {
    if (!loading && typeof window !== 'undefined') {
      const isReturning = sessionStorage.getItem('writers-overview-returning') === 'true';
      
      if (isReturning) {
        // Restore previous state
        const savedTab = sessionStorage.getItem('writers-overview-active-tab');
        const savedTimeRange = sessionStorage.getItem('writers-overview-time-range');
        const savedSearch = sessionStorage.getItem('writers-overview-search');
        const savedScrollPosition = sessionStorage.getItem('writers-overview-scroll-position');
        
        // Batch state updates to prevent multiple re-renders
        const updates = {};
        if (savedTab && savedTab !== activeTab) updates.activeTab = savedTab;
        if (savedTimeRange && savedTimeRange !== timeRange) updates.timeRange = savedTimeRange;
        if (savedSearch && savedSearch !== searchTerm) updates.searchTerm = savedSearch;
        
        // Apply all updates at once
        if (updates.activeTab) setActiveTab(updates.activeTab);
        if (updates.timeRange) setTimeRange(updates.timeRange);
        if (updates.searchTerm) setSearchTerm(updates.searchTerm);
        
        // Restore scroll position
        if (savedScrollPosition) {
          setTimeout(() => {
            window.scrollTo({
              top: parseInt(savedScrollPosition),
              behavior: 'smooth'
            });
          }, 100);
        }
        
        // Clear the returning flag after restoration
        sessionStorage.removeItem('writers-overview-returning');
      }
    }
  }, [loading]); // Only depend on loading to run once when data is ready

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

    fetchWritersAnalytics();
    fetchPlatformAnalytics();
  }, [session, status, router, timeRange]);

  const fetchWritersAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch writers analytics data with time range
      const response = await fetch(`/api/admin/writers-analytics?timeRange=${timeRange}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch writers analytics');
      }
      
      const data = await response.json();
      const writersData = data.writers || [];
      
      // Fetch all writers including inactive ones
      const usersResponse = await fetch('/api/admin/users?role=writer,manager,admin&limit=100');
      if (!usersResponse.ok) {
        const errorData = await usersResponse.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      
      const usersData = await usersResponse.json();
      const allWriters = (usersData.users || []).map(writer => {
        const analyticsData = writersData.find(w => w._id === writer._id);
        return {
          ...writer,
          analytics: analyticsData || {
            totalPosts: 0,
            publishedPosts: 0,
            totalViews: 0,
            totalLikes: 0,
            totalComments: 0,
            engagementRate: 0,
            avgViewsPerPost: 0,
            avgLikesPerPost: 0
          }
        };
      });
      
      setWriters(allWriters);
      
      // Calculate comprehensive stats
      const totalWriters = allWriters.length;
      const activeWriters = writersData.length;
      const totalPosts = writersData.reduce((sum, w) => sum + w.totalPosts, 0);
      const totalViews = writersData.reduce((sum, w) => sum + w.totalViews, 0);
      const totalLikes = writersData.reduce((sum, w) => sum + w.totalLikes, 0);
      const totalComments = writersData.reduce((sum, w) => sum + w.totalComments, 0);
      const avgEngagementRate = activeWriters > 0 ? 
        (writersData.reduce((sum, w) => sum + w.engagementRate, 0) / activeWriters).toFixed(1) : 0;
      const avgViewsPerPost = totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0;
      const avgLikesPerPost = totalPosts > 0 ? Math.round(totalLikes / totalPosts) : 0;
      
      setStats({
        totalWriters,
        activeWriters,
        totalPosts,
        totalViews,
        totalLikes,
        totalComments,
        avgEngagementRate: parseFloat(avgEngagementRate),
        avgViewsPerPost,
        avgLikesPerPost
      });
      
    } catch (error) {
      console.error('Error fetching writers analytics:', error);
      setError(error.message || 'Failed to load writers analytics data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformAnalytics = async () => {
    try {
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setPlatformAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching platform analytics:', error);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const exportToCSV = () => {
    if (!writers || writers.length === 0) {
      alert('No writer data available to export.');
      return;
    }

    const headers = [
      'Name',
      'Email', 
      'Role',
      'Total Posts',
      'Published Posts',
      'Total Views',
      'Total Likes',
      'Total Comments',
      'Engagement Rate (%)',
      'Avg Views Per Post',
      'Avg Likes Per Post',
      'Last Login',
      'Account Created'
    ];
    
    const csvData = writers.map(writer => [
      writer.name || 'N/A',
      writer.email || 'N/A',
      writer.role || 'N/A',
      writer.analytics?.totalPosts || 0,
      writer.analytics?.publishedPosts || 0,
      writer.analytics?.totalViews || 0,
      writer.analytics?.totalLikes || 0,
      writer.analytics?.totalComments || 0,
      writer.analytics?.engagementRate || 0,
      writer.analytics?.avgViewsPerPost || 0,
      writer.analytics?.avgLikesPerPost || 0,
      writer.lastLogin ? new Date(writer.lastLogin).toLocaleDateString() : 'Never',
      writer.createdAt ? new Date(writer.createdAt).toLocaleDateString() : 'N/A'
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    try {
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `writers-comprehensive-analytics-${timeRange}days-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  const filteredAndSortedWriters = writers
    .filter(writer => 
      writer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      writer.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'totalPosts':
          aValue = a.analytics?.totalPosts || 0;
          bValue = b.analytics?.totalPosts || 0;
          break;
        case 'publishedPosts':
          aValue = a.analytics?.publishedPosts || 0;
          bValue = b.analytics?.publishedPosts || 0;
          break;
        case 'totalViews':
          aValue = a.analytics?.totalViews || 0;
          bValue = b.analytics?.totalViews || 0;
          break;
        case 'totalLikes':
          aValue = a.analytics?.totalLikes || 0;
          bValue = b.analytics?.totalLikes || 0;
          break;
        case 'engagementRate':
          aValue = a.analytics?.engagementRate || 0;
          bValue = b.analytics?.engagementRate || 0;
          break;
        case 'lastLogin':
          aValue = a.lastLogin ? new Date(a.lastLogin) : new Date(0);
          bValue = b.lastLogin ? new Date(b.lastLogin) : new Date(0);
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-[#0A0F24] via-[#0F1629] to-[#1A1F3A]">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse">
                <div className="h-8 bg-[#00FFE0]/20 rounded mb-8 w-64"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-32 bg-[#00FFE0]/10 rounded-2xl"></div>
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-64 bg-[#00FFE0]/10 rounded-2xl"></div>
                  ))}
                </div>
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
        <div className="min-h-screen bg-gradient-to-br from-[#0A0F24] via-[#0F1629] to-[#1A1F3A] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Analytics</h2>
            <p className="text-[#CFCFCF] mb-6">{error}</p>
            <button
              onClick={fetchWritersAnalytics}
              className="px-6 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-colors font-semibold"
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
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F24] via-[#0F1629] to-[#1A1F3A]">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F5F5F5] to-[#CFCFCF] mb-2">
                  Writers Analytics Overview
                </h1>
                <p className="text-[#CFCFCF] text-lg">
                  Comprehensive analytics and performance metrics for all content creators
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="px-4 py-2 bg-[#0A0F24]/50 border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl focus:border-[#00FFE0]/40 focus:outline-none"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                </select>
                
                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-6 py-3 bg-[#B936F4]/20 text-[#B936F4] border border-[#B936F4]/30 rounded-xl hover:bg-[#B936F4]/30 transition-all duration-200 cursor-pointer hover:scale-105"
                  title="Export comprehensive writers analytics to CSV"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  Export Analytics
                </button>
                
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-6 py-3 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 transition-all duration-200 cursor-pointer hover:scale-105"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  Back to Admin
                </Link>
              </div>
            </div>

            {/* Enhanced Stats Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-8"
            >
              <StatsCard 
                icon={UserGroupIcon} 
                label="Total Writers" 
                value={stats.totalWriters} 
                color="text-[#00FFE0]"
                bgColor="from-[#00FFE0]/20 to-[#00D4AA]/20"
              />
              <StatsCard 
                icon={UserIcon} 
                label="Active Writers" 
                value={stats.activeWriters} 
                color="text-green-400"
                bgColor="from-green-500/20 to-emerald-500/20"
              />
              <StatsCard 
                icon={DocumentTextIcon} 
                label="Total Posts" 
                value={stats.totalPosts.toLocaleString()} 
                color="text-blue-400"
                bgColor="from-blue-500/20 to-cyan-500/20"
              />
              <StatsCard 
                icon={EyeIcon} 
                label="Total Views" 
                value={stats.totalViews.toLocaleString()} 
                color="text-purple-400"
                bgColor="from-purple-500/20 to-pink-500/20"
              />
              <StatsCard 
                icon={HeartIcon} 
                label="Total Likes" 
                value={stats.totalLikes.toLocaleString()} 
                color="text-rose-400"
                bgColor="from-rose-500/20 to-red-500/20"
              />
            </motion.div>

            {/* Secondary Stats */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <StatsCard 
                icon={ChatBubbleLeftIcon} 
                label="Total Comments" 
                value={stats.totalComments.toLocaleString()} 
                color="text-yellow-400"
                bgColor="from-yellow-500/20 to-orange-500/20"
              />
              <StatsCard 
                icon={ChartBarIcon} 
                label="Avg Engagement Rate" 
                value={`${stats.avgEngagementRate}%`} 
                color="text-indigo-400"
                bgColor="from-indigo-500/20 to-purple-500/20"
              />
              <StatsCard 
                icon={ChartBarIcon} 
                label="Avg Views/Post" 
                value={stats.avgViewsPerPost.toLocaleString()} 
                color="text-teal-400"
                bgColor="from-teal-500/20 to-cyan-500/20"
              />
              <StatsCard 
                icon={HeartIcon} 
                label="Avg Likes/Post" 
                value={stats.avgLikesPerPost.toLocaleString()} 
                color="text-pink-400"
                bgColor="from-pink-500/20 to-rose-500/20"
              />
            </motion.div>

            {/* Platform Overview */}
            {platformAnalytics && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 mb-8"
              >
                <h3 className="text-[#F5F5F5] font-semibold text-xl mb-6">Platform Performance Trends</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-[#CFCFCF] font-medium mb-4">Views Over Time (Last 14 Days)</h4>
                    <SimpleChart data={platformAnalytics.dailyStats || []} type="views" />
                  </div>
                  <div>
                    <h4 className="text-[#CFCFCF] font-medium mb-4">Likes Over Time (Last 14 Days)</h4>
                    <SimpleChart data={platformAnalytics.dailyStats || []} type="likes" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab Navigation */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                  activeTab === 'overview' 
                    ? 'bg-[#00FFE0]/20 text-[#00FFE0] border border-[#00FFE0]/30' 
                    : 'text-[#CFCFCF] hover:text-[#F5F5F5]'
                }`}
              >
                Writers Overview
              </button>
              <button
                onClick={() => setActiveTab('performance')}
                className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                  activeTab === 'performance' 
                    ? 'bg-[#00FFE0]/20 text-[#00FFE0] border border-[#00FFE0]/30' 
                    : 'text-[#CFCFCF] hover:text-[#F5F5F5]'
                }`}
              >
                Top Performers
              </button>
            </div>

            {/* Search and Filters */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 mb-8"
            >
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#CFCFCF]" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search writers by name or email..."
                      className="w-full pl-10 pr-4 py-3 bg-[#0A0F24]/30 border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] placeholder-[#CFCFCF]/50 focus:outline-none focus:border-[#00FFE0]/40"
                    />
                  </div>
                </div>
                <div className="text-[#CFCFCF] text-sm self-center">
                  Showing {filteredAndSortedWriters.length} of {writers.length} writers
                </div>
              </div>
            </motion.div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#00FFE0]/10">
                        <th 
                          className="text-left py-3 px-4 text-[#CFCFCF] font-medium cursor-pointer hover:text-[#00FFE0]"
                          onClick={() => handleSort('name')}
                        >
                          Writer {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="text-left py-3 px-4 text-[#CFCFCF] font-medium">Role</th>
                        <th 
                          className="text-left py-3 px-4 text-[#CFCFCF] font-medium cursor-pointer hover:text-[#00FFE0]"
                          onClick={() => handleSort('totalPosts')}
                        >
                          Posts {sortBy === 'totalPosts' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="text-left py-3 px-4 text-[#CFCFCF] font-medium cursor-pointer hover:text-[#00FFE0]"
                          onClick={() => handleSort('publishedPosts')}
                        >
                          Published {sortBy === 'publishedPosts' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="text-left py-3 px-4 text-[#CFCFCF] font-medium cursor-pointer hover:text-[#00FFE0]"
                          onClick={() => handleSort('totalViews')}
                        >
                          Views {sortBy === 'totalViews' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="text-left py-3 px-4 text-[#CFCFCF] font-medium cursor-pointer hover:text-[#00FFE0]"
                          onClick={() => handleSort('totalLikes')}
                        >
                          Likes {sortBy === 'totalLikes' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="text-left py-3 px-4 text-[#CFCFCF] font-medium cursor-pointer hover:text-[#00FFE0]"
                          onClick={() => handleSort('engagementRate')}
                        >
                          Engagement {sortBy === 'engagementRate' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="text-left py-3 px-4 text-[#CFCFCF] font-medium cursor-pointer hover:text-[#00FFE0]"
                          onClick={() => handleSort('lastLogin')}
                        >
                          Last Login {sortBy === 'lastLogin' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="text-left py-3 px-4 text-[#CFCFCF] font-medium">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#00FFE0]/10">
                      {filteredAndSortedWriters.map((writer) => (
                        <tr key={writer._id} className="hover:bg-[#0A0F24]/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {writer.image && (
                                <img
                                  src={writer.image}
                                  alt={writer.name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-[#00FFE0]/20"
                                />
                              )}
                              <div>
                                <h4 className="text-[#F5F5F5] font-medium">{writer.name}</h4>
                                <p className="text-[#CFCFCF] text-sm">{writer.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm border ${
                              writer.role === 'admin' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              writer.role === 'manager' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                              'bg-green-500/20 text-green-400 border-green-500/30'
                            }`}>
                              {writer.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-[#F5F5F5] font-semibold text-lg">
                              {writer.analytics?.totalPosts || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-green-400 font-semibold">
                              {writer.analytics?.publishedPosts || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 text-[#00FFE0] font-semibold">
                              <EyeIcon className="w-4 h-4" />
                              {(writer.analytics?.totalViews || 0).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 text-[#B936F4] font-semibold">
                              <HeartIcon className="w-4 h-4" />
                              {(writer.analytics?.totalLikes || 0).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-sm font-semibold ${
                                (writer.analytics?.engagementRate || 0) >= 5 ? 'bg-green-500/20 text-green-400' :
                                (writer.analytics?.engagementRate || 0) >= 2 ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {writer.analytics?.engagementRate || 0}%
                              </span>
                              <div className="text-xs text-[#CFCFCF]">
                                <div>{writer.analytics?.avgViewsPerPost || 0} avg views</div>
                                <div>{writer.analytics?.avgLikesPerPost || 0} avg likes</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-[#CFCFCF] text-sm">
                              {writer.lastLogin ? (
                                <div>
                                  <div>{new Date(writer.lastLogin).toLocaleDateString()}</div>
                                  <div className="text-xs text-[#CFCFCF]/70">
                                    {new Date(writer.lastLogin).toLocaleTimeString()}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[#CFCFCF]/50">Never logged in</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Link
                              href={`/admin/analytics/writer/${writer._id}`}
                              onClick={() => {
                                // Save current state before navigation
                                sessionStorage.setItem('writers-overview-scroll-position', window.scrollY.toString());
                                sessionStorage.setItem('writers-overview-returning', 'true');
                                sessionStorage.setItem('writers-overview-active-tab', activeTab);
                                sessionStorage.setItem('writers-overview-time-range', timeRange);
                                sessionStorage.setItem('writers-overview-search', searchTerm);
                              }}
                              className="inline-flex items-center px-3 py-1 bg-[#00FFE0]/20 text-[#00FFE0] rounded-lg hover:bg-[#00FFE0]/30 transition-colors text-sm font-medium"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredAndSortedWriters.length === 0 && (
                  <div className="text-center py-12">
                    <UserGroupIcon className="w-16 h-16 text-[#CFCFCF]/50 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-[#F5F5F5] mb-2">No writers found</h3>
                    <p className="text-[#CFCFCF]">No writers match your search criteria.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Top Performers Tab */}
            {activeTab === 'performance' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6">
                  <h3 className="text-[#F5F5F5] font-semibold text-xl mb-6 flex items-center gap-2">
                    <EyeIcon className="w-6 h-6 text-[#00FFE0]" />
                    Top Writers by Views
                  </h3>
                  <div className="space-y-4">
                    {filteredAndSortedWriters
                      .filter(w => (w.analytics?.totalViews || 0) > 0)
                      .sort((a, b) => (b.analytics?.totalViews || 0) - (a.analytics?.totalViews || 0))
                      .slice(0, 10)
                      .map((writer, index) => (
                        <div key={writer._id} className="flex items-center gap-4 p-4 bg-[#0A0F24]/30 rounded-xl">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                            index === 1 ? 'bg-gray-500/20 text-gray-400' :
                            index === 2 ? 'bg-orange-500/20 text-orange-400' :
                            'bg-[#00FFE0]/20 text-[#00FFE0]'
                          }`}>
                            {index + 1}
                          </div>
                          {writer.image && (
                            <img src={writer.image} alt={writer.name} className="w-10 h-10 rounded-full object-cover" />
                          )}
                          <div className="flex-1">
                            <h4 className="text-[#F5F5F5] font-medium">{writer.name}</h4>
                            <p className="text-[#CFCFCF] text-sm">{writer.analytics?.totalPosts || 0} posts</p>
                          </div>
                          <div className="text-right">
                            <div className="text-[#00FFE0] font-semibold">{(writer.analytics?.totalViews || 0).toLocaleString()}</div>
                            <div className="text-[#CFCFCF] text-sm">views</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6">
                  <h3 className="text-[#F5F5F5] font-semibold text-xl mb-6 flex items-center gap-2">
                    <ChartBarIcon className="w-6 h-6 text-[#B936F4]" />
                    Top Writers by Engagement
                  </h3>
                  <div className="space-y-4">
                    {filteredAndSortedWriters
                      .filter(w => (w.analytics?.engagementRate || 0) > 0)
                      .sort((a, b) => (b.analytics?.engagementRate || 0) - (a.analytics?.engagementRate || 0))
                      .slice(0, 10)
                      .map((writer, index) => (
                        <div key={writer._id} className="flex items-center gap-4 p-4 bg-[#0A0F24]/30 rounded-xl">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                            index === 1 ? 'bg-gray-500/20 text-gray-400' :
                            index === 2 ? 'bg-orange-500/20 text-orange-400' :
                            'bg-[#B936F4]/20 text-[#B936F4]'
                          }`}>
                            {index + 1}
                          </div>
                          {writer.image && (
                            <img src={writer.image} alt={writer.name} className="w-10 h-10 rounded-full object-cover" />
                          )}
                          <div className="flex-1">
                            <h4 className="text-[#F5F5F5] font-medium">{writer.name}</h4>
                            <p className="text-[#CFCFCF] text-sm">{writer.analytics?.totalPosts || 0} posts</p>
                          </div>
                          <div className="text-right">
                            <div className="text-[#B936F4] font-semibold">{writer.analytics?.engagementRate || 0}%</div>
                            <div className="text-[#CFCFCF] text-sm">engagement</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 
