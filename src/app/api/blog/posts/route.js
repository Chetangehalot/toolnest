import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/db';
import Blog from '@/models/Blog';
import BlogCategory from '@/models/BlogCategory';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { logBlogAction, getRequestMetadata } from '@/lib/auditLogger';

// GET /api/blog/posts - Get blog posts with filtering and pagination
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const author = searchParams.get('author');
    const search = searchParams.get('search');
    const tags = searchParams.get('tags');
    const featured = searchParams.get('featured');
    const populate = searchParams.get('populate'); // New parameter for populating approval data
    const includeTrash = searchParams.get('includeTrash') === 'true';
    
    const session = await getServerSession(authOptions);
    
    // Build query based on user role and filters
    let query = {};
    
    // Public access - only published posts
    if (!session) {
      query.status = 'published';
    } else {
          // Role-based access
    if (session.user.role === 'writer') {
      // Writers can see their own posts (excluding permanently hidden) and published posts
      const writerQuery = { 
        authorId: session.user.id,
        permanentlyHiddenFromWriter: { $ne: true }
      };
      
      // Only exclude trashed posts if includeTrash is not explicitly requested
      if (!includeTrash) {
        writerQuery.trashedByWriter = { $ne: true };
      }
      
      if (status) {
        query = { ...writerQuery, status };
      } else {
        query = {
          $or: [
            { status: 'published', trashedByWriter: { $ne: true } },
            writerQuery
          ]
        };
      }
    } else if (['manager', 'admin'].includes(session.user.role)) {
      // Managers and admins can see all posts (including soft deleted)
      if (status) query.status = status;
    } else {
      // Regular users - only published posts that aren't trashed
      query = { 
        status: 'published',
        trashedByWriter: { $ne: true }
      };
    }
    }
    
    // Apply additional filters
    if (category) query.categories = category;
    if (author) query.authorId = author;
    if (tags) query.tags = { $in: tags.split(',') };
    if (featured === 'true') query.isSticky = true;
    
    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    const total = await Blog.countDocuments(query);
    
    // Build population based on request
    let populateQuery = Blog.find(query)
      .populate('authorId', 'name email image bio')
      .populate('categories', 'name slug color');
    
    // Add approval data population if requested
    if (populate === 'approvals') {
      populateQuery = populateQuery
        .populate('approvedBy', 'name email role')
        .populate('rejectedBy', 'name email role')
        .populate('repostedBy', 'name email role')
        .populate('unpublishedBy', 'name email role');
    }
    
    // Get posts with population
    const posts = await populateQuery
      .sort({ isSticky: -1, updatedAt: -1, publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    return NextResponse.json({
      posts,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch blog posts', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/blog/posts - Create new blog post
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Check if user has writer permissions or higher
    if (!['writer', 'manager', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    await connectDB();
    const body = await request.json();
    const {
      title,
      content,
      excerpt,
      categories,
      tags,
      featuredImage,
      seoTitle,
      seoDescription,
      status = 'draft',
      allowComments = true
    } = body;
    
    // Validate required fields
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }
    
    // Writers can only create drafts or submit for approval
    let postStatus = status;
    if (session.user.role === 'writer' && !['draft', 'pending_approval'].includes(status)) {
      postStatus = 'draft';
    }
    
    // Create blog post
    const blogPost = new Blog({
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt?.trim() || '',
      authorId: session.user.id,
      categories: categories || [],
      tags: tags || [],
      featuredImage: featuredImage || '',
      seoTitle: seoTitle?.trim() || title.trim(),
      seoDescription: seoDescription?.trim() || excerpt?.trim() || '',
      status: postStatus,
      allowComments
    });
    
    await blogPost.save();

    // Log blog creation action
    try {
      const metadata = getRequestMetadata(request);
      await logBlogAction({
        blogId: blogPost._id,
        action: 'created',
        performedBy: {
          _id: session.user.id,
          name: session.user.name,
          role: session.user.role
        },
        reason: `Blog post created with status: ${postStatus}`,
        changes: [{
          field: 'status',
          oldValue: null,
          newValue: postStatus
        }],
        metadata
      });
    } catch (auditError) {
      console.error('Failed to log blog creation audit:', auditError);
      // Don't fail the creation if audit logging fails
    }
    
    // Create approval request notification if status is pending_approval
    if (postStatus === 'pending_approval') {
      try {
        await Notification.createBlogApprovalRequestNotification(
          blogPost._id,
          session.user.id
        );
        } catch (notificationError) {
        // Don't fail the blog creation if notification creation fails
        console.error('⚠️ Failed to create approval request notifications:', notificationError);
      }
    }
    
    // Update user stats
    await User.findByIdAndUpdate(session.user.id, {
      $inc: { 'blogStats.totalPosts': 1 }
    });
    
    // Populate the response
    await blogPost.populate('authorId', 'name email image');
    await blogPost.populate('categories', 'name slug color');
    
    return NextResponse.json({
      success: true,
      post: blogPost
    }, { status: 201 });
    
  } catch (error) {
    console.error('💥 Blog post creation failed:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0] || 'field';
      return NextResponse.json(
        { error: `A post with this ${duplicateField} already exists` },
        { status: 400 }
      );
    }
    
    // Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create blog post', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 

