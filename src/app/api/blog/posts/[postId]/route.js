import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Blog from '@/models/Blog';
import User from '@/models/User';
import { logBlogAction, getRequestMetadata } from '@/lib/auditLogger';

// GET /api/blog/posts/[postId] - Get single blog post
export async function GET(request, { params }) {
  try {
    await connectDB();
    
    const { postId } = params;
    const session = await getServerSession(authOptions);
    
    // Find post by ID or slug
    let query = {};
    if (postId.match(/^[0-9a-fA-F]{24}$/)) {
      query._id = postId;
    } else {
      query.slug = postId;
    }
    
    const post = await Blog.findOne(query)
      .populate('authorId', 'name email image bio socialLinks')
      .populate('categories', 'name slug color')
      .populate('approvedBy', 'name email role')
      .populate('rejectedBy', 'name email role')
      .populate('repostedBy', 'name email role')
      .populate('unpublishedBy', 'name email role')
      .lean();
    
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Check access permissions
    const canAccess = 
      post.status === 'published' || // Published posts are public
      (session && session.user.id === post.authorId._id.toString()) || // Author can see their own posts
      (session && ['manager', 'admin'].includes(session.user.role)); // Managers/admins can see all
    
    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Increment views for published posts (but not for authors viewing their own posts)
    if (post.status === 'published' && (!session || session.user.id !== post.authorId._id.toString())) {
      // Add to viewedBy array with timestamp
      const viewData = {
        userId: session ? session.user.id : null,
        viewedAt: new Date()
      };
      
      // Update view count and add to viewedBy array
      const updatedPost = await Blog.findByIdAndUpdate(post._id, { 
        $inc: { views: 1 },
        $addToSet: { viewedBy: viewData }
      }, { new: true });
      
      // Update daily engagement tracking
      try {
        if (updatedPost && updatedPost.updateDailyEngagement) {
          await updatedPost.updateDailyEngagement('view');
        }
      } catch (engagementError) {
        // Daily engagement update failed (non-critical)
      }
      
      post.views += 1;
    }
    
    return NextResponse.json({ post });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch blog post', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/blog/posts/[postId] - Update blog post
export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    await connectDB();
    
    const { postId } = params;
    const body = await request.json();
    
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
    
    // Writers can only edit certain fields and can't publish directly
    if (session.user.role === 'writer' && post.authorId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Writers can only edit their own posts' }, { status: 403 });
    }
    
    // Store old values for audit logging
    const oldValues = {
      title: post.title,
      content: post.content?.substring(0, 100) + '...',
      status: post.status,
      categories: post.categories,
      tags: post.tags
    };
    
    // Prepare update data
    const updateData = { ...body };
    
    // Update slug if title changed
    if (body.title && body.title !== post.title) {
      updateData.slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    
    // Writers can't directly publish - they need approval
    if (session.user.role === 'writer' && body.status === 'published') {
      updateData.status = 'pending_approval';
    }
    
    updateData.updatedAt = new Date();
    
    const updatedPost = await Blog.findByIdAndUpdate(post._id, {
      ...updateData,
      updatedBy: session.user.id,
      updatedAt: new Date()
    }, { new: true, runValidators: true })
      .populate('authorId', 'name email image')
      .populate('categories', 'name slug color')
      .populate('approvedBy', 'name email role')
      .populate('rejectedBy', 'name email role')
      .populate('repostedBy', 'name email role')
      .populate('unpublishedBy', 'name email role');

    // Log blog update action
    try {
      const metadata = getRequestMetadata(request);
      const changes = [];
      
      // Track specific field changes
      if (body.title && body.title !== oldValues.title) {
        changes.push({
          field: 'title',
          oldValue: oldValues.title,
          newValue: body.title
        });
      }
      
      if (body.content && body.content.substring(0, 100) !== oldValues.content) {
        changes.push({
          field: 'content',
          oldValue: oldValues.content,
          newValue: body.content.substring(0, 100) + '...'
        });
      }
      
      if (body.status && body.status !== oldValues.status) {
        changes.push({
          field: 'status',
          oldValue: oldValues.status,
          newValue: body.status
        });
      }
      
      if (changes.length > 0) {
        await logBlogAction({
          blogId: postId,
          action: 'updated',
          performedBy: {
            _id: session.user.id,
            name: session.user.name,
            role: session.user.role
          },
          reason: `Blog post updated by ${session.user.role}`,
          changes,
          metadata
        });
      }
    } catch (auditError) {
      console.error('Failed to log blog update audit:', auditError);
      // Don't fail the update if audit logging fails
    }
    
    // Update user stats if status changed to published
    if (body.status === 'published' && post.status !== 'published') {
      await User.findByIdAndUpdate(post.authorId, {
        $inc: { 'blogStats.publishedPosts': 1 }
      });
    } else if (post.status === 'published' && body.status !== 'published') {
      await User.findByIdAndUpdate(post.authorId, {
        $inc: { 'blogStats.publishedPosts': -1 }
      });
    }
    
    return NextResponse.json({
      success: true,
      post: updatedPost,
      message: 'Post updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating blog post:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update blog post', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/blog/posts/[postId] - Delete blog post
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    await connectDB();
    
    const { postId } = params;
    
    // Find the post
    const post = await Blog.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Check permissions
    const canDelete = 
      post.authorId.toString() === session.user.id || // Author can delete their own posts
      ['manager', 'admin'].includes(session.user.role); // Managers/admins can delete any post
    
    if (!canDelete) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Log the blog deletion action before deleting
    const metadata = getRequestMetadata(request);
    await logBlogAction({
      blogId: postId,
      action: 'deleted',
      performedBy: {
        _id: session.user.id,
        name: session.user.name,
        role: session.user.role
      },
      reason: `Blog post permanently deleted by ${session.user.role}`,
      metadata
    });
    
    // Delete the post
    await Blog.findByIdAndDelete(postId);
    
    // Update user stats
    const statsUpdate = { $inc: { 'blogStats.totalPosts': -1 } };
    if (post.status === 'published') {
      statsUpdate.$inc['blogStats.publishedPosts'] = -1;
    }
    
    await User.findByIdAndUpdate(post.authorId, statsUpdate);
    
    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully'
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete blog post', details: error.message },
      { status: 500 }
    );
  }
} 