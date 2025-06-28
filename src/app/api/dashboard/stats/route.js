import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Review from '@/models/Review';
import RecentView from '@/models/RecentView';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();

    // Get user with bookmarks
    const user = await User.findById(session.user.id).populate('bookmarks');
    
    // Count visible reviews by user
    const reviewCount = await Review.countDocuments({
      userId: session.user.id,
      status: 'visible'
    });

    // Count recent views
    const recentViewCount = await RecentView.countDocuments({
      userId: session.user.id
    });

    return NextResponse.json({
      bookmarks: user.bookmarks?.length || 0,
      reviews: reviewCount,
      recentlyViewed: recentViewCount
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
