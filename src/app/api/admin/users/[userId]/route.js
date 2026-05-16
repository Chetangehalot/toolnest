import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import {
  logAccountDeletion,
  logDataModification,
  getRequestMetadata,
} from '@/lib/auditLogger';
import {
  getSessionUserId,
  isValidObjectId,
  canManagerModifyTarget,
} from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const actorId = getSessionUserId(session);
    if (!actorId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { userId } = params;
    if (!isValidObjectId(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const { reason } = await request.json().catch(() => ({}));

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const deletedUserInfo = {
      name: user.name,
      email: user.email,
      role: user.role,
    };

    if (userId === actorId) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    if (user.role === 'admin' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete other admins' }, { status: 403 });
    }

    if (user.role === 'manager' && session.user.role === 'manager') {
      return NextResponse.json({ error: 'Managers cannot delete other managers' }, { status: 403 });
    }

    if (!canManagerModifyTarget(session, user)) {
      return NextResponse.json({
        error: 'Managers cannot delete admins or other managers',
      }, { status: 403 });
    }

    try {
      const metadata = getRequestMetadata(request);
      await logAccountDeletion({
        targetUserId: userId,
        performedBy: {
          _id: actorId,
          name: session.user.name,
          role: session.user.role,
        },
        reason: reason || `User account deleted by ${session.user.name}`,
        metadata,
      });
    } catch (auditError) {
      console.error('Failed to log account deletion audit:', auditError);
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
      message: `User ${deletedUserInfo.name} (${deletedUserInfo.email}) deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (!['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const actorId = getSessionUserId(session);
    if (!actorId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const { userId } = params;
    if (!isValidObjectId(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const { updates, reason } = await request.json();

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Updates object is required' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!canManagerModifyTarget(session, user)) {
      return NextResponse.json({
        error: 'Managers cannot modify admins or other managers',
      }, { status: 403 });
    }

    const changes = [];
    const allowedFields = ['name', 'email', 'bio', 'profession', 'socialLinks', 'image'];

    for (const [field, newValue] of Object.entries(updates)) {
      if (!allowedFields.includes(field)) continue;
      const oldValue = user[field];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({ field, oldValue, newValue });
      }
    }

    if (changes.length === 0) {
      return NextResponse.json({ error: 'No changes detected' }, { status: 400 });
    }

    const filteredUpdates = {};
    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });
    filteredUpdates.updatedAt = new Date();

    const updatedUser = await User.findByIdAndUpdate(userId, filteredUpdates, {
      new: true,
      runValidators: true,
      validateModifiedOnly: true,
    }).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    try {
      const metadata = getRequestMetadata(request);
      await logDataModification({
        targetUserId: userId,
        performedBy: {
          _id: actorId,
          name: session.user.name,
          role: session.user.role,
        },
        changes,
        reason: reason || `User data modified by ${session.user.name}`,
        metadata,
      });
    } catch (auditError) {
      console.error('Failed to log data modification audit:', auditError);
    }

    return NextResponse.json({
      success: true,
      message: 'User data updated successfully',
      user: { ...updatedUser.toObject(), _id: updatedUser._id.toString() },
    });
  } catch (error) {
    console.error('Error updating user data:', error);
    return NextResponse.json(
      { error: 'Failed to update user', details: error.message },
      { status: 500 }
    );
  }
}
