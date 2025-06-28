import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/dbConnect';
import Blog from '@/models/Blog';
import User from '@/models/User';
import BlogCategory from '@/models/BlogCategory';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission (writer, manager, or admin)
    if (!['writer', 'manager', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30'; // days
    const authorId = searchParams.get('authorId') || session.user.id;

    // For managers and admins, allow viewing other writers' analytics
    // For writers, only allow their own analytics
    if (session.user.role === 'writer' && authorId !== session.user.id) {
      return NextResponse.json({ error: 'Can only view your own analytics' }, { status: 403 });
    }

    // Calculate date range
    const days = parseInt(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch posts with detailed analytics (time-based for most analytics)
    const posts = await Blog.find({
      authorId: authorId,
      createdAt: { $gte: startDate }
    })
    .populate('authorId', 'name email image role')
    .populate('categories', 'name')
    .sort({ createdAt: -1 })
    .lean();

    // Fetch ALL posts by this writer (for comprehensive analysis)
    const allPosts = await Blog.find({
      authorId: authorId
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
        categories: post.categories
      }));

    const topPostsByLikes = posts
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
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
        categories: post.categories
      }));

    // Calculate daily stats for charts
    const dailyStats = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayPosts = posts.filter(p => {
        const postDate = new Date(p.createdAt);
        return postDate >= date && postDate < nextDate;
      });

      const dayPublished = posts.filter(p => {
        if (!p.publishedAt) return false;
        const publishDate = new Date(p.publishedAt);
        return publishDate >= date && publishDate < nextDate;
      });

      dailyStats.push({
        date: date.toISOString().split('T')[0],
        posts: dayPosts.length,
        published: dayPublished.length,
        views: dayPosts.reduce((sum, p) => sum + (p.views || 0), 0),
        likes: dayPosts.reduce((sum, p) => sum + (p.likes || 0), 0)
      });
    }

    // Get recent activity (last 10 posts with their metrics)
    const recentPosts = posts
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10)
      .map(post => ({
        _id: post._id,
        title: post.title,
        slug: post.slug,
        status: post.status,
        views: post.views || 0,
        likes: post.likes || 0,
        comments: post.comments || 0,
        createdAt: post.createdAt,
        publishedAt: post.publishedAt,
        categories: post.categories,
        excerpt: post.excerpt,
        author: post.authorId // Include author info for admin/manager views
      }));

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
          categoryStats[category.name].posts++;
          categoryStats[category.name].views += post.views || 0;
          categoryStats[category.name].likes += post.likes || 0;
          categoryStats[category.name].comments += post.comments || 0;
        });
      }
    });

    const topCategories = Object.values(categoryStats)
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // Calculate all-time statistics from allPosts
    const allTimeTotalPosts = allPosts.length;
    const allTimePublishedPosts = allPosts.filter(p => p.status === 'published').length;
    const allTimeDraftPosts = allPosts.filter(p => p.status === 'draft').length;
    const allTimePendingPosts = allPosts.filter(p => p.status === 'pending_approval').length;
    const allTimeRejectedPosts = allPosts.filter(p => p.status === 'rejected').length;

    const allTimeTotalViews = allPosts.reduce((sum, p) => sum + (p.views || 0), 0);
    const allTimeTotalLikes = allPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
    const allTimeTotalComments = allPosts.reduce((sum, p) => sum + (p.comments || 0), 0);

    const allTimeAvgViewsPerPost = allTimeTotalPosts > 0 ? Math.round(allTimeTotalViews / allTimeTotalPosts) : 0;
    const allTimeAvgLikesPerPost = allTimeTotalPosts > 0 ? Math.round(allTimeTotalLikes / allTimeTotalPosts) : 0;
    const allTimeEngagementRate = allTimeTotalViews > 0 ? ((allTimeTotalLikes + allTimeTotalComments) / allTimeTotalViews * 100).toFixed(2) : 0;

    return NextResponse.json({
      success: true,
      timeRange: days,
      analytics: {
        overview: {
          totalPosts,
          publishedPosts,
          draftPosts,
          pendingPosts,
          rejectedPosts,
          totalViews,
          totalLikes,
          totalComments,
          avgViewsPerPost,
          avgLikesPerPost,
          engagementRate: parseFloat(engagementRate)
        },
        allTimeOverview: {
          totalPosts: allTimeTotalPosts,
          publishedPosts: allTimePublishedPosts,
          draftPosts: allTimeDraftPosts,
          pendingPosts: allTimePendingPosts,
          rejectedPosts: allTimeRejectedPosts,
          totalViews: allTimeTotalViews,
          totalLikes: allTimeTotalLikes,
          totalComments: allTimeTotalComments,
          avgViewsPerPost: allTimeAvgViewsPerPost,
          avgLikesPerPost: allTimeAvgLikesPerPost,
          engagementRate: parseFloat(allTimeEngagementRate)
        },
        topPosts: {
          byViews: topPostsByViews,
          byLikes: topPostsByLikes
        },
        recentActivity: recentPosts,
        allPosts: allPosts.map(post => ({
          _id: post._id,
          title: post.title,
          slug: post.slug,
          status: post.status,
          views: post.views || 0,
          likes: post.likes || 0,
          comments: post.comments || 0,
          createdAt: post.createdAt,
          publishedAt: post.publishedAt,
          categories: post.categories,
          excerpt: post.excerpt,
          author: post.authorId
        })),
        dailyStats,
        categoryPerformance: topCategories
      }
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
} 