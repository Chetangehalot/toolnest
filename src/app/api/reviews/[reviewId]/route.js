import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import dbConnect from '@/lib/dbConnect';
import Review from '@/models/Review';
import Tool from '@/models/Tool';
import { logReviewAction } from '@/lib/auditLogger';

// DELETE /api/reviews/[reviewId] - Delete a review
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { reviewId } = params;
    await dbConnect();

    // Find the review
    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Check if user owns the review or is admin/manager
    if (review.userId.toString() !== session.user.id && 
        session.user.role !== 'admin' && 
        session.user.role !== 'manager') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Log the review deletion action before deleting
    if (session.user.role === 'admin' || session.user.role === 'manager') {
      await logReviewAction({
        reviewId: review._id,
        action: 'deleted',
        performedBy: {
          _id: session.user.id,
          name: session.user.name,
          role: session.user.role
        },
        reason: `Review deleted by ${session.user.name}`,
        metadata: {
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown'
        }
      });
    }

    // Delete the review
    await Review.findByIdAndDelete(reviewId);

    // Update tool's average rating and review count
    const remainingReviews = await Review.find({ 
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
      reviewCount: remainingReviews.length
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Review deleted successfully',
      auditLogged: session.user.role === 'admin' || session.user.role === 'manager'
    });

  } catch (error) {
    console.error('Delete review error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 