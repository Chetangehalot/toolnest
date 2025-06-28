import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Tool from '@/models/Tool';

// POST /api/bookmarks - Add tool to bookmarks
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await dbConnect();
    const { toolId } = await request.json();

    if (!toolId) {
      return NextResponse.json({ error: 'Tool ID is required' }, { status: 400 });
    }

    // Check if tool exists
    const tool = await Tool.findById(toolId);
    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // Add to bookmarks if not already bookmarked
    const user = await User.findById(session.user.id);
    if (!user.bookmarks.includes(toolId)) {
      user.bookmarks.push(toolId);
      await user.save();
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Tool added to bookmarks' 
    });

  } catch (error) {
    console.error('Add bookmark error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/bookmarks - Remove tool from bookmarks
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const toolId = searchParams.get('toolId');

    if (!toolId) {
      return NextResponse.json({ error: 'Tool ID is required' }, { status: 400 });
    }

    // Remove from bookmarks
    const user = await User.findById(session.user.id);
    user.bookmarks = user.bookmarks.filter(id => id.toString() !== toolId);
    await user.save();

    return NextResponse.json({ 
      success: true, 
      message: 'Tool removed from bookmarks' 
    });

  } catch (error) {
    console.error('Remove bookmark error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/bookmarks - Get user's bookmarked tools
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findById(session.user.id).populate('bookmarks');
    const bookmarkedTools = user.bookmarks || [];

    return NextResponse.json({ bookmarks: bookmarkedTools });

  } catch (error) {
    console.error('Get bookmarks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
