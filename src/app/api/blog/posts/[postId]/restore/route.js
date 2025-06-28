import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Blog from '@/models/Blog';
import Notification from '@/models/Notification';
import { logBlogAction, getRequestMetadata } from '@/lib/auditLogger';

// PATCH /api/blog/posts/[postId]/restore - Restore blog post (Writers can restore their own, Admins can repost)
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { postId } = params;
    const { action, status } = await request.json();

    await connectDB();

    // Find the blog post
    const post = await Blog.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    // Check permissions
    const isAuthor = post.authorId.toString() === session.user.id;
    const isAdminOrManager = ['admin', 'manager'].includes(session.user.role);
    
    if (!isAuthor && !isAdminOrManager) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Writers can only restore their own posts (not repost)
    if (session.user.role === 'writer' && (!isAuthor || action === 'repost')) {
      return NextResponse.json({ 
        error: action === 'repost' 
          ? 'Only admins can repost blogs' 
          : 'You can only restore your own posts' 
      }, { status: 403 });
    }

    let updateData = {};
    let message = '';
    let notificationAction = null;
    let auditAction = '';
    let auditReason = '';

    if (action === 'restore') {
      // Determine the appropriate status to restore to
      let restoreStatus = post.status;
      let shouldRepublish = false;
      
      // Check if this post was published before being deleted
      const wasPublished = post.statusHistory?.some(entry => entry.status === 'published') || 
                          post.publishedAt || 
                          post.approvedAt;
      
      // If it was published before deletion, restore to published
      if (wasPublished && post.status === 'unpublished') {
        restoreStatus = 'published';
        shouldRepublish = true;
      }
      
      // Restore from trash
      updateData = {
        trashedByWriter: false,
        permanentlyHiddenFromWriter: false,
        status: restoreStatus,
        repostedBy: session.user.id,
        repostedAt: new Date(),
        $push: {
          statusHistory: {
            status: restoreStatus,
            changedBy: session.user.id,
            changedAt: new Date(),
            reason: isAdminOrManager ? 'Restored by admin' : 'Restored by writer'
          }
        }
      };
      
      // If republishing, set publish-related fields
      if (shouldRepublish) {
        updateData.publishedAt = new Date();
        updateData.approvedBy = post.approvedBy; // Keep original approver
        updateData.approvedAt = post.approvedAt; // Keep original approval date
      }
      
      message = shouldRepublish ? 
        'Blog post restored and republished successfully' : 
        'Blog post restored successfully';
      
      auditAction = 'restored';
      auditReason = `Blog post restored from trash by ${session.user.role}${shouldRepublish ? ' and republished' : ''}`;
      
      // If writer restores their own post, notify admins
      if (session.user.role === 'writer' && isAuthor) {
        notificationAction = 'writer_restore';
      }
    } else if (action === 'repost') {
      // Only admins/managers can repost (restore and republish)
      if (!isAdminOrManager) {
        return NextResponse.json({ error: 'Only admins can repost blogs' }, { status: 403 });
      }
      
      const newStatus = status || 'published';
      updateData = {
        trashedByWriter: false,
        permanentlyHiddenFromWriter: false,
        status: newStatus,
        repostedBy: session.user.id,
        repostedAt: new Date(),
        publishedAt: newStatus === 'published' ? new Date() : undefined,
        approvedBy: newStatus === 'published' ? session.user.id : undefined,
        approvedAt: newStatus === 'published' ? new Date() : undefined,
        $push: {
          statusHistory: {
            status: newStatus,
            changedBy: session.user.id,
            changedAt: new Date(),
            reason: `Reposted by admin as ${newStatus}`
          }
        }
      };
      message = `Blog post restored and ${newStatus === 'published' ? 'republished' : `set to ${newStatus}`} successfully`;
      notificationAction = 'admin_repost';
      
      auditAction = 'reposted';
      auditReason = `Blog post reposted by ${session.user.role} with status: ${newStatus}`;
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update the blog post
    const updatedPost = await Blog.findByIdAndUpdate(
      postId,
      updateData,
      { new: true }
    ).populate('authorId', 'name email')
     .populate('categories', 'name slug color')
     .populate('repostedBy', 'name email role');

    // Log blog restore/repost action
    try {
      const metadata = getRequestMetadata(request);
      await logBlogAction({
        blogId: postId,
        action: auditAction,
        performedBy: {
          _id: session.user.id,
          name: session.user.name,
          role: session.user.role
        },
        reason: auditReason,
        changes: [{
          field: 'status',
          oldValue: post.status,
          newValue: updateData.status
        }, {
          field: 'trashedByWriter',
          oldValue: post.trashedByWriter || false,
          newValue: false
        }],
        metadata
      });
    } catch (auditError) {
      console.error('Failed to log blog restore/repost audit:', auditError);
      // Don't fail the operation if audit logging fails
    }

    // Create notifications
    if (notificationAction) {
      try {
        if (notificationAction === 'writer_restore') {
          await Notification.createBlogRestoreNotification(
            postId,
            session.user.id,
            post.title
          );
        } else if (notificationAction === 'admin_repost') {
          await Notification.createBlogRepostNotification(
            postId,
            post.authorId,
            session.user.id,
            updateData.status
          );
        }
      } catch (notificationError) {
        console.error('⚠️ Failed to create restore/repost notification:', notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      message,
      post: updatedPost
    });

  } catch (error) {
    console.error('Error restoring/reposting blog post:', error);
    return NextResponse.json(
      { error: 'Failed to restore/repost blog post' },
      { status: 500 }
    );
  }
} 