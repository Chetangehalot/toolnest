import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/dbConnect';
import User from '@/models/User';
import { logAccountDeletion, logDataModification, getRequestMetadata } from '@/lib/auditLogger';

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { userId } = params;
    const { reason } = await request.json().catch(() => ({}));

    await connectDB();

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Store user info for audit logging before deletion
    const deletedUserInfo = {
      name: user.name,
      email: user.email,
      role: user.role
    };

    // Prevent deleting self
    if (userId === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    // Check permissions for deleting admins and managers
    if (user.role === 'admin' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can delete other admins' }, { status: 403 });
    }
    
    if (user.role === 'manager' && session.user.role === 'manager') {
      return NextResponse.json({ error: 'Managers cannot delete other managers' }, { status: 403 });
    }

    // Log the audit trail before deletion
    const metadata = getRequestMetadata(request);
    await logAccountDeletion({
      targetUserId: userId,
      performedBy: {
        _id: session.user.id,
        name: session.user.name,
        role: session.user.role
      },
      reason: reason || `User account deleted by ${session.user.name}`,
      metadata
    });

    // Delete user
    await User.findByIdAndDelete(userId);

    return NextResponse.json({
      success: true,
      message: `User ${deletedUserInfo.name} (${deletedUserInfo.email}) deleted successfully`,
      auditLogged: true
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'manager') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { userId } = params;
    const { updates, reason } = await request.json();

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json({ error: 'Updates object is required' }, { status: 400 });
    }

    await connectDB();

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Track changes for audit logging
    const changes = [];
    const allowedFields = ['name', 'email', 'bio', 'profession', 'socialLinks', 'image'];

    // Compare old vs new values
    for (const [field, newValue] of Object.entries(updates)) {
      if (!allowedFields.includes(field)) {
        continue; // Skip non-allowed fields
      }

      const oldValue = user[field];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field,
          oldValue,
          newValue
        });
      }
    }

    if (changes.length === 0) {
      return NextResponse.json({ error: 'No changes detected' }, { status: 400 });
    }

    // Role-based permission checks
    if (session.user.role === 'manager') {
      // Managers cannot modify admins or other managers
      if (user.role === 'admin' || user.role === 'manager') {
        return NextResponse.json({ error: 'Managers cannot modify admins or other managers' }, { status: 403 });
      }
    }

    // Filter updates to only allowed fields
    const filteredUpdates = {};
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      filteredUpdates,
      { new: true, runValidators: true }
    ).select('-password');

    // Log the audit trail
    const metadata = getRequestMetadata(request);
    await logDataModification({
      targetUserId: userId,
      performedBy: {
        _id: session.user.id,
        name: session.user.name,
        role: session.user.role
      },
      changes,
      reason: reason || `User data modified by ${session.user.name}`,
      metadata
    });

    return NextResponse.json({
      success: true,
      message: `User data updated successfully`,
      user: {
        ...updatedUser.toObject(),
        _id: updatedUser._id.toString()
      },
      changes: changes.map(c => `${c.field}: "${c.oldValue}" → "${c.newValue}"`),
      auditLogged: true
    });

  } catch (error) {
    console.error('Error updating user data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 