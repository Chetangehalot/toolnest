import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Blog from '@/models/Blog';

// POST /api/blog/posts/[postId]/like - Toggle like on a blog post
export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    await connectDB();
    
    const { postId } = params;
    const userId = session.user.id;
    
    // Find the post
    const post = await Blog.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    // Check if user has already liked the post
    const hasLiked = post.likedBy.some(like => 
      like.userId ? like.userId.toString() === userId : like.toString() === userId
    );
    
    if (hasLiked) {
      // Unlike the post - handle both old and new formats
      await Blog.findByIdAndUpdate(postId, {
        $pull: { 
          likedBy: { userId: userId },  // New format
          likedBy: userId               // Old format fallback
        },
        $inc: { likes: -1 }
      });
      
      // Update daily engagement (decrement like for today)
      try {
        const updatedPost = await Blog.findById(postId);
        if (updatedPost && updatedPost.decrementDailyEngagement) {
          await updatedPost.decrementDailyEngagement('like');
        }
      } catch (engagementError) {
        // Daily engagement update failed (non-critical)
      }
      
      return NextResponse.json({
        success: true,
        liked: false,
        likes: post.likes - 1,
        message: 'Post unliked'
      });
    } else {
      // Like the post with timestamp
      const likeData = {
        userId: userId,
        likedAt: new Date()
      };
      
      await Blog.findByIdAndUpdate(postId, {
        $addToSet: { likedBy: likeData },
        $inc: { likes: 1 }
      });
      
      // Update daily engagement (increment like for today)
      try {
        const updatedPost = await Blog.findById(postId);
        if (updatedPost && updatedPost.updateDailyEngagement) {
          await updatedPost.updateDailyEngagement('like');
        }
      } catch (engagementError) {
        // Daily engagement update failed (non-critical)
      }
      
      return NextResponse.json({
        success: true,
        liked: true,
        likes: post.likes + 1,
        message: 'Post liked'
      });
    }
    
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like', details: error.message },
      { status: 500 }
    );
  }
}

// GET /api/blog/posts/[postId]/like - Check if user has liked the post
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ liked: false, likes: 0 });
    }
    
    await connectDB();
    
    const { postId } = params;
    const userId = session.user.id;
    
    const post = await Blog.findById(postId).select('likes likedBy');
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }
    
    const liked = post.likedBy.some(like => 
      like.userId ? like.userId.toString() === userId : like.toString() === userId
    );
    
    return NextResponse.json({
      liked,
      likes: post.likes || 0
    });
    
  } catch (error) {
    console.error('Error checking like status:', error);
    return NextResponse.json(
      { error: 'Failed to check like status' },
      { status: 500 }
    );
  }
} 