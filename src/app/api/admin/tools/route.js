import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/db';
import Tool from '@/models/Tool';
import { logToolAction, getRequestMetadata } from '@/lib/auditLogger';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const tools = await Tool.find({})
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ tools });
  } catch (error) {
    console.error('Error fetching tools:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const body = await request.json();
    const {
      name,
      slug,
      description,
      category,
      subcategory,
      url,
      website,
      image,
      logo,
      price,
      tags,
      pros,
      cons,
      specifications,
      featured,
      trending,
      rating
    } = body;

    // Validate required fields
    if (!name || !description || !category || !url) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, category, url' },
        { status: 400 }
      );
    }

    // Create slug if not provided
    const toolSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existingTool = await Tool.findOne({ slug: toolSlug });
    if (existingTool) {
      return NextResponse.json(
        { error: 'A tool with this slug already exists' },
        { status: 400 }
      );
    }
    
    const tool = new Tool({
      name: name.trim(),
      slug: toolSlug,
      description: description.trim(),
      category,
      subcategory,
      url: url.trim(),
      website: website?.trim(),
      image: image?.trim(),
      logo: logo?.trim(),
      price: price || 'Free',
      tags: tags || [],
      pros: pros || [],
      cons: cons || [],
      specifications: specifications || {
        difficulty: 'Beginner',
        features: [],
        integrations: [],
        API: false,
        languagesSupported: [],
        platform: [],
        pricing: {
          free: false,
          paid: false,
          freemium: false
        }
      },
      featured: featured || false,
      trending: trending || false,
      rating: rating || 0,
      createdBy: session.user.id,
      updatedBy: session.user.id
    });

    await tool.save();

    // Log tool creation action
    try {
      const metadata = getRequestMetadata(request);
      await logToolAction({
        toolId: tool._id,
        action: 'created',
        performedBy: {
          _id: session.user.id,
          name: session.user.name,
          role: session.user.role
        },
        reason: `New tool added: ${tool.name} in category ${tool.category}`,
        changes: [{
          field: 'name',
          oldValue: null,
          newValue: tool.name
        }, {
          field: 'category',
          oldValue: null,
          newValue: tool.category
        }],
        metadata
      });
    } catch (auditError) {
      console.error('Failed to log tool creation audit:', auditError);
      // Don't fail the creation if audit logging fails
    }

    await tool.populate('createdBy', 'name email');
    await tool.populate('updatedBy', 'name email');

    return NextResponse.json({
      success: true,
      tool,
      message: 'Tool created successfully'
    });

  } catch (error) {
    console.error('Error creating tool:', error);
    
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0] || 'field';
      return NextResponse.json(
        { error: `A tool with this ${duplicateField} already exists` },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create tool', details: error.message },
      { status: 500 }
    );
  }
} 
