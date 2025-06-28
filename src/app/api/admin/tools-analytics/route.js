import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/db';

// Force this route to be dynamic to prevent it from running during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import Tool from '@/models/Tool';
import Review from '@/models/Review';
import RecentView from '@/models/RecentView';
import User from '@/models/User';

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

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30'; // days

    // Calculate date range
    const days = parseInt(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all tools
    const tools = await Tool.find({}).lean();
    
    // Get reviews within time range
    const reviews = await Review.find({
      createdAt: { $gte: startDate }
    })
    .populate('userId', 'name email')
    .populate('toolId', 'name slug category')
    .lean();

    // Get recent views within time range
    const recentViews = await RecentView.find({
      viewedAt: { $gte: startDate }
    })
    .populate('toolId', 'name slug category')
    .populate('userId', 'name email')
    .lean();

    // Calculate overall statistics
    const totalTools = tools.length;
    const totalReviews = reviews.length;
    const totalViews = recentViews.length;
    const avgRating = tools.length > 0 ? 
      (tools.reduce((sum, tool) => sum + (tool.rating || 0), 0) / tools.length).toFixed(1) : 0;

    // Calculate tools by category
    const categoryStats = {};
    tools.forEach(tool => {
      const category = tool.category || 'Uncategorized';
      if (!categoryStats[category]) {
        categoryStats[category] = {
          name: category,
          toolCount: 0,
          totalReviews: 0,
          totalViews: 0,
          avgRating: 0,
          ratings: []
        };
      }
      categoryStats[category].toolCount++;
      categoryStats[category].ratings.push(tool.rating || 0);
    });

    // Add review and view data to categories
    reviews.forEach(review => {
      if (review.toolId && review.toolId.category) {
        const category = review.toolId.category;
        if (categoryStats[category]) {
          categoryStats[category].totalReviews++;
        }
      }
    });

    recentViews.forEach(view => {
      if (view.toolId && view.toolId.category) {
        const category = view.toolId.category;
        if (categoryStats[category]) {
          categoryStats[category].totalViews++;
        }
      }
    });

    // Calculate average ratings for categories
    Object.keys(categoryStats).forEach(category => {
      const stats = categoryStats[category];
      stats.avgRating = stats.ratings.length > 0 ? 
        (stats.ratings.reduce((sum, rating) => sum + rating, 0) / stats.ratings.length).toFixed(1) : 0;
      delete stats.ratings; // Remove ratings array from response
    });

    const topCategories = Object.values(categoryStats)
      .sort((a, b) => b.toolCount - a.toolCount)
      .slice(0, 10);

    // Get top rated tools
    const topRatedTools = tools
      .filter(tool => (tool.rating || 0) > 0 && (tool.reviewCount || 0) >= 3)
      .sort((a, b) => {
        // Sort by rating first, then by review count
        if (b.rating !== a.rating) return b.rating - a.rating;
        return (b.reviewCount || 0) - (a.reviewCount || 0);
      })
      .slice(0, 10)
      .map(tool => ({
        _id: tool._id,
        name: tool.name,
        slug: tool.slug,
        category: tool.category,
        rating: tool.rating || 0,
        reviewCount: tool.reviewCount || 0,
        image: tool.image,
        description: tool.description
      }));

    // Get most reviewed tools
    const mostReviewedTools = tools
      .filter(tool => (tool.reviewCount || 0) > 0)
      .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
      .slice(0, 10)
      .map(tool => ({
        _id: tool._id,
        name: tool.name,
        slug: tool.slug,
        category: tool.category,
        rating: tool.rating || 0,
        reviewCount: tool.reviewCount || 0,
        image: tool.image,
        description: tool.description
      }));

    // Get most viewed tools (based on recent views)
    const toolViewCounts = {};
    recentViews.forEach(view => {
      if (view.toolId && view.toolId._id) {
        const toolId = view.toolId._id.toString();
        toolViewCounts[toolId] = (toolViewCounts[toolId] || 0) + 1;
      }
    });

    const mostViewedTools = Object.entries(toolViewCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([toolId, viewCount]) => {
        const tool = tools.find(t => t._id.toString() === toolId);
        return tool ? {
          _id: tool._id,
          name: tool.name,
          slug: tool.slug,
          category: tool.category,
          rating: tool.rating || 0,
          reviewCount: tool.reviewCount || 0,
          viewCount,
          image: tool.image,
          description: tool.description
        } : null;
      })
      .filter(Boolean);

    // Calculate daily stats for charts
    const dailyStats = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayReviews = reviews.filter(r => {
        const reviewDate = new Date(r.createdAt);
        return reviewDate >= date && reviewDate < nextDate;
      });

      const dayViews = recentViews.filter(v => {
        const viewDate = new Date(v.viewedAt);
        return viewDate >= date && viewDate < nextDate;
      });

      // Only calculate average rating from active ratings
      const activeRatings = dayReviews.filter(r => r.isRatingActive);
      
      dailyStats.push({
        date: date.toISOString().split('T')[0],
        reviews: dayReviews.length,
        views: dayViews.length,
        avgRating: activeRatings.length > 0 ? 
          (activeRatings.reduce((sum, r) => sum + r.rating, 0) / activeRatings.length).toFixed(1) : 0
      });
    }

    // Get recent activity (latest reviews and views)
    const recentReviews = reviews
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20)
      .map(review => ({
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: review.userId,
        tool: review.toolId,
        type: 'review'
      }));

    const recentViewsActivity = recentViews
      .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
      .slice(0, 20)
      .map(view => ({
        _id: view._id,
        viewedAt: view.viewedAt,
        user: view.userId,
        tool: view.toolId,
        type: 'view'
      }));

    // Rating distribution (only count active ratings)
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      if (review.isRatingActive && review.rating >= 1 && review.rating <= 5) {
        ratingDistribution[review.rating]++;
      }
    });

    return NextResponse.json({
      success: true,
      timeRange: days,
      analytics: {
        overview: {
          totalTools,
          totalReviews,
          totalViews,
          avgRating: parseFloat(avgRating),
          avgReviewsPerTool: totalTools > 0 ? (totalReviews / totalTools).toFixed(1) : 0,
          avgViewsPerTool: totalTools > 0 ? (totalViews / totalTools).toFixed(1) : 0
        },
        topTools: {
          byRating: topRatedTools,
          byReviews: mostReviewedTools,
          byViews: mostViewedTools
        },
        categoryPerformance: topCategories,
        dailyStats,
        recentActivity: {
          reviews: recentReviews,
          views: recentViewsActivity
        },
        ratingDistribution
      }
    });

  } catch (error) {
    console.error('Tools Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tools analytics data' },
      { status: 500 }
    );
  }
} 