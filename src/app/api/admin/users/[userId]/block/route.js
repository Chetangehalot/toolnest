import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/dbConnect';
import User from '@/models/User';
import { logAccountBlocking, getRequestMetadata } from '@/lib/auditLogger';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { userId } = params;
    const { isBlocked, reason } = await request.json();

    if (typeof isBlocked !== 'boolean') {
      return NextResponse.json({ error: 'isBlocked must be a boolean' }, { status: 400 });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Can't block/unblock yourself
    if (user._id.toString() === session.user.id) {
      return NextResponse.json({ error: 'Cannot block/unblock yourself' }, { status: 400 });
    }

    const wasBlocked = user.isBlocked;

    // Check if status is actually changing
    if (wasBlocked === isBlocked) {
      return NextResponse.json({
        error: `User is already ${isBlocked ? 'blocked' : 'unblocked'}`
      }, { status: 400 });
    }

    // Managers can't block/unblock admins or other managers
    if (session.user.role === 'manager' && ['admin', 'manager'].includes(user.role)) {
      return NextResponse.json({ 
        error: 'Managers cannot block/unblock admins or other managers' 
      }, { status: 403 });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        isBlocked,
        blockedAt: isBlocked ? new Date() : undefined,
        blockedBy: isBlocked ? session.user.id : undefined,
        unblockedAt: !isBlocked ? new Date() : undefined,
        unblockedBy: !isBlocked ? session.user.id : undefined,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');

    // Log block/unblock action
    try {
      const metadata = getRequestMetadata(request);
      await logAccountBlocking({
        targetUserId: userId,
        action: isBlocked ? 'blocked' : 'unblocked',
        performedBy: {
          _id: session.user.id,
          name: session.user.name,
          role: session.user.role
        },
        reason: reason || `User account ${isBlocked ? 'blocked' : 'unblocked'} by ${session.user.name}`,
        metadata
      });
    } catch (auditError) {
      console.error('Failed to log block/unblock audit:', auditError);
      // Don't fail the operation if audit logging fails
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
      changes: {
        field: 'isBlocked',
        oldValue: wasBlocked,
        newValue: isBlocked,
        reason: reason || `${isBlocked ? 'Blocked' : 'Unblocked'} by ${session.user.name}`
      }
    });

  } catch (error) {
    console.error('Error blocking/unblocking user:', error);
    return NextResponse.json(
      { error: 'Failed to update user status', details: error.message },
      { status: 500 }
    );
  }
} 