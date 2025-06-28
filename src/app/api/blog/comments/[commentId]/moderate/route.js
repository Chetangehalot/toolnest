import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/dbConnect';
import Blog from '@/models/Blog';
import BlogComment from '@/models/BlogComment';

export async function PATCH(request, { params }) {
  try {
    const { commentId } = params;
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only admins and managers can moderate comments
    if (!['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const body = await request.json();
    const { action, reason } = body; // action: 'approve' | 'reject' | 'spam'

    if (!['approve', 'reject', 'spam'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Find the comment
    const comment = await BlogComment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const oldStatus = comment.status;
    let updatedComment;

    if (action === 'approve') {
      updatedComment = await comment.approve(session.user.id);
      
      // If comment was just approved (status changed from pending to approved)
      if (oldStatus !== 'approved') {
        try {
          // Increment blog post comment count
          await Blog.findByIdAndUpdate(comment.postId, { $inc: { comments: 1 } });
          
          // Update daily engagement for the comment creation date
          const post = await Blog.findById(comment.postId);
          if (post) {
            const commentDate = comment.createdAt;
            await post.updateDailyEngagement('comment', commentDate);
            // Comment approved and daily engagement updated
          }
        } catch (engagementError) {
          console.error('⚠️ Failed to update comment engagement:', engagementError);
          // Don't fail the moderation if engagement tracking fails
        }
      }
    } else {
      // Reject or mark as spam
      updatedComment = await comment.reject(session.user.id, reason);
      
      // If comment was previously approved, decrement counts
      if (oldStatus === 'approved') {
        try {
          await Blog.findByIdAndUpdate(comment.postId, { $inc: { comments: -1 } });
          
          // Decrement daily engagement
          const post = await Blog.findById(comment.postId);
          if (post) {
            const commentDate = comment.createdAt;
            await post.decrementDailyEngagement('comment', commentDate);
            // Comment rejected and daily engagement decremented
          }
        } catch (engagementError) {
          console.error('⚠️ Failed to update comment engagement:', engagementError);
        }
      }
    }

    // Populate the response
    await updatedComment.populate('authorId', 'name email');
    await updatedComment.populate('postId', 'title slug');

    return NextResponse.json({
      success: true,
      comment: updatedComment,
      message: `Comment ${action}d successfully`
    });

  } catch (error) {
    console.error('Error moderating comment:', error);
    return NextResponse.json(
      { error: 'Failed to moderate comment' },
      { status: 500 }
    );
  }
} 