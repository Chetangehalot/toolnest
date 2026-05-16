import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { logRoleChange, getRequestMetadata } from '@/lib/auditLogger';
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

    const { role, reason } = await request.json();

    const validRoles = ['user', 'writer', 'manager', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (session.user.role === 'manager' && !['user', 'writer'].includes(role)) {
      return NextResponse.json({
        error: 'Managers can only assign user or writer roles',
      }, { status: 403 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!canManagerModifyTarget(session, user)) {
      return NextResponse.json({
        error: 'Managers cannot modify admins or other managers',
      }, { status: 403 });
    }

    const oldRole = user.role;

    if (user._id.toString() === actorId) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    if (oldRole === role) {
      return NextResponse.json({
        error: `User already has the role: ${role}`,
      }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role, updatedAt: new Date() },
      { new: true, runValidators: true, validateModifiedOnly: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    try {
      const metadata = getRequestMetadata(request);
      await logRoleChange({
        targetUserId: userId,
        performedBy: {
          _id: actorId,
          name: session.user.name,
          role: session.user.role,
        },
        fromRole: oldRole,
        toRole: role,
        reason: reason || `Role changed from ${oldRole} to ${role} by ${session.user.name}`,
        metadata,
      });
    } catch (auditError) {
      console.error('Failed to log role change audit:', auditError);
    }

    return NextResponse.json({
      success: true,
      user: { ...updatedUser.toObject(), _id: updatedUser._id.toString() },
      message: `User role changed from ${oldRole} to ${role}`,
    });
  } catch (error) {
    console.error('Error changing user role:', error);
    return NextResponse.json(
      { error: 'Failed to change user role', details: error.message },
      { status: 500 }
    );
  }
}
