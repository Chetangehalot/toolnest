import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Tool from '@/models/Tool';

export async function GET(request) {
  try {
    await connectDB();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 15;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const minRating = parseFloat(searchParams.get('minRating')) || 0;
    const sort = searchParams.get('sort') || 'newest';

    // Build query
    const query = {};
    
    // Add search condition
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } },
      ];
    }

    // Add category filter
    if (category) {
      query.category = category;
    }

    // Add minimum rating filter
    if (minRating > 0) {
      query.rating = { $gte: minRating };
    }

    // Build sort options
    let sortOptions = {};
    switch (sort) {
      case 'rating':
        sortOptions = { rating: -1, reviewCount: -1 };
        break;
      case 'trending':
        sortOptions = { trending: -1, rating: -1, reviewCount: -1 };
        break;
      case 'popular':
        sortOptions = { reviewCount: -1, rating: -1 };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count for pagination
    const total = await Tool.countDocuments(query);
    
    // Get tools with pagination and sorting
    const tools = await Tool.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      tools: tools.map(tool => ({
        ...tool,
        _id: tool._id.toString(),
        // Map url to website for backward compatibility
        website: tool.website || tool.url || '',
        // Ensure all required fields have default values
        name: tool.name || '',
        description: tool.description || '',
        category: tool.category || '',
        rating: Number(tool.rating) || 0,
        reviewCount: Number(tool.reviewCount) || 0,
        trending: tool.trending || false,
        featured: tool.featured || false,
        image: tool.image || '/images/placeholder-image.jpeg',
        logo: tool.logo || '/images/placeholder-logo.jpeg',
        tags: tool.tags || [],
        price: tool.price || 'Free',
        specifications: tool.specifications || {},
        slug: tool.slug || tool.name?.toLowerCase().replace(/\s+/g, '-') || '',
        pros: tool.pros || [],
        cons: tool.cons || [],
        platform: tool.platform || []
      })),
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching tools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tools' },
      { status: 500 }
    );
  }
} 
