import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/db';

// Force this route to be dynamic to prevent it from running during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import User from '@/models/User';
import Tool from '@/models/Tool';
import Review from '@/models/Review';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await connectDB();

    // Get total counts for dashboard stats
    const [totalUsers, totalTools, totalReviews] = await Promise.all([
      User.countDocuments({}),
      Tool.countDocuments({}),
      Review.countDocuments({})
    ]);

    return NextResponse.json({
      totalUsers,
      totalTools,
      totalReviews
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
} 
