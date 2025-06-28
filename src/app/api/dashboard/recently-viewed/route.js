import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/db';
import RecentView from '@/models/RecentView';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();

    // Get recent views with tool details
    const recentViews = await RecentView.find({ userId: session.user.id })
      .populate({
        path: 'toolId',
        select: 'name description category rating trending image logo website tags price specifications slug'
      })
      .sort({ viewedAt: -1 })
      .limit(20);

    // Filter out any views where the tool was deleted
    const validViews = recentViews.filter(view => view.toolId);

    return NextResponse.json({
      recentViews: validViews.map(view => ({
        tool: view.toolId,
        viewedAt: view.viewedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching recent views:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
