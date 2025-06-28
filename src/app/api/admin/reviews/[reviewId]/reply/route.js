import { NextResponse } from 'next/server';
import connectDB from '@/lib/dbConnect';
import Review from '@/models/Review';
import { logReviewAction, getRequestMetadata } from '@/lib/auditLogger';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';

export async function POST(request, { params }) {
  try {
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'manager', 'staff'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reviewId } = params;
    const { replyContent } = await request.json();
    
    if (!replyContent || replyContent.trim().length === 0) {
      return NextResponse.json({ error: 'Reply content is required' }, { status: 400 });
    }

    // Get the original review for comparison
    const originalReview = await Review.findById(reviewId);
    if (!originalReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Add the reply
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      {
        $push: {
          replies: {
            content: replyContent,
            repliedBy: session.user.id,
            repliedByName: session.user.name,
            repliedByRole: session.user.role,
            repliedAt: new Date()
          }
        }
      },
      { new: true }
    );

    // Log the audit trail
    const metadata = getRequestMetadata(request);
    await logReviewAction({
      reviewId,
      action: 'replied',
      performedBy: {
        _id: session.user.id,
        name: session.user.name,
        role: session.user.role
      },
      changes: [{
        field: 'replies',
        oldValue: originalReview.replies?.length || 0,
        newValue: (originalReview.replies?.length || 0) + 1
      }],
      reason: 'Admin/staff replied to review',
      metadata,
      details: {
        replyContent: replyContent.substring(0, 100) + (replyContent.length > 100 ? '...' : '')
      }
    });

    return NextResponse.json({
      success: true,
      review: updatedReview,
      message: 'Reply added successfully'
    });
  } catch (error) {
    console.error('Error adding reply:', error);
    return NextResponse.json(
      { error: 'Failed to add reply' },
      { status: 500 }
    );
  }
} 