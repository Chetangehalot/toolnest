'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  EyeIcon,
  HeartIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowLeftIcon,
  CalendarIcon,
  TagIcon,
  ChatBubbleLeftIcon,
  ArrowTopRightOnSquareIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';

const AnalyticsCard = ({ title, value, change, changeType, icon: Icon, color = "text-[#00FFE0]", bgColor = "from-[#00FFE0]/20 to-[#B936F4]/20" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${bgColor} backdrop-blur-lg border border-white/10`}
  >
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-white/10 backdrop-blur-sm ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        {change && (
          <div className={`text-sm font-medium ${changeType === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
            {changeType === 'positive' ? '+' : ''}{change}%
          </div>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-[#F5F5F5]">{value}</p>
        <p className="text-sm text-[#CFCFCF]">{title}</p>
      </div>
    </div>
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full transform translate-x-16 -translate-y-16" />
  </motion.div>
);

const PostRow = ({ post, rank }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: rank * 0.1 }}
    className="flex items-center justify-between p-4 bg-[#0A0F24]/30 border border-[#00FFE0]/10 rounded-xl hover:border-[#00FFE0]/30 transition-colors"
  >
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 bg-[#00FFE0]/20 rounded-full flex items-center justify-center text-[#00FFE0] font-bold text-sm">
        {rank}
      </div>
      <div className="flex-1">
        <h4 className="text-[#F5F5F5] font-medium line-clamp-1">{post.title}</h4>
        <p className="text-[#CFCFCF] text-sm">{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
    <div className="flex items-center gap-6 text-sm text-[#CFCFCF]">
      <div className="flex items-center gap-1">
        <EyeIcon className="w-4 h-4" />
        <span>{post.views || 0}</span>
      </div>
      <div className="flex items-center gap-1">
        <HeartIcon className="w-4 h-4" />
        <span>{post.likes || 0}</span>
      </div>
      <div className="flex items-center gap-1">
        <ChatBubbleLeftIcon className="w-4 h-4" />
        <span>{post.comments || 0}</span>
      </div>
    </div>
  </motion.div>
);

const SimpleChart = ({ data = [], type = 'views' }) => {
  if (!data || data.length === 0) {
    return <div className="text-[#CFCFCF] text-center py-8">No data available</div>;
  }

  const maxValue = Math.max(...data.map(d => d[type] || 0));
  const colorClass = type === 'views' ? 'bg-[#00FFE0]' : 'bg-[#B936F4]';

  return (
    <div className="flex items-end justify-between h-32 gap-1">
      {data.slice(-14).map((item, index) => {
        const height = maxValue > 0 ? ((item[type] || 0) / maxValue) * 100 : 0;
        return (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            <div 
              className={`w-full ${colorClass} opacity-80 rounded-t transition-all duration-300 hover:opacity-100`}
              style={{ height: `${height}%`, minHeight: height > 0 ? '4px' : '0px' }}
              title={`${item.date}: ${item[type] || 0} ${type}`}
            />
            <span className="text-xs text-[#CFCFCF] text-center" style={{ fontSize: '10px' }}>
              {new Date(item.date).getDate()}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const PostAnalyticsRow = ({ post, index }) => (
  <tr className="border-b border-[#00FFE0]/10 hover:bg-[#0A0F24]/20 transition-colors">
    <td className="py-4 px-4 text-[#CFCFCF] text-center">{index + 1}</td>
    <td className="py-4 px-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <h4 className="text-[#F5F5F5] font-medium hover:text-[#00FFE0] transition-colors cursor-pointer line-clamp-2 max-w-xs">
            {post.title}
          </h4>
          <div className="flex items-center gap-2">
            {post.status === 'published' && (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-md text-xs font-medium">
                Published
              </span>
            )}
            {post.status === 'pending_approval' && (
              <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-md text-xs font-medium">
                Pending
              </span>
            )}
            {post.status === 'draft' && (
              <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded-md text-xs font-medium">
                Draft
              </span>
            )}
            {post.status === 'rejected' && (
              <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-md text-xs font-medium">
                Rejected
              </span>
            )}
          </div>
        </div>
        {post.category && (
          <span className="inline-flex items-center px-2 py-1 bg-[#B936F4]/20 text-[#B936F4] rounded-md text-xs font-medium w-fit">
            {post.category}
          </span>
        )}
      </div>
    </td>
    <td className="py-4 px-4 text-center">
      <span className="text-[#00FFE0] font-semibold">{(post.views || 0).toLocaleString()}</span>
    </td>
    <td className="py-4 px-4 text-center">
      <span className="text-[#B936F4] font-semibold">{(post.likes || 0).toLocaleString()}</span>
    </td>
    <td className="py-4 px-4 text-center">
      <span className="text-[#F59E0B] font-semibold">{(post.comments || 0).toLocaleString()}</span>
    </td>
    <td className="py-4 px-4 text-center">
      <span className="text-[#10B981] font-medium">
        {post.views > 0 ? (((post.likes + post.comments) / post.views * 100).toFixed(1)) : '0.0'}%
      </span>
    </td>
    <td className="py-4 px-4 text-center">
      <div className="flex flex-col gap-1 text-sm">
        {post.publishedAt && (
          <span className="text-[#F5F5F5]">
            {new Date(post.publishedAt).toLocaleDateString()}
          </span>
        )}
        <span className="text-[#CFCFCF] text-xs">
          Created: {new Date(post.createdAt).toLocaleDateString()}
        </span>
      </div>
    </td>
    <td className="py-4 px-4 text-center">
      <div className="flex items-center justify-center gap-2">
        {post.status === 'published' && post.slug && (
          <a
            href={`/blog/${post.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-[#00FFE0] hover:bg-[#00FFE0]/10 rounded-lg transition-colors"
            title="View post"
          >
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
          </a>
        )}
        {(post.status === 'draft' || post.status === 'pending_approval') && (
          <Link
            href={`/writer/posts/edit/${post._id}`}
            className="p-2 text-[#B936F4] hover:bg-[#B936F4]/10 rounded-lg transition-colors"
            title="Edit post"
          >
            <PencilSquareIcon className="w-4 h-4" />
          </Link>
        )}
      </div>
    </td>
  </tr>
);

export default function WriterAnalyticsDetail() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const writerId = params.writerId;
  
  const [analytics, setAnalytics] = useState(null);
  const [writerInfo, setWriterInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');

  // CSV Export function
  const exportToCSV = () => {
    if (!analytics?.allPosts) return;

    const csvHeaders = [
      'Title',
      'Status',
      'Category',
      'Views',
      'Likes',
      'Comments',
      'Engagement Rate (%)',
      'Published Date',
      'Created Date',
      'Last Updated'
    ];

    const csvData = analytics.allPosts.map(post => [
      `"${post.title?.replace(/"/g, '""') || 'Untitled'}"`,
      post.status || 'unknown',
      `"${post.category?.name || 'Uncategorized'}"`,
      post.views || 0,
      post.likes || 0,
      post.comments || 0,
      post.views > 0 ? (((post.likes + post.comments) / post.views) * 100).toFixed(2) : '0.00',
      post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Not published',
      post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Unknown',
      post.updatedAt ? new Date(post.updatedAt).toLocaleDateString() : 'Unknown'
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `writer-${writerId}-posts-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

    if (writerId) {
      fetchWriterAnalytics();
    }
  }, [session, status, router, timeRange, writerId]);

  const fetchWriterAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/writer/analytics?timeRange=${timeRange}&authorId=${writerId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch writer analytics');
      }

      const data = await response.json();
      
      // Extract analytics data from the response
      const analyticsData = data.analytics || data;
      
      setAnalytics(analyticsData);
      
      // Get writer info from the first post or fetch separately
      if (data.analytics?.recentActivity?.[0]?.author) {
        setWriterInfo(data.analytics.recentActivity[0].author);
      }
      
      setError(null);
    } catch (error) {
      setError('Failed to load writer analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-[#0A0F24] via-[#0F1629] to-[#1A1F3A]">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse">
                <div className="h-8 bg-[#00FFE0]/20 rounded mb-4 w-64"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  {[...Array(4)].map((_, i) => (
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
            <div className="flex items-center gap-4 justify-center">
              <button
                onClick={fetchWriterAnalytics}
                className="px-6 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-colors font-semibold"
              >
                Retry
              </button>
              <Link
                href="/admin/analytics"
                className="flex items-center gap-2 px-6 py-3 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 hover:scale-105 transition-all duration-200 cursor-pointer"
                title="Return to analytics overview"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Analytics
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!analytics) return null;

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F24] via-[#0F1629] to-[#1A1F3A]">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F5F5F5] to-[#CFCFCF] mb-4">
                  Writer Analytics
                </h1>
                {writerInfo && (
                  <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-xl p-4 inline-flex items-center gap-4">
                    {writerInfo.image && (
                      <img
                        src={writerInfo.image}
                        alt={writerInfo.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-[#00FFE0]/30"
                      />
                    )}
                    <div>
                      <p className="text-[#F5F5F5] text-xl font-semibold">{writerInfo.name}</p>
                      <p className="text-[#CFCFCF] text-sm">{writerInfo.email}</p>
                    </div>
                  </div>
                )}
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
                  onClick={() => router.back()}
                  className="flex items-center gap-2 px-6 py-3 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 hover:scale-105 transition-all duration-200 cursor-pointer"
                  title="Return to analytics overview"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  Back to Analytics
                </button>
              </div>
            </div>

            {/* Overview Stats - All Time Comprehensive Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <div className="text-center p-4 bg-[#10B981]/10 rounded-xl border border-[#10B981]/20">
                <div className="text-[#10B981] text-3xl font-bold mb-2">
                  {(analytics?.allTimeOverview?.totalViews || analytics?.overview?.totalViews || 0).toLocaleString()}
                </div>
                <div className="text-[#CFCFCF] text-sm font-medium">Total Views</div>
                <div className="text-[#10B981] text-xs mt-1">
                  {analytics?.allTimeOverview?.avgViewsPerPost || analytics?.overview?.avgViewsPerPost || 0} avg/post
                </div>
              </div>

              <div className="text-center p-4 bg-[#B936F4]/10 rounded-xl border border-[#B936F4]/20">
                <div className="text-[#B936F4] text-3xl font-bold mb-2">
                  {(analytics?.allTimeOverview?.totalLikes || analytics?.overview?.totalLikes || 0).toLocaleString()}
                </div>
                <div className="text-[#CFCFCF] text-sm font-medium">Total Likes</div>
                <div className="text-[#B936F4] text-xs mt-1">
                  {analytics?.allTimeOverview?.totalViews > 0 
                    ? ((analytics?.allTimeOverview?.totalLikes || 0) / (analytics?.allTimeOverview?.totalViews || 1) * 100).toFixed(1)
                    : 0}% like rate
                </div>
              </div>

              <div className="text-center p-4 bg-[#F59E0B]/10 rounded-xl border border-[#F59E0B]/20">
                <div className="text-[#F59E0B] text-3xl font-bold mb-2">
                  {(analytics?.allTimeOverview?.totalComments || analytics?.overview?.totalComments || 0).toLocaleString()}
                </div>
                <div className="text-[#CFCFCF] text-sm font-medium">Total Comments</div>
                <div className="text-[#F59E0B] text-xs mt-1">
                  {analytics?.allTimeOverview?.totalViews > 0 
                    ? ((analytics?.allTimeOverview?.totalComments || 0) / (analytics?.allTimeOverview?.totalViews || 1) * 100).toFixed(1)
                    : 0}% comment rate
                </div>
              </div>

              <div className="text-center p-4 bg-[#10B981]/10 rounded-xl border border-[#10B981]/20">
                <div className="text-[#10B981] text-3xl font-bold mb-2">
                  {analytics?.allTimeOverview?.avgViewsPerPost || analytics?.overview?.avgViewsPerPost || '0'}
                </div>
                <div className="text-[#CFCFCF] text-sm font-medium">Avg Views/Post</div>
                <div className="text-[#10B981] text-xs mt-1">
                  across all content
                </div>
              </div>

              <div className="text-center p-4 bg-[#00FFE0]/10 rounded-xl border border-[#00FFE0]/20">
                <div className="text-[#00FFE0] text-3xl font-bold mb-2">
                  {analytics?.allTimeOverview?.engagementRate || analytics?.overview?.engagementRate || 0}%
                </div>
                <div className="text-[#CFCFCF] text-sm font-medium">Engagement Rate</div>
                <div className="text-[#00FFE0] text-xs mt-1">
                  (likes + comments) / views
                </div>
              </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                <h3 className="text-[#F5F5F5] font-semibold mb-4">Post Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[#CFCFCF]">Published</span>
                    <span className="text-green-400 font-semibold">{analytics?.overview?.publishedPosts || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#CFCFCF]">Draft</span>
                    <span className="text-gray-400 font-semibold">{analytics?.overview?.draftPosts || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#CFCFCF]">Pending</span>
                    <span className="text-yellow-400 font-semibold">{analytics?.overview?.pendingPosts || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#CFCFCF]">Rejected</span>
                    <span className="text-red-400 font-semibold">{analytics?.overview?.rejectedPosts || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                <h3 className="text-[#F5F5F5] font-semibold mb-4">Average Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[#CFCFCF]">Views per post</span>
                    <span className="text-[#00FFE0] font-semibold">{analytics?.overview?.avgViewsPerPost || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#CFCFCF]">Likes per post</span>
                    <span className="text-[#B936F4] font-semibold">{analytics?.overview?.avgLikesPerPost || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#CFCFCF]">Total comments</span>
                    <span className="text-[#F59E0B] font-semibold">{analytics?.overview?.totalComments || 0}</span>
                  </div>
                </div>
              </div>
            </div>

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
                Overview
              </button>
              <button
                onClick={() => setActiveTab('top-posts')}
                className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                  activeTab === 'top-posts' 
                    ? 'bg-[#00FFE0]/20 text-[#00FFE0] border border-[#00FFE0]/30' 
                    : 'text-[#CFCFCF] hover:text-[#F5F5F5]'
                }`}
              >
                Top Posts
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                  <h3 className="text-[#F5F5F5] font-semibold mb-4">Views Over Time</h3>
                  <SimpleChart data={analytics?.dailyStats || []} type="views" />
                </div>
                <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                  <h3 className="text-[#F5F5F5] font-semibold mb-4">Likes Over Time</h3>
                  <SimpleChart data={analytics?.dailyStats || []} type="likes" />
                </div>
              </div>
            )}

            {activeTab === 'top-posts' && (
              <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                <h3 className="text-[#F5F5F5] font-semibold mb-6 flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5" />
                  Top Posts
                </h3>
                <div className="space-y-4">
                  {analytics?.topPosts?.byViews?.slice(0, 10).map((post, index) => (
                    <PostRow key={post._id} post={post} rank={index + 1} />
                  )) || (
                    <div className="text-center text-[#CFCFCF] py-4">No posts available</div>
                  )}
                </div>
              </div>
            )}

            {/* All Posts Analysis - Standalone Section */}
            <div className="mt-8">
              <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <h3 className="text-[#F5F5F5] font-semibold text-xl flex items-center gap-2">
                    <DocumentTextIcon className="w-6 h-6" />
                    All Posts Analysis
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 bg-[#0A0F24]/50 border border-[#00FFE0]/20 rounded-lg text-[#F5F5F5] text-sm focus:outline-none focus:border-[#00FFE0]/50"
                    >
                      <option value="all">All Status ({analytics?.allPosts?.length || 0})</option>
                      <option value="published">Published ({analytics?.allTimeOverview?.publishedPosts || 0})</option>
                      <option value="pending">Pending ({analytics?.allTimeOverview?.pendingPosts || 0})</option>
                      <option value="draft">Draft ({analytics?.allTimeOverview?.draftPosts || 0})</option>
                      <option value="rejected">Rejected ({analytics?.allTimeOverview?.rejectedPosts || 0})</option>
                    </select>
                    <button
                      onClick={() => {
                        if (!analytics?.allPosts) return;

                        const csvHeaders = [
                          'Title',
                          'Status',
                          'Category',
                          'Views',
                          'Likes',
                          'Comments',
                          'Engagement Rate (%)',
                          'Published Date',
                          'Created Date',
                          'Last Updated'
                        ];

                        const csvData = analytics.allPosts.map(post => [
                          `"${post.title?.replace(/"/g, '""') || 'Untitled'}"`,
                          post.status || 'unknown',
                          `"${post.category?.name || 'Uncategorized'}"`,
                          post.views || 0,
                          post.likes || 0,
                          post.comments || 0,
                          post.views > 0 ? (((post.likes + post.comments) / post.views) * 100).toFixed(2) : '0.00',
                          post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : 'Not published',
                          post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Unknown',
                          post.updatedAt ? new Date(post.updatedAt).toLocaleDateString() : 'Unknown'
                        ]);

                        const csvContent = [
                          csvHeaders.join(','),
                          ...csvData.map(row => row.join(','))
                        ].join('\n');

                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement('a');
                        const url = URL.createObjectURL(blob);
                        link.setAttribute('href', url);
                        link.setAttribute('download', `writer-${writerId}-posts-${new Date().toISOString().split('T')[0]}.csv`);
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="px-4 py-2 bg-[#00FFE0]/20 hover:bg-[#00FFE0]/30 border border-[#00FFE0]/30 hover:border-[#00FFE0]/50 rounded-lg text-[#00FFE0] text-sm font-medium transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#00FFE0]/20">
                        <th className="text-left py-4 px-4 text-[#CFCFCF] font-medium">#</th>
                        <th className="text-left py-4 px-4 text-[#CFCFCF] font-medium">
                          <button
                            onClick={() => {
                              setSortBy('title');
                              setSortOrder(sortBy === 'title' && sortOrder === 'asc' ? 'desc' : 'asc');
                            }}
                            className="flex items-center gap-2 hover:text-[#00FFE0] transition-colors"
                          >
                            Post Title & Status
                            {sortBy === 'title' && (
                              <span className="text-[#00FFE0]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        </th>
                        <th className="text-center py-4 px-4 text-[#CFCFCF] font-medium">
                          <button
                            onClick={() => {
                              setSortBy('views');
                              setSortOrder(sortBy === 'views' && sortOrder === 'desc' ? 'asc' : 'desc');
                            }}
                            className="flex items-center justify-center gap-1 hover:text-[#00FFE0] transition-colors w-full"
                          >
                            <EyeIcon className="w-4 h-4" />
                            Views
                            {sortBy === 'views' && (
                              <span className="text-[#00FFE0]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        </th>
                        <th className="text-center py-4 px-4 text-[#CFCFCF] font-medium">
                          <button
                            onClick={() => {
                              setSortBy('likes');
                              setSortOrder(sortBy === 'likes' && sortOrder === 'desc' ? 'asc' : 'desc');
                            }}
                            className="flex items-center justify-center gap-1 hover:text-[#00FFE0] transition-colors w-full"
                          >
                            <HeartIcon className="w-4 h-4" />
                            Likes
                            {sortBy === 'likes' && (
                              <span className="text-[#00FFE0]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        </th>
                        <th className="text-center py-4 px-4 text-[#CFCFCF] font-medium">
                          <button
                            onClick={() => {
                              setSortBy('comments');
                              setSortOrder(sortBy === 'comments' && sortOrder === 'desc' ? 'asc' : 'desc');
                            }}
                            className="flex items-center justify-center gap-1 hover:text-[#00FFE0] transition-colors w-full"
                          >
                            <ChatBubbleLeftIcon className="w-4 h-4" />
                            Comments
                            {sortBy === 'comments' && (
                              <span className="text-[#00FFE0]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        </th>
                        <th className="text-center py-4 px-4 text-[#CFCFCF] font-medium">
                          <div className="flex items-center justify-center gap-1">
                            <ChartBarIcon className="w-4 h-4" />
                            Engagement
                          </div>
                        </th>
                        <th className="text-center py-4 px-4 text-[#CFCFCF] font-medium">
                          <button
                            onClick={() => {
                              setSortBy('createdAt');
                              setSortOrder(sortBy === 'createdAt' && sortOrder === 'desc' ? 'asc' : 'desc');
                            }}
                            className="flex items-center justify-center gap-1 hover:text-[#00FFE0] transition-colors w-full"
                          >
                            <CalendarIcon className="w-4 h-4" />
                            Date
                            {sortBy === 'createdAt' && (
                              <span className="text-[#00FFE0]">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </button>
                        </th>
                        <th className="text-center py-4 px-4 text-[#CFCFCF] font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Use the comprehensive allPosts data from API
                        let allPosts = analytics?.allPosts || [];
                        
                        // Apply status filter
                        if (statusFilter !== 'all') {
                          allPosts = allPosts.filter(post => post.status === statusFilter);
                        }
                        
                        // Apply sorting
                        allPosts.sort((a, b) => {
                          let aValue = a[sortBy];
                          let bValue = b[sortBy];
                          
                          if (sortBy === 'createdAt' || sortBy === 'publishedAt') {
                            aValue = new Date(aValue || 0);
                            bValue = new Date(bValue || 0);
                          } else if (typeof aValue === 'string') {
                            aValue = aValue.toLowerCase();
                            bValue = bValue.toLowerCase();
                          }
                          
                          if (sortOrder === 'asc') {
                            return aValue > bValue ? 1 : -1;
                          } else {
                            return aValue < bValue ? 1 : -1;
                          }
                        });
                        
                        return allPosts.length > 0 ? (
                          allPosts.map((post, index) => (
                            <PostAnalyticsRow key={post._id} post={post} index={index} />
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center py-8 text-[#CFCFCF]">
                              {statusFilter !== 'all' 
                                ? `No ${statusFilter.replace('_', ' ')} posts found`
                                : 'No posts found for this writer'
                              }
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 