import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Review from '@/models/Review';
import Tool from '@/models/Tool';

// GET /api/tools/[slug]/reviews - Get reviews for a tool
export async function GET(request, { params }) {
  try {
    const { slug } = params;
    
    await dbConnect();
    
    // Get the tool first to verify it exists
    const tool = await Tool.findOne({ slug });
    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    // Get all reviews for the tool
    const reviews = await Review.find({ toolId: tool._id, status: 'visible' })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate average rating using only active ratings
    const activeRatings = reviews.filter(review => 
      review.isRatingActive && 
      review.rating != null && 
      review.rating !== undefined
    );
    const totalRating = activeRatings.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = activeRatings.length > 0 ? totalRating / activeRatings.length : 0;

    return NextResponse.json({
      reviews,
      averageRating,
      totalReviews: reviews.length
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/tools/[slug]/reviews - Add a review
export async function POST(request, { params }) {
  try {
    const { slug } = params;
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Verify the token
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    await dbConnect();

    // Get the tool first to verify it exists
    const tool = await Tool.findOne({ slug });
    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    const reviewData = await request.json();
    
    // Validate review data
    if (!reviewData.rating || !reviewData.comment) {
      return NextResponse.json(
        { error: 'Rating and comment are required' },
        { status: 400 }
      );
    }

    // Check if user has already reviewed this tool
    const existingReview = await Review.findOne({
      userId,
      toolId: tool._id
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this tool' },
        { status: 400 }
      );
    }

    // Create new review
    const review = await Review.create({
      userId,
      toolId: tool._id,
      rating: reviewData.rating,
      comment: reviewData.comment,
      pros: reviewData.pros || [],
      cons: reviewData.cons || []
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error adding review:', error);
    return NextResponse.json(
      { error: 'Failed to add review' },
      { status: 500 }
    );
  }
}

// DELETE /api/tools/[slug]/reviews - Delete a review
export async function DELETE(request, { params }) {
  try {
    const { slug } = params;
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Verify the token
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    await dbConnect();

    // Get the tool first to verify it exists
    const tool = await Tool.findOne({ slug });
    if (!tool) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    // Delete the review
    const result = await Review.deleteOne({
      userId,
      toolId: tool._id
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
} 