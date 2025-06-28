import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Review from '@/models/Review';

// Force this route to be dynamic to prevent it from running during build
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { logReviewAction, getRequestMetadata } from '@/lib/auditLogger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';

// GET /api/admin/reviews - Get all reviews for admin moderation
export async function GET(request) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'manager', 'staff'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;
    
    // Build query
    const query = {};
    if (status) {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { content: { $regex: search, $options: 'i' } },
        { 'user.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Get reviews with populated user and tool data
    const reviews = await Review.find(query)
      .populate('userId', 'name email avatar')
      .populate('toolId', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const total = await Review.countDocuments(query);

    return NextResponse.json({
      reviews,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      total
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'manager', 'staff'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reviewId, action, reason } = await request.json();
    
    if (!reviewId || !action) {
      return NextResponse.json({ error: 'Review ID and action are required' }, { status: 400 });
    }

    // Get the original review for comparison
    const originalReview = await Review.findById(reviewId);
    if (!originalReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    let updateData = {};
    let auditAction = action;

    switch (action) {
      case 'hide':
        updateData = { status: 'hidden' };
        auditAction = 'hidden';
        break;
      case 'restore':
        updateData = { status: 'active' };
        auditAction = 'restored';
        break;
      case 'delete':
        updateData = { status: 'deleted' };
        auditAction = 'deleted';
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update the review
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      updateData,
      { new: true }
    );

    // Log the audit trail
    const metadata = getRequestMetadata(request);
    await logReviewAction({
      reviewId,
      action: auditAction,
      performedBy: {
        _id: session.user.id,
        name: session.user.name,
        role: session.user.role
      },
      changes: [{
        field: 'status',
        oldValue: originalReview.status,
        newValue: updateData.status
      }],
      reason: reason || `${auditAction} review`,
      metadata
    });

    return NextResponse.json({
      success: true,
      review: updatedReview,
      message: `Review ${auditAction} successfully`
    });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
} 
