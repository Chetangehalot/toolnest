import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/db';

// Force this route to be dynamic to prevent it from running during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import Blog from '@/models/Blog';
import User from '@/models/User';
import BlogCategory from '@/models/BlogCategory';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin/manager permissions
    if (!['manager', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    // Ensure today's engagement entries exist for all published posts
    try {
      const todayResult = await Blog.ensureTodaysEngagement();
    } catch (ensureError) {
      // Silent fail for non-critical operation
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30'; // days

    // Calculate date range
    const days = parseInt(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch all posts within the time range
    const posts = await Blog.find({
      createdAt: { $gte: startDate }
    })
    .populate('authorId', 'name email image role')
    .populate('categories', 'name')
    .sort({ createdAt: -1 })
    .lean();

    // Calculate overall statistics
    const totalPosts = posts.length;
    const publishedPosts = posts.filter(p => p.status === 'published').length;
    const draftPosts = posts.filter(p => p.status === 'draft').length;
    const pendingPosts = posts.filter(p => p.status === 'pending_approval').length;
    const rejectedPosts = posts.filter(p => p.status === 'rejected').length;

    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
    const totalComments = posts.reduce((sum, p) => sum + (p.comments || 0), 0);

    // Calculate engagement metrics
    const avgViewsPerPost = totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0;
    const avgLikesPerPost = totalPosts > 0 ? Math.round(totalLikes / totalPosts) : 0;
    const engagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews * 100).toFixed(2) : 0;

    // Get top performing posts
    const topPostsByViews = posts
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 10)
      .map(post => ({
        _id: post._id,
        title: post.title,
        slug: post.slug,
        views: post.views || 0,
        likes: post.likes || 0,
        comments: post.comments || 0,
        status: post.status,
        publishedAt: post.publishedAt,
        createdAt: post.createdAt,
        categories: post.categories,
        author: post.authorId
      }));

    const topPostsByLikes = posts
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 10);

    // Calculate daily stats for the time range
    const today = new Date().toISOString().split('T')[0];
    const dailyStats = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const dateStr = date.toISOString().split('T')[0];
      const isToday = dateStr === today;

      // Get posts created on this day
      const dayPosts = posts.filter(p => {
        const postDate = new Date(p.createdAt);
        return postDate >= date && postDate < nextDate;
      });

      // Get posts published on this day
      const dayPublished = posts.filter(p => {
        if (!p.publishedAt) return false;
        const publishDate = new Date(p.publishedAt);
        return publishDate >= date && publishDate < nextDate;
      });

      // Calculate actual daily engagement from all posts
      let dailyViews = 0;
      let dailyLikes = 0;
      let dailyComments = 0;

      posts.forEach(post => {
        if (post.dailyEngagement && Array.isArray(post.dailyEngagement)) {
          const dayEngagement = post.dailyEngagement.find(eng => eng.date === dateStr);
          if (dayEngagement) {
            dailyViews += dayEngagement.views || 0;
            dailyLikes += dayEngagement.likes || 0;
            dailyComments += dayEngagement.comments || 0;
          }
        }
      });

      dailyStats.push({
        date: dateStr,
        posts: dayPosts.length,
        published: dayPublished.length,
        views: dailyViews,
        likes: dailyLikes,
        comments: dailyComments,
        isToday: isToday
      });
    }

    // Calculate hourly views for the last 24 hours
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Calculate yesterday's date string
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Get today's total views from daily engagement data
    let todayTotalViews = 0;
    posts.forEach(post => {
      if (post.dailyEngagement && Array.isArray(post.dailyEngagement)) {
        const todayEngagement = post.dailyEngagement.find(eng => eng.date === todayStr);
        if (todayEngagement) {
          todayTotalViews += todayEngagement.views || 0;
        }
      }
    });
    
    // Get yesterday's total views from daily engagement data
    let yesterdayTotalViews = 0;
    posts.forEach(post => {
      if (post.dailyEngagement && Array.isArray(post.dailyEngagement)) {
        const yesterdayEngagement = post.dailyEngagement.find(eng => eng.date === yesterdayStr);
        if (yesterdayEngagement) {
          yesterdayTotalViews += yesterdayEngagement.views || 0;
        }
      }
    });

    // Generate hourly views for the last 6 hours
    const hourlyViews = [];
    const currentHour = now.getHours();
    
    for (let i = 5; i >= 0; i--) {
      const hour = currentHour - i;
      const hourDate = new Date(now);
      hourDate.setHours(hour, 0, 0, 0);
      
      const hourStr = hourDate.getHours().toString().padStart(2, '0') + ':00';
      const isToday = hourDate.toDateString() === now.toDateString();
      const isYesterday = hourDate.toDateString() === yesterday.toDateString();
      
      // For simplicity, distribute today's views across hours
      // In a real implementation, you'd store hourly engagement data
      let hourViews = 0;
      if (isToday && todayTotalViews > 0) {
        // Distribute today's views with higher activity in recent hours
        const hourWeight = i === 0 ? 0.4 : i === 1 ? 0.3 : i === 2 ? 0.2 : 0.1;
        hourViews = Math.round(todayTotalViews * hourWeight);
      } else if (isYesterday && yesterdayTotalViews > 0) {
        // Some activity from yesterday
        hourViews = Math.round(yesterdayTotalViews * 0.1);
      }
      
      hourlyViews.push({
        hour: hourStr,
        label: hourStr,
        views: hourViews,
        timestamp: hourDate.getTime(),
        isToday: isToday,
        isYesterday: isYesterday,
        date: hourDate.toISOString().split('T')[0]
      });
    }

    // Check if today exists in dailyStats
    const todayExists = dailyStats.some(stat => stat.isToday);
    
    if (!todayExists) {
      // Calculate today's engagement manually
      let todayViews = 0;
      let todayLikes = 0; 
      let todayComments = 0;
      
      posts.forEach(post => {
        if (post.dailyEngagement && Array.isArray(post.dailyEngagement)) {
          const todayEngagement = post.dailyEngagement.find(eng => eng.date === todayStr);
          if (todayEngagement) {
            todayViews += todayEngagement.views || 0;
            todayLikes += todayEngagement.likes || 0;
            todayComments += todayEngagement.comments || 0;
          }
        }
      });
      
      // Add today's data as the last entry
      dailyStats.push({
        date: todayStr,
        posts: 0, // We don't need to calculate posts created today for the chart
        published: 0,
        views: todayViews,
        likes: todayLikes,
        comments: todayComments,
        isToday: true
      });
    }

    // Category performance
    const categoryStats = {};
    posts.forEach(post => {
      if (post.categories && post.categories.length > 0) {
        post.categories.forEach(category => {
          if (!categoryStats[category.name]) {
            categoryStats[category.name] = {
              name: category.name,
              posts: 0,
              views: 0,
              likes: 0,
              comments: 0
            };
          }
          categoryStats[category.name].posts += 1;
          categoryStats[category.name].views += post.views || 0;
          categoryStats[category.name].likes += post.likes || 0;
          categoryStats[category.name].comments += post.comments || 0;
        });
      }
    });

    const sortedCategoryPerformance = Object.values(categoryStats)
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Get trending tags
    const allTags = [];
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        allTags.push(...post.tags);
      }
    });

    const tagCounts = {};
    allTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });

    const trendingTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    // Get inactive writers (writers with no posts in the time period)
    const activeWriterIds = [...new Set(posts.map(p => p.authorId?._id?.toString()).filter(Boolean))];
    const allWriters = await User.find({ role: 'writer' }).lean();
    const inactiveWriters = allWriters
      .filter(writer => !activeWriterIds.includes(writer._id.toString()))
      .slice(0, 10)
      .map(writer => ({
        _id: writer._id,
        name: writer.name,
        email: writer.email,
        lastLogin: writer.lastLogin,
        createdAt: writer.createdAt
      }));

    // Get stale drafts (drafts older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const staleDrafts = await Blog.find({
      status: 'draft',
      createdAt: { $lt: sevenDaysAgo }
    })
    .populate('authorId', 'name email')
    .sort({ createdAt: 1 })
    .limit(20)
    .lean();

    // Get recent activity
    const recentActivity = posts
      .filter(post => post.publishedAt)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, 10)
      .map(post => ({
        _id: post._id,
        title: post.title,
        slug: post.slug,
        author: post.authorId,
        publishedAt: post.publishedAt,
        views: post.views,
        likes: post.likes,
        comments: post.comments,
        categories: post.categories
      }));

    // Get most discussed blogs (based on comments)
    const mostDiscussedBlogs = posts
      .filter(post => post.comments > 0)
      .sort((a, b) => b.comments - a.comments)
      .slice(0, 10)
      .map(post => ({
        _id: post._id,
        title: post.title,
        slug: post.slug,
        author: post.authorId,
        comments: post.comments,
        views: post.views,
        likes: post.likes,
        publishedAt: post.publishedAt
      }));

    return NextResponse.json({
      success: true,
      timeRange: days,
      analytics: {
        overview: {
          totalViews,
          totalLikes,
          totalPosts: totalPosts,
          publishedPosts: publishedPosts,
          draftPosts: draftPosts,
          pendingPosts: pendingPosts,
          rejectedPosts: rejectedPosts,
          totalComments: totalComments,
          avgViewsPerPost: avgViewsPerPost,
          avgLikesPerPost: avgLikesPerPost,
          engagementRate: parseFloat(engagementRate)
        },
        topPosts: {
          byViews: topPostsByViews,
          byLikes: topPostsByLikes
        },
        trendingTags,
        inactiveWriters,
        staleDrafts,
        categoryPerformance: sortedCategoryPerformance,
        mostDiscussedBlogs,
        dailyStats,
        recentActivity: recentActivity.slice(0, 20),
        hourlyViews
      }
    });

  } catch (error) {
    console.error('Admin Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
} 