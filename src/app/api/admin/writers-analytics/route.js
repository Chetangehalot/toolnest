import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/db';

// Force this route to be dynamic to prevent it from running during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import Blog from '@/models/Blog';
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

    // Get all writers
    const writers = await User.find({
      role: { $in: ['writer', 'manager', 'admin'] }
    }).select('_id name email image role').lean();

    // Get analytics for each writer
    const writersWithAnalytics = await Promise.all(
      writers.map(async (writer) => {
        // Fetch writer's posts within the time range
        const posts = await Blog.find({
          authorId: writer._id,
          createdAt: { $gte: startDate }
        }).lean();

        const totalPosts = posts.length;
        const publishedPosts = posts.filter(p => p.status === 'published').length;
        const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
        const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
        const totalComments = posts.reduce((sum, p) => sum + (p.comments || 0), 0);

        // Calculate engagement rate
        const engagementRate = totalViews > 0 
          ? ((totalLikes + totalComments) / totalViews * 100).toFixed(1)
          : 0;

        return {
          _id: writer._id,
          name: writer.name,
          email: writer.email,
          image: writer.image,
          role: writer.role,
          totalPosts,
          publishedPosts,
          totalViews,
          totalLikes,
          totalComments,
          engagementRate: parseFloat(engagementRate),
          avgViewsPerPost: totalPosts > 0 ? Math.round(totalViews / totalPosts) : 0,
          avgLikesPerPost: totalPosts > 0 ? Math.round(totalLikes / totalPosts) : 0
        };
      })
    );

    // Filter out writers with no posts and sort by total views
    const activeWriters = writersWithAnalytics
      .filter(writer => writer.totalPosts > 0)
      .sort((a, b) => b.totalViews - a.totalViews);

    return NextResponse.json({
      success: true,
      timeRange: days,
      writers: activeWriters
    });

  } catch (error) {
    console.error('Writers Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch writers analytics data' },
      { status: 500 }
    );
  }
} 