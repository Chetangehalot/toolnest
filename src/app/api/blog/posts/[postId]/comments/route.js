import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/dbConnect';
import Blog from '@/models/Blog';
import BlogComment from '@/models/BlogComment';

// GET /api/blog/posts/[postId]/comments - Get comments for a blog post
export async function GET(request, { params }) {
  try {
    const { postId } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const includeReplies = searchParams.get('includeReplies') !== 'false';

    await connectDB();

    // Verify blog post exists
    const post = await Blog.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    // Get approved comments
    const comments = await BlogComment.getApprovedForPost(postId, {
      page,
      limit,
      includeReplies
    });

    // Get total count for pagination
    const totalComments = await BlogComment.countDocuments({
      postId,
      status: 'approved',
      parentId: includeReplies ? { $exists: true } : null
    });

    const totalPages = Math.ceil(totalComments / limit);

    return NextResponse.json({
      success: true,
      comments,
      pagination: {
        currentPage: page,
        totalPages,
        totalComments,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST /api/blog/posts/[postId]/comments - Create a new comment
export async function POST(request, { params }) {
  try {
    const { postId } = params;
    const session = await getServerSession(authOptions);
    
    await connectDB();

    const post = await Blog.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const commentData = {
      postId,
      content: content.trim(),
      status: 'approved'
    };

    if (session?.user) {
      commentData.authorId = session.user.id;
    }

    const comment = new BlogComment(commentData);
    await comment.save();

    // Update blog post comment count and daily engagement
    await Blog.findByIdAndUpdate(postId, { $inc: { comments: 1 } });
    await post.updateDailyEngagement('comment');

    return NextResponse.json({
      success: true,
      comment,
      message: 'Comment posted successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
} 