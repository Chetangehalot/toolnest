import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/db';
import BlogCategory from '@/models/BlogCategory';

// GET /api/blog/categories - Get all categories
export async function GET(request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    
    let query = {};
    if (activeOnly) {
      query.isActive = true;
    }
    
    const categories = await BlogCategory.find(query)
      .sort({ sortOrder: 1, name: 1 })
      .lean();
    
    return NextResponse.json({ categories });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch categories', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/blog/categories - Create new category
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Only managers and admins can create categories
    if (!['manager', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    await connectDB();
    const body = await request.json();
    const { name, description, color, icon, sortOrder } = body;
    
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }
    
    const category = new BlogCategory({
      name: name.trim(),
      description: description?.trim() || '',
      color: color || '#00FFE0',
      icon: icon || 'FolderIcon',
      sortOrder: sortOrder || 0
    });
    
    await category.save();
    return NextResponse.json({
      success: true,
      category
    }, { status: 201 });
    
  } catch (error) {
    console.error('💥 Category creation failed:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0] || 'field';
      return NextResponse.json(
        { error: `A category with this ${duplicateField} already exists` },
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
        error: 'Failed to create category', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 

