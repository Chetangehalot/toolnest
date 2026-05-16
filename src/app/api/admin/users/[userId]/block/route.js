import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-simple';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { logAccountBlocking, getRequestMetadata } from '@/lib/auditLogger';
import {
  getSessionUserId,
  isValidObjectId,
  canManagerModifyTarget,
} from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const actorId = getSessionUserId(session);
    if (!actorId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { userId } = params;
    if (!isValidObjectId(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    await connectToDatabase();

    const { isBlocked, reason } = await request.json();

    if (typeof isBlocked !== 'boolean') {
      return NextResponse.json({ error: 'isBlocked must be a boolean' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user._id.toString() === actorId) {
      return NextResponse.json({ error: 'Cannot block/unblock yourself' }, { status: 400 });
    }

    if (!canManagerModifyTarget(session, user)) {
      return NextResponse.json({
        error: 'Managers cannot block/unblock admins or other managers',
      }, { status: 403 });
    }

    const wasBlocked = Boolean(user.isBlocked);

    if (wasBlocked === isBlocked) {
      return NextResponse.json({
        error: `User is already ${isBlocked ? 'blocked' : 'unblocked'}`,
      }, { status: 400 });
    }

    const update = {
      isBlocked,
      updatedAt: new Date(),
      ...(isBlocked
        ? {
            blockedAt: new Date(),
            blockedBy: actorId,
            unblockedAt: null,
            unblockedBy: null,
          }
        : {
            blockedAt: null,
            blockedBy: null,
            unblockedAt: new Date(),
            unblockedBy: actorId,
          }),
    };

    const updatedUser = await User.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
      validateModifiedOnly: true,
    }).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    try {
      const metadata = getRequestMetadata(request);
      await logAccountBlocking({
        targetUserId: userId,
        isBlocked,
        performedBy: {
          _id: actorId,
          name: session.user.name,
          role: session.user.role,
        },
        reason:
          reason ||
          `User account ${isBlocked ? 'blocked' : 'unblocked'} by ${session.user.name}`,
        metadata,
      });
    } catch (auditError) {
      console.error('Failed to log block/unblock audit:', auditError);
    }

    return NextResponse.json({
      success: true,
      user: { ...updatedUser.toObject(), _id: updatedUser._id.toString() },
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
    });
  } catch (error) {
    console.error('Error blocking/unblocking user:', error);
    return NextResponse.json(
      { error: 'Failed to update user status', details: error.message },
      { status: 500 }
    );
  }
}
