import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import dbConnect from '@/lib/dbConnect';
import Review from '@/models/Review';
import Tool from '@/models/Tool';
import { logReviewAction } from '@/lib/auditLogger';

// PATCH /api/reviews/[reviewId]/hide - Hide a review (admin only)
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'manager')) {
      return NextResponse.json({ error: 'Admin or Manager access required' }, { status: 403 });
    }

    const { reviewId } = params;
    await dbConnect();

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { 
        status: 'hidden',
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Update tool's average rating and review count
    const allReviews = await Review.find({ 
      toolId: review.toolId, 
      status: 'visible' 
    });
    
    // Only use active ratings for average calculation
    const activeRatings = await Review.find({ 
      toolId: review.toolId, 
      status: 'visible', 
      isRatingActive: true,
      rating: { $exists: true, $ne: null }
    });
    
    const avgRating = activeRatings.length > 0 
      ? activeRatings.reduce((sum, r) => sum + r.rating, 0) / activeRatings.length 
      : 0;
    
    await Tool.findByIdAndUpdate(review.toolId, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length
    });

    // Log the review hide action
    await logReviewAction({
      reviewId: review._id,
      action: 'hidden',
      performedBy: {
        _id: session.user.id,
        name: session.user.name,
        role: session.user.role
      },
      reason: `Review hidden by ${session.user.name}`,
      metadata: {
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Review hidden successfully',
      review,
      auditLogged: true
    });

  } catch (error) {
    console.error('Hide review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 