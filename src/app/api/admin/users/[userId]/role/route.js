import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import { logRoleChange, getRequestMetadata } from '@/lib/auditLogger';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const { userId } = params;
    const { role, reason } = await request.json();

    // Validate role
    const validRoles = ['user', 'writer', 'manager', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Managers can only assign user/writer roles
    if (session.user.role === 'manager' && !['user', 'writer'].includes(role)) {
      return NextResponse.json({ 
        error: 'Managers can only assign user or writer roles' 
      }, { status: 403 });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const oldRole = user.role;

    // Can't change own role
    if (user._id.toString() === session.user.id) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    // Prevent changing role if no change
    if (oldRole === role) {
      return NextResponse.json({ 
        error: `User already has the role: ${role}` 
      }, { status: 400 });
    }

    // Update user role
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');

    // Log role change action
    try {
      const metadata = getRequestMetadata(request);
      await logRoleChange({
        targetUserId: userId,
        performedBy: {
          _id: session.user.id,
          name: session.user.name,
          role: session.user.role
        },
        fromRole: oldRole,
        toRole: role,
        reason: reason || `Role changed from ${oldRole} to ${role} by ${session.user.name}`,
        metadata
      });
    } catch (auditError) {
      console.error('Failed to log role change audit:', auditError);
      // Don't fail the role change if audit logging fails
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `User role changed from ${oldRole} to ${role}`,
      changes: {
        field: 'role',
        oldValue: oldRole,
        newValue: role,
        reason: reason || `Role changed by ${session.user.name}`
      }
    });

  } catch (error) {
    console.error('Error changing user role:', error);
    return NextResponse.json(
      { error: 'Failed to change user role', details: error.message },
      { status: 500 }
    );
  }
} 