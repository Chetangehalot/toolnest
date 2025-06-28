import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Blog from '@/models/Blog';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { logBlogAction, getRequestMetadata } from '@/lib/auditLogger';

// PATCH /api/blog/posts/[postId]/status - Update blog post status
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    await connectDB();
    
    const { postId } = params;
    const { status, rejectionReason } = await request.json();
    
    // Validate status
    const validStatuses = ['draft', 'pending_approval', 'published', 'rejected', 'unpublished'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    
    // Find the post
    const post = await Blog.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Check permissions
    const canEdit = 
      post.authorId.toString() === session.user.id || // Author can edit their own posts
      ['manager', 'admin'].includes(session.user.role); // Managers/admins can edit any post
    
    if (!canEdit) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Role-based status change restrictions
    if (session.user.role === 'writer') {
      // Writers can only change between draft and pending_approval
      if (!['draft', 'pending_approval'].includes(status)) {
        return NextResponse.json(
          { error: 'Writers can only set status to draft or pending_approval' },
          { status: 403 }
        );
      }
    }
    
    // Store old status for audit logging
    const oldStatus = post.status;
    
    // Prepare update data
    const updateData = { status };
    
    // Handle approval/rejection tracking
    if (['published', 'rejected', 'unpublished'].includes(status)) {
      if (!['manager', 'admin'].includes(session.user.role)) {
        return NextResponse.json(
          { error: 'Only managers and admins can publish, reject, or unpublish posts' },
          { status: 403 }
        );
      }
      
      if (status === 'published') {
        updateData.approvedBy = session.user.id;
        updateData.approvedAt = new Date();
        updateData.rejectedBy = undefined;
        updateData.rejectedAt = undefined;
        updateData.rejectionReason = undefined;
        updateData.unpublishedBy = undefined;
        updateData.unpublishedAt = undefined;
      } else if (status === 'rejected') {
        updateData.rejectedBy = session.user.id;
        updateData.rejectedAt = new Date();
        updateData.rejectionReason = rejectionReason;
        updateData.approvedBy = undefined;
        updateData.approvedAt = undefined;
        updateData.unpublishedBy = undefined;
        updateData.unpublishedAt = undefined;
      } else if (status === 'unpublished') {
        updateData.unpublishedBy = session.user.id;
        updateData.unpublishedAt = new Date();
      }
    }
    
    // Add to status history
    if (status !== post.status) {
      updateData.$push = {
        statusHistory: {
          status: status,
          changedBy: session.user.id,
          changedAt: new Date(),
          reason: rejectionReason || `Status changed from ${oldStatus} to ${status}`
        }
      };
    }
    
    // Update user stats
    if (status === 'published' && post.status !== 'published') {
      await User.findByIdAndUpdate(post.authorId, {
        $inc: { 'blogStats.publishedPosts': 1 }
      });
    } else if (post.status === 'published' && status !== 'published') {
      await User.findByIdAndUpdate(post.authorId, {
        $inc: { 'blogStats.publishedPosts': -1 }
      });
    }
    
    // Update the post
    const updatedPost = await Blog.findByIdAndUpdate(
      postId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('authorId', 'name email image')
      .populate('categories', 'name slug color')
      .populate('approvedBy', 'name email role')
      .populate('rejectedBy', 'name email role')
      .populate('repostedBy', 'name email role')
      .populate('unpublishedBy', 'name email role');

    // Log blog status change action
    if (status !== oldStatus) {
      try {
        const metadata = getRequestMetadata(request);
        let action = status;
        if (status === 'published') action = 'approved';
        if (status === 'rejected') action = 'rejected';
        if (status === 'unpublished') action = 'unpublished';
        
        await logBlogAction({
          blogId: postId,
          action: action,
          performedBy: {
            _id: session.user.id,
            name: session.user.name,
            role: session.user.role
          },
          reason: rejectionReason || `Blog status changed from ${oldStatus} to ${status}`,
          changes: [{
            field: 'status',
            oldValue: oldStatus,
            newValue: status
          }],
          metadata
        });
      } catch (auditError) {
        console.error('Failed to log blog status change audit:', auditError);
        // Don't fail the status update if audit logging fails
      }
    }
    
    // Create notifications for status changes
    if (status !== post.status) {
      try {
        const authorId = post.authorId._id || post.authorId;
        
        // Approval request notification (writer submitting for approval)
        if (status === 'pending_approval' && post.status !== 'pending_approval') {
          await Notification.createBlogApprovalRequestNotification(
            postId,
            authorId
          );
  
        }
        
        // Approval/rejection notifications (only for admin/manager actions affecting writers)
        if (['published', 'rejected'].includes(status)) {
          // Only notify if the action was performed by someone other than the author
          if (authorId.toString() !== session.user.id) {
            if (status === 'published') {
              await Notification.createBlogApprovalNotification(
                postId,
                authorId,
                session.user.id
              );
      
            } else if (status === 'rejected') {
              await Notification.createBlogRejectionNotification(
                postId,
                authorId,
                session.user.id,
                rejectionReason
              );
      
            }
          }
        }
      } catch (notificationError) {
        // Don't fail the status update if notification creation fails
        console.error('Failed to create notification:', notificationError);
      }
    }
    
    return NextResponse.json({
      success: true,
      post: updatedPost,
      message: `Post status updated to ${status}`
    });
    
  } catch (error) {
    console.error('Error updating post status:', error);
    return NextResponse.json(
      { error: 'Failed to update post status', details: error.message },
      { status: 500 }
    );
  }
} 