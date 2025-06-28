import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import dbConnect from '@/lib/dbConnect';
import Review from '@/models/Review';
import Tool from '@/models/Tool';
import Notification from '@/models/Notification';
import { logReviewAction } from '@/lib/auditLogger';

// PATCH /api/reviews/[reviewId]/reply - Add admin/manager/writer reply to review
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['admin', 'manager', 'writer'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Admin, Manager, or Writer access required' }, { status: 403 });
    }

    const { reviewId } = params;
    const { reply } = await request.json();

    if (!reply || reply.trim().length === 0) {
      return NextResponse.json({ error: 'Reply content is required' }, { status: 400 });
    }

    await dbConnect();

    // Find the review and populate tool info
    const review = await Review.findById(reviewId).populate('toolId', 'name slug');
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Update review with reply, author name, and role
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { 
        reply: reply.trim(),
        replyAuthor: session.user.name,
        replyRole: session.user.role,
        updatedAt: new Date()
      },
      { new: true }
    );

    // Log the review reply action for staff members
    if (['admin', 'manager'].includes(session.user.role)) {
      await logReviewAction({
        reviewId: review._id,
        action: 'replied',
        performedBy: {
          _id: session.user.id,
          name: session.user.name,
          role: session.user.role
        },
        reason: `Replied to review on "${review.toolId.name}"`,
        metadata: {
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
          toolName: review.toolId.name,
          toolSlug: review.toolId.slug
        }
      });
    }

    // Create notification for the review author
    try {
      const toolSlug = review.toolId.slug || review.toolId._id;
      const notification = await Notification.create({
        recipient: review.userId,
        title: 'New Reply to Your Review 💬',
        message: `Your review on "${review.toolId.name}" has a new reply from ${session.user.name} (${session.user.role})`,
        type: 'info',
        link: `/tools/${toolSlug}#reviews`,
        relatedTool: review.toolId._id,
        actionBy: session.user.id,
        metadata: {
          action: 'review_reply',
          toolName: review.toolId.name,
          toolSlug: toolSlug,
          reviewId: review._id,
          replyAuthor: session.user.name,
          replyRole: session.user.role
        }
      });
      

    } catch (notificationError) {
      console.error('⚠️ Failed to create review reply notification:', notificationError);
      // Don't fail the reply creation if notification fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Reply added successfully',
      review: updatedReview,
      auditLogged: ['admin', 'manager'].includes(session.user.role)
    });

  } catch (error) {
    console.error('Add reply error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 