import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Tool from '@/models/Tool';
import Blog from '@/models/Blog';

export async function GET(request) {
  try {
    await connectDB();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // 'tools', 'blogs', 'all'
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const sort = searchParams.get('sort') || 'relevance';

    if (!query.trim()) {
      return NextResponse.json({
        tools: [],
        blogs: [],
        total: 0,
        pagination: {
          total: 0,
          totalPages: 0,
          currentPage: page,
          limit
        }
      });
    }

    const searchRegex = { $regex: query.trim(), $options: 'i' };
    let toolsResults = [];
    let blogsResults = [];

    // Search Tools
    if (type === 'all' || type === 'tools') {
      const toolQuery = {
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { category: searchRegex },
          { tags: searchRegex },
          { slug: searchRegex }
        ]
      };

      let toolsSortOptions = {};
      switch (sort) {
        case 'rating':
          toolsSortOptions = { rating: -1, reviewCount: -1 };
          break;
        case 'newest':
          toolsSortOptions = { createdAt: -1 };
          break;
        case 'popular':
          toolsSortOptions = { reviewCount: -1, rating: -1 };
          break;
        case 'relevance':
        default:
          // For relevance, we'll sort by name match first, then rating
          toolsSortOptions = { rating: -1, reviewCount: -1 };
          break;
      }

      toolsResults = await Tool.find(toolQuery)
        .sort(toolsSortOptions)
        .limit(type === 'tools' ? limit : Math.ceil(limit / 2))
        .lean();

      // Add search relevance score
      toolsResults = toolsResults.map(tool => ({
        ...tool,
        _id: tool._id.toString(),
        type: 'tool',
        relevanceScore: calculateToolRelevance(tool, query),
        website: tool.website || tool.url || '',
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
        slug: tool.slug || tool.name?.toLowerCase().replace(/\s+/g, '-') || '',
        highlightedText: highlightSearchTerm(tool.name + ' ' + tool.description, query)
      }));
    }

    // Search Blog Posts
    if (type === 'all' || type === 'blogs') {
      const blogQuery = {
        status: 'published', // Only search published blogs
        $or: [
          { title: searchRegex },
          { content: searchRegex },
          { tags: searchRegex },
          { slug: searchRegex }
        ]
      };

      let blogsSortOptions = {};
      switch (sort) {
        case 'newest':
          blogsSortOptions = { publishedAt: -1, createdAt: -1 };
          break;
        case 'popular':
          blogsSortOptions = { views: -1, likes: -1 };
          break;
        case 'relevance':
        default:
          blogsSortOptions = { publishedAt: -1, createdAt: -1 };
          break;
      }

      blogsResults = await Blog.find(blogQuery)
        .populate('authorId', 'name email image')
        .populate('categories', 'name slug color')
        .sort(blogsSortOptions)
        .limit(type === 'blogs' ? limit : Math.ceil(limit / 2))
        .lean();

      // Add search relevance score
      blogsResults = blogsResults.map(blog => ({
        ...blog,
        _id: blog._id.toString(),
        type: 'blog',
        relevanceScore: calculateBlogRelevance(blog, query),
        highlightedText: highlightSearchTerm(blog.title + ' ' + (blog.content || '').substring(0, 200), query),
        excerpt: blog.excerpt || extractExcerpt(blog.content, query),
        readTime: blog.readTime || Math.ceil((blog.content || '').split(' ').length / 200)
      }));
    }

    // Combine and sort results by relevance if needed
    let allResults = [];
    if (type === 'all') {
      allResults = [...toolsResults, ...blogsResults];
      if (sort === 'relevance') {
        allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
      }
    } else if (type === 'tools') {
      allResults = toolsResults;
    } else if (type === 'blogs') {
      allResults = blogsResults;
    }

    // Apply pagination to combined results
    const skip = (page - 1) * limit;
    const paginatedResults = allResults.slice(skip, skip + limit);

    // Separate results by type for response
    const finalTools = type === 'blogs' ? [] : paginatedResults.filter(item => item.type === 'tool');
    const finalBlogs = type === 'tools' ? [] : paginatedResults.filter(item => item.type === 'blog');

    return NextResponse.json({
      tools: finalTools,
      blogs: finalBlogs,
      total: allResults.length,
      query: query.trim(),
      type,
      pagination: {
        total: allResults.length,
        totalPages: Math.ceil(allResults.length / limit),
        currentPage: page,
        limit,
        hasNext: skip + limit < allResults.length,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error in unified search:', error);
    return NextResponse.json(
      { error: 'Failed to perform search', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to calculate tool relevance score
function calculateToolRelevance(tool, query) {
  const queryLower = query.toLowerCase();
  let score = 0;

  // Exact name match gets highest score
  if (tool.name.toLowerCase() === queryLower) score += 100;
  else if (tool.name.toLowerCase().includes(queryLower)) score += 50;

  // Category match
  if (tool.category && tool.category.toLowerCase().includes(queryLower)) score += 30;

  // Description match
  if (tool.description && tool.description.toLowerCase().includes(queryLower)) score += 20;

  // Tags match
  if (tool.tags && tool.tags.some(tag => tag.toLowerCase().includes(queryLower))) score += 15;

  // Boost for higher rated tools
  score += (tool.rating || 0) * 2;

  // Boost for trending tools
  if (tool.trending) score += 10;

  return score;
}

// Helper function to calculate blog relevance score
function calculateBlogRelevance(blog, query) {
  const queryLower = query.toLowerCase();
  let score = 0;

  // Exact title match gets highest score
  if (blog.title.toLowerCase() === queryLower) score += 100;
  else if (blog.title.toLowerCase().includes(queryLower)) score += 50;

  // Content match (first 500 chars for performance)
  const contentPreview = (blog.content || '').substring(0, 500).toLowerCase();
  const queryMatches = (contentPreview.match(new RegExp(queryLower, 'gi')) || []).length;
  score += queryMatches * 10;

  // Tags match
  if (blog.tags && blog.tags.some(tag => tag.toLowerCase().includes(queryLower))) score += 15;

  // Boost for popular blogs
  score += (blog.views || 0) * 0.1;
  score += (blog.likes || 0) * 2;

  // Boost for recent blogs
  const daysSincePublished = (Date.now() - new Date(blog.publishedAt || blog.createdAt)) / (1000 * 60 * 60 * 24);
  if (daysSincePublished < 30) score += 5;

  return score;
}

// Helper function to highlight search terms
function highlightSearchTerm(text, query) {
  if (!text || !query) return text;
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

// Helper function to extract excerpt with search context
function extractExcerpt(content, query, maxLength = 200) {
  if (!content) return '';
  
  const queryLower = query.toLowerCase();
  const contentLower = content.toLowerCase();
  const queryIndex = contentLower.indexOf(queryLower);
  
  if (queryIndex === -1) {
    return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
  }
  
  // Extract text around the query match
  const start = Math.max(0, queryIndex - 50);
  const end = Math.min(content.length, queryIndex + query.length + 150);
  
  let excerpt = content.substring(start, end);
  if (start > 0) excerpt = '...' + excerpt;
  if (end < content.length) excerpt = excerpt + '...';
  
  return excerpt;
} 
