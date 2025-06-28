import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import Tool from '@/models/Tool';
import RecentView from '@/models/RecentView';

export async function POST(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    await connectDB();

    // Find the tool by slug
    const tool = await Tool.findOne({ slug: params.slug });
    if (!tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }

    // Create or update recent view
    await RecentView.findOneAndUpdate(
      { userId: session.user.id, toolId: tool._id },
      { viewedAt: new Date() },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error tracking tool view:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 