import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;
    
    const search = searchParams.get('search') || '';
    const roleParam = searchParams.get('role') || 'all';
    const status = searchParams.get('status') || 'all';

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Handle multiple roles (e.g., "writer,manager,admin")
    if (roleParam !== 'all') {
      const roles = roleParam.split(',').map(r => r.trim());
      if (roles.length === 1) {
        query.role = roles[0];
      } else {
        query.role = { $in: roles };
      }
    }
    
    if (status === 'blocked') {
      query.isBlocked = true;
    } else if (status === 'active') {
      query.isBlocked = { $ne: true };
    }

    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    // Get users with pagination and populate lastLogin from sessions if available
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      users: users.map(user => ({
        ...user,
        _id: user._id.toString(),
        lastLogin: user.lastLogin || null
      })),
      totalUsers,
      totalPages,
      currentPage: page,
      hasNext: page < totalPages,
      hasPrev: page > 1
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, action, role } = await request.json();

    if (!userId || !action) {
      return NextResponse.json({ error: 'User ID and action are required' }, { status: 400 });
    }

    await connectDB();

    let updateData = {};

    switch (action) {
      case 'updateRole':
        if (!role || !['user', 'writer', 'manager', 'admin'].includes(role)) {
          return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 });
        }
        updateData.role = role;
        break;
      
      case 'block':
        updateData.isBlocked = true;
        break;
      
      case 'unblock':
        updateData.isBlocked = false;
        break;
      
      default:
        return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser,
    });

  } catch (error) {
    console.error('Admin user update error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
} 
