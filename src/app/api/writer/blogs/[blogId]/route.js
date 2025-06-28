import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Blog from '@/models/Blog';
import { logBlogAction, getRequestMetadata } from '@/lib/auditLogger';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (session.user.role !== 'writer' && session.user.role !== 'admin' && session.user.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await connectDB();
    
    const { blogId } = params;
    const body = await request.json();
    
    // Find the blog
    const blog = await Blog.findById(blogId);
    
    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }
    
    // Check permissions - writers can only edit their own blogs
    if (session.user.role === 'writer' && blog.authorId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'You can only edit your own blogs' }, { status: 403 });
    }

    // Store old values for audit logging
    const oldValues = {
      title: blog.title,
      content: blog.content?.substring(0, 100) + '...',
      status: blog.status,
      categories: blog.categories,
      tags: blog.tags
    };
    
    // Create slug from title if title is being updated
    if (body.title) {
      body.slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    
    body.updatedAt = new Date();
    
    const updatedBlog = await Blog.findByIdAndUpdate(
      blogId,
      body,
      { new: true, runValidators: true }
    ).populate('authorId', 'name email');

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
          blogId,
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
    
    return NextResponse.json({ 
      blog: updatedBlog,
      success: true,
      message: 'Blog updated successfully'
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (session.user.role !== 'writer' && session.user.role !== 'admin' && session.user.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await connectDB();
    
    const { blogId } = params;
    
    // Find the blog
    const blog = await Blog.findById(blogId);
    
    if (!blog) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }
    
    // Check permissions - writers can only delete their own blogs
    if (session.user.role === 'writer' && blog.author.toString() !== session.user.id) {
      return NextResponse.json({ error: 'You can only delete your own blogs' }, { status: 403 });
    }
    
    // Log the blog deletion action before deleting
    const metadata = getRequestMetadata(request);
    await logBlogAction({
      blogId,
      action: 'deleted',
      performedBy: {
        _id: session.user.id,
        name: session.user.name,
        role: session.user.role
      },
      reason: `Blog deleted by ${session.user.role === 'writer' ? 'writer' : session.user.role}`,
      metadata
    });
    
    await Blog.findByIdAndDelete(blogId);
    
    return NextResponse.json({ 
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 