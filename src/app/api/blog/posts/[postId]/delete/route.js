import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Blog from '@/models/Blog';
import Notification from '@/models/Notification';
import { logBlogAction, getRequestMetadata } from '@/lib/auditLogger';

// PATCH /api/blog/posts/[postId]/delete - Soft delete blog by writer
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { postId } = params;
    await connectDB();

    // Find the blog post
    const post = await Blog.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    // Check if user is the author or has admin/manager privileges
    const isAuthor = post.authorId.toString() === session.user.id;
    const isAdminOrManager = ['admin', 'manager'].includes(session.user.role);
    
    if (!isAuthor && !isAdminOrManager) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    // Writers can only soft delete their own posts
    if (session.user.role === 'writer' && !isAuthor) {
      return NextResponse.json({ error: 'You can only delete your own posts' }, { status: 403 });
    }

    const oldStatus = post.status;

    // Prepare update data
    const updateData = {
      trashedByWriter: true,
      deletedAt: new Date(),
      deletedBy: session.user.id
    };

    // If the blog is published, unpublish it
    if (post.status === 'published') {
      updateData.status = 'unpublished';
      
      // Add to status history
      updateData.$push = {
        statusHistory: {
          status: 'unpublished',
          changedBy: session.user.id,
          changedAt: new Date(),
          reason: 'Deleted by writer'
        }
      };
    }

    // Update the blog post
    const updatedPost = await Blog.findByIdAndUpdate(
      postId,
      updateData,
      { new: true }
    ).populate('authorId', 'name email')
     .populate('categories', 'name slug color');

    // Log blog soft deletion action
    try {
      const metadata = getRequestMetadata(request);
      const changes = [{
        field: 'trashedByWriter',
        oldValue: post.trashedByWriter || false,
        newValue: true
      }];

      if (oldStatus !== updateData.status) {
        changes.push({
          field: 'status',
          oldValue: oldStatus,
          newValue: updateData.status
        });
      }

      await logBlogAction({
        blogId: postId,
        action: 'soft_deleted',
        performedBy: {
          _id: session.user.id,
          name: session.user.name,
          role: session.user.role
        },
        reason: `Blog post moved to trash by ${session.user.role}${oldStatus === 'published' ? ' and unpublished' : ''}`,
        changes,
        metadata
      });
    } catch (auditError) {
      console.error('Failed to log blog soft deletion audit:', auditError);
      // Don't fail the deletion if audit logging fails
    }

    // Create notification for admins/managers when writer deletes a post
    if (session.user.role === 'writer' && isAuthor) {
      try {
        await Notification.createBlogDeleteNotification(
          postId,
          session.user.id,
          post.title
        );
    
      } catch (notificationError) {
        // Don't fail the delete operation if notification creation fails
        console.error('⚠️ Failed to create blog delete notification:', notificationError);
      }
    }

    return NextResponse.json({
      success: true,
      message: post.status === 'published' 
        ? 'Blog post has been unpublished and moved to trash'
        : 'Blog post has been moved to trash',
      post: updatedPost
    });

  } catch (error) {
    console.error('Error soft deleting blog post:', error);
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    );
  }
}

// DELETE /api/blog/posts/[postId]/delete - Permanent delete (admin only)
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only admins can permanently delete
    if (!['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Only admins can permanently delete posts' }, { status: 403 });
    }

    const { postId } = params;
    await connectDB();

    // Find the blog post
    const post = await Blog.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    // Log blog permanent deletion action BEFORE deleting
    try {
      const metadata = getRequestMetadata(request);
      await logBlogAction({
        blogId: postId,
        action: 'permanently_deleted',
        performedBy: {
          _id: session.user.id,
          name: session.user.name,
          role: session.user.role
        },
        reason: `Blog post permanently deleted by ${session.user.role}`,
        changes: [{
          field: 'status',
          oldValue: post.status,
          newValue: 'deleted'
        }],
        metadata
      });
    } catch (auditError) {
      console.error('Failed to log blog permanent deletion audit:', auditError);
      // Don't fail the deletion if audit logging fails
    }

    // Permanently delete the post
    await Blog.findByIdAndDelete(postId);

    return NextResponse.json({
      success: true,
      message: 'Blog post permanently deleted'
    });

  } catch (error) {
    console.error('Error permanently deleting blog post:', error);
    return NextResponse.json(
      { error: 'Failed to permanently delete blog post' },
      { status: 500 }
    );
  }
} 