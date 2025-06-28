'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  DocumentTextIcon,
  ClockIcon,
  CalendarIcon,
  TagIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowLeftIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';

const AnalyticsCard = ({ title, value, change, changeType, icon: Icon, color = "text-[#00FFE0]", bgColor = "from-[#00FFE0]/20 to-[#B936F4]/20" }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${bgColor} flex items-center justify-center`}>
        {Icon && <Icon className={`w-6 h-6 ${color}`} />}
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
          changeType === 'positive' ? 'bg-green-500/20 text-green-400' : 
          changeType === 'negative' ? 'bg-red-500/20 text-red-400' : 
          'bg-gray-500/20 text-gray-400'
        }`}>
          {changeType === 'positive' ? (
            <ArrowUpIcon className="w-3 h-3" />
          ) : changeType === 'negative' ? (
            <ArrowDownIcon className="w-3 h-3" />
          ) : null}
          {Math.abs(change)}%
        </div>
      )}
    </div>
    <div>
      <h3 className="text-[#CFCFCF] text-sm font-medium mb-1">{title}</h3>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  </motion.div>
);

const PostRow = ({ post, rank }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: rank * 0.1 }}
    className="flex items-center justify-between p-4 bg-[#0A0F24]/30 border border-[#00FFE0]/10 rounded-xl hover:border-[#00FFE0]/20 transition-all duration-200"
  >
    <div className="flex items-center gap-4 flex-1">
      <div className="w-8 h-8 bg-[#00FFE0]/20 rounded-full flex items-center justify-center text-[#00FFE0] font-bold text-sm">
        {rank}
      </div>
      <div className="flex-1">
        <Link 
          href={`/blog/${post.slug}`}
          className="text-[#F5F5F5] font-medium hover:text-[#00FFE0] transition-colors line-clamp-1"
        >
          {post.title}
        </Link>
        <div className="flex items-center gap-4 mt-1">
          <span className={`px-2 py-1 text-xs rounded-full ${
            post.status === 'published' ? 'bg-green-500/20 text-green-400' :
            post.status === 'pending_approval' ? 'bg-yellow-500/20 text-yellow-400' :
            post.status === 'draft' ? 'bg-gray-500/20 text-gray-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {post.status.replace('_', ' ')}
          </span>
          {post.categories && post.categories.length > 0 && (
            <div className="flex items-center gap-1">
              {post.categories.slice(0, 2).map((category) => (
                <span key={category._id} className="px-2 py-1 bg-[#B936F4]/20 text-[#B936F4] text-xs rounded-full">
                  {category.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-6 text-sm text-[#CFCFCF]">
      <div className="flex items-center gap-1">
        <EyeIcon className="w-4 h-4" />
        <span>{post.views}</span>
      </div>
      <div className="flex items-center gap-1">
        <HeartIcon className="w-4 h-4" />
        <span>{post.likes}</span>
      </div>
      <div className="flex items-center gap-1">
        <ChatBubbleLeftIcon className="w-4 h-4" />
        <span>{post.comments}</span>
      </div>
    </div>
  </motion.div>
);

const SimpleChart = ({ data = [], type = 'views' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-[#CFCFCF]">
        No data available
      </div>
    );
  }
  
  const maxValue = Math.max(...data.map(d => d[type] || 0));
  
  return (
    <div className="flex items-end gap-1 h-32">
      {data.slice(-14).map((day, index) => (
        <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
          <div 
            className={`w-full rounded-t transition-all duration-300 ${
              type === 'views' ? 'bg-[#00FFE0]/60' : 
              type === 'likes' ? 'bg-[#B936F4]/60' : 
              'bg-[#FF4D4D]/60'
            }`}
            style={{ 
              height: `${maxValue > 0 ? (day[type] / maxValue) * 100 : 0}%`,
              minHeight: day[type] > 0 ? '4px' : '2px'
            }}
            title={`${day.date}: ${day[type]} ${type}`}
          />
          <span className="text-xs text-[#CFCFCF] transform rotate-45 origin-left">
            {new Date(day.date).getDate()}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function WriterAnalytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');

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

    fetchAnalytics();
  }, [session, status, router, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/writer/analytics?timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
      setError(null);
    } catch (error) {
      setError('Failed to load analytics data');
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
            <button
              onClick={fetchAnalytics}
              className="px-6 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-colors font-semibold"
            >
              Retry
            </button>
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
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F5F5F5] to-[#CFCFCF] mb-2">
                  Content Analytics
                </h1>
                <p className="text-[#CFCFCF] text-lg">
                  Track your content performance and engagement metrics
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
                  onClick={() => router.back()}
                  className="flex items-center gap-2 px-6 py-3 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 hover:scale-105 transition-all duration-200 cursor-pointer"
                  title="Return to previous page"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  Back to Dashboard
                </button>
              </div>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="text-center p-4 bg-[#10B981]/10 rounded-xl border border-[#10B981]/20">
                <div className="text-[#10B981] text-3xl font-bold mb-2">
                  {analytics?.overview?.totalViews?.toLocaleString() || '0'}
                </div>
                <div className="text-[#CFCFCF] text-sm font-medium">Total Views</div>
                <div className="text-[#10B981] text-xs mt-1">
                  {analytics?.overview?.publishedPosts > 0 
                    ? Math.round((analytics?.overview?.totalViews || 0) / analytics?.overview?.publishedPosts)
                    : 0} avg/post
                </div>
              </div>

              <div className="text-center p-4 bg-[#B936F4]/10 rounded-xl border border-[#B936F4]/20">
                <div className="text-[#B936F4] text-3xl font-bold mb-2">
                  {analytics?.overview?.totalLikes?.toLocaleString() || '0'}
                </div>
                <div className="text-[#CFCFCF] text-sm font-medium">Total Likes</div>
                <div className="text-[#B936F4] text-xs mt-1">
                  {analytics?.overview?.totalViews > 0 
                    ? ((analytics?.overview?.totalLikes || 0) / (analytics?.overview?.totalViews || 1) * 100).toFixed(1)
                    : 0}% like rate
                </div>
              </div>

              <div className="text-center p-4 bg-[#F59E0B]/10 rounded-xl border border-[#F59E0B]/20">
                <div className="text-[#F59E0B] text-3xl font-bold mb-2">
                  {analytics?.overview?.totalComments?.toLocaleString() || '0'}
                </div>
                <div className="text-[#CFCFCF] text-sm font-medium">Total Comments</div>
                <div className="text-[#F59E0B] text-xs mt-1">
                  {analytics?.overview?.totalViews > 0 
                    ? ((analytics?.overview?.totalComments || 0) / (analytics?.overview?.totalViews || 1) * 100).toFixed(1)
                    : 0}% comment rate
                </div>
              </div>

              <div className="text-center p-4 bg-[#00FFE0]/10 rounded-xl border border-[#00FFE0]/20">
                <div className="text-[#00FFE0] text-3xl font-bold mb-2">
                  {analytics?.overview?.totalViews > 0 && analytics?.overview?.totalLikes > 0
                    ? (((analytics?.overview?.totalLikes + analytics?.overview?.totalComments) / analytics?.overview?.totalViews) * 100).toFixed(1)
                    : 0}%
                </div>
                <div className="text-[#CFCFCF] text-sm font-medium">Engagement Rate</div>
                <div className="text-[#00FFE0] text-xs mt-1">
                  (likes + comments) / views
                </div>
              </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

              <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                <h3 className="text-[#F5F5F5] font-semibold mb-4">Views Trend (14 days)</h3>
                <SimpleChart data={analytics?.dailyStats || []} type="views" />
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
              <button
                onClick={() => setActiveTab('recent')}
                className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                  activeTab === 'recent' 
                    ? 'bg-[#00FFE0]/20 text-[#00FFE0] border border-[#00FFE0]/30' 
                    : 'text-[#CFCFCF] hover:text-[#F5F5F5]'
                }`}
              >
                Recent Activity
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                  activeTab === 'categories' 
                    ? 'bg-[#00FFE0]/20 text-[#00FFE0] border border-[#00FFE0]/30' 
                    : 'text-[#CFCFCF] hover:text-[#F5F5F5]'
                }`}
              >
                Categories
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                  <h3 className="text-[#F5F5F5] font-semibold mb-6 flex items-center gap-2">
                    <EyeIcon className="w-5 h-5" />
                    Top Posts by Views
                  </h3>
                  <div className="space-y-4">
                    {analytics?.topPosts?.byViews.slice(0, 5).map((post, index) => (
                      <PostRow key={post._id} post={post} rank={index + 1} />
                    ))}
                  </div>
                </div>
                <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                  <h3 className="text-[#F5F5F5] font-semibold mb-6 flex items-center gap-2">
                    <HeartIcon className="w-5 h-5" />
                    Top Posts by Likes
                  </h3>
                  <div className="space-y-4">
                    {analytics?.topPosts?.byLikes.slice(0, 5).map((post, index) => (
                      <PostRow key={post._id} post={post} rank={index + 1} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'recent' && (
              <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                <h3 className="text-[#F5F5F5] font-semibold mb-6 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5" />
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {analytics?.recentActivity.map((post, index) => (
                    <PostRow key={post._id} post={post} rank={index + 1} />
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'categories' && (
              <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                <h3 className="text-[#F5F5F5] font-semibold mb-6 flex items-center gap-2">
                  <TagIcon className="w-5 h-5" />
                  Category Performance
                </h3>
                <div className="space-y-4">
                  {analytics?.categoryPerformance.map((category, index) => (
                    <motion.div
                      key={category.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-[#0A0F24]/30 border border-[#00FFE0]/10 rounded-xl"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-[#B936F4]/20 rounded-full flex items-center justify-center text-[#B936F4] font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="text-[#F5F5F5] font-medium">{category.name}</h4>
                          <p className="text-[#CFCFCF] text-sm">{category.posts} posts</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-[#CFCFCF]">
                        <div className="flex items-center gap-1">
                          <EyeIcon className="w-4 h-4" />
                          <span>{category.views}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <HeartIcon className="w-4 h-4" />
                          <span>{category.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ChatBubbleLeftIcon className="w-4 h-4" />
                          <span>{category.comments}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 