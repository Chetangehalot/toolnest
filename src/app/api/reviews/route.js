import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import dbConnect from '@/lib/dbConnect';
import Review from '@/models/Review';
import Tool from '@/models/Tool';
import User from '@/models/User';
import { logReviewAction, getRequestMetadata } from '@/lib/auditLogger';

// POST /api/reviews - Create or update a review
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await dbConnect();
    const { toolId, rating, comment, pros, cons } = await request.json();

    // Validate required fields
    if (!toolId || !rating || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate rating
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Check if tool exists
    const tool = await Tool.findById(toolId);
    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // If the user has provided a rating, deactivate all their previous ratings for this tool
    if (rating) {
      await Review.updateMany(
        { 
          userId: session.user.id, 
          toolId: toolId,
          isRatingActive: true
        },
        { isRatingActive: false }
      );
    }

    // Always create a new review (users can have multiple reviews)
    const review = await Review.create({
      userId: session.user.id,
      toolId,
      rating,
      comment,
      pros: pros || [],
      cons: cons || [],
      isRatingActive: !!rating // Only mark as active if a rating is provided
    });

    // Log review creation action
    try {
      const metadata = getRequestMetadata(request);
      await logReviewAction({
        reviewId: review._id,
        action: 'created',
        performedBy: {
          _id: session.user.id,
          name: session.user.name,
          role: session.user.role
        },
        reason: `New review posted for tool: ${tool.name}`,
        changes: [{
          field: 'rating',
          oldValue: null,
          newValue: rating
        }],
        metadata
      });
    } catch (auditError) {
      console.error('Failed to log review creation audit:', auditError);
    }

    // Update tool's average rating and review count
    const allReviews = await Review.find({ toolId, status: 'visible' });
    // Only use active ratings for average calculation
    const activeRatings = await Review.find({ 
      toolId, 
      status: 'visible', 
      isRatingActive: true,
      rating: { $exists: true, $ne: null }
    });
    
    const avgRating = activeRatings.length > 0 
      ? activeRatings.reduce((sum, r) => sum + Number(r.rating), 0) / activeRatings.length 
      : 0;
    
    await Tool.findByIdAndUpdate(toolId, {
      rating: Math.round(avgRating * 10) / 10,
      reviewCount: allReviews.length // Total review count (including all reviews)
    });

    await review.populate('userId', 'name image');
    await review.populate('toolId', 'name');

    return NextResponse.json({
      success: true,
      review,
      message: 'Review created successfully'
    });

  } catch (error) {
    console.error('Review operation error:', error);
    return NextResponse.json(
      { error: 'Failed to save review' },
      { status: 500 }
    );
  }
}

// GET /api/reviews?toolId=xxx - Get reviews for a tool
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get('toolId');
    const session = await getServerSession(authOptions);

    if (!toolId) {
      return NextResponse.json({ error: 'Tool ID is required' }, { status: 400 });
    }

    await dbConnect();

    // Build query based on user role
    let query = { toolId };
    
    // If not admin, only show visible reviews
    if (!session || session.user.role !== 'admin') {
      query.status = 'visible';
    }

    const reviews = await Review.find(query)
      .populate('userId', 'name image')
      .sort({ createdAt: -1 });

    return NextResponse.json({ reviews });

  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
