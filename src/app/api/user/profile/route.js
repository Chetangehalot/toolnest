import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { logProfileUpdate, getRequestMetadata } from '@/lib/auditLogger';
import { logAuditTrail } from '@/lib/auditLogger';

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { name, image, profession, bio, currentPassword, newPassword } = body;

    await connectDB();

    // Get current user
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prepare update data - only include fields that are provided
    const updateData = {};
    const changes = [];
    
    if (name !== undefined && name !== currentUser.name) {
      updateData.name = name?.trim() || '';
      changes.push({
        field: 'name',
        oldValue: currentUser.name,
        newValue: updateData.name
      });
    }
    
    if (image !== undefined && image !== currentUser.image) {
      updateData.image = image?.trim() || '';
      changes.push({
        field: 'image',
        oldValue: currentUser.image || '',
        newValue: updateData.image
      });
    }
    
    if (profession !== undefined && profession !== currentUser.profession) {
      updateData.profession = profession?.trim() || '';
      changes.push({
        field: 'profession',
        oldValue: currentUser.profession || '',
        newValue: updateData.profession
      });
    }
    
    if (bio !== undefined && bio !== currentUser.bio) {
      updateData.bio = bio?.trim() || '';
      changes.push({
        field: 'bio',
        oldValue: currentUser.bio || '',
        newValue: updateData.bio
      });
    }

    // Handle password update if provided
    if (newPassword && currentPassword) {
      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }

      // Validate new password
      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
      }

      // Hash new password
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(newPassword, saltRounds);
      changes.push({
        field: 'password',
        oldValue: '[HIDDEN]',
        newValue: '[UPDATED]'
      });
    }

    // Only proceed with update and logging if there are changes
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No changes detected',
        user: {
          id: currentUser._id.toString(),
          name: currentUser.name,
          email: currentUser.email,
          image: currentUser.image,
          profession: currentUser.profession,
          bio: currentUser.bio,
          role: currentUser.role
        }
      });
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    // Log the profile update with detailed changes
    if (changes.length > 0) {
      await logProfileUpdate({
        targetUserId: session.user.id,
        performedBy: {
          _id: session.user.id,
          name: session.user.name,
          role: session.user.role
        },
        changes,
        reason: `Profile updated: ${changes.map(c => c.field).join(', ')}`,
        metadata: getRequestMetadata(request)
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
        profession: updatedUser.profession,
        bio: updatedUser.bio,
        role: updatedUser.role
      }
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ 
      error: 'An error occurred while updating profile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Also support PATCH for backward compatibility
export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const body = await request.json();
    const { name, email, image, bio, profession, socialLinks } = body;

    // Find current user to track changes
    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate email format if provided
    if (email && email !== currentUser.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }

      // Check if email is already taken
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: session.user.id }
      });
      
      if (existingUser) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
    }

    // Track changes for audit logging
    const changes = [];
    
    if (name && name !== currentUser.name) {
      changes.push({
        field: 'name',
        oldValue: currentUser.name,
        newValue: name
      });
    }
    
    if (email && email !== currentUser.email) {
      changes.push({
        field: 'email',
        oldValue: currentUser.email,
        newValue: email
      });
    }
    
    if (profession && profession !== currentUser.profession) {
      changes.push({
        field: 'profession',
        oldValue: currentUser.profession || '',
        newValue: profession
      });
    }
    
    if (image && image !== currentUser.image) {
      changes.push({
        field: 'image',
        oldValue: currentUser.image ? 'Updated' : 'None',
        newValue: 'Updated'
      });
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (image !== undefined) updateData.image = image;
    if (bio !== undefined) updateData.bio = bio;
    if (profession !== undefined) updateData.profession = profession;
    if (socialLinks !== undefined) updateData.socialLinks = socialLinks;
    
    updateData.updatedAt = new Date();

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    // Log profile update action if there were changes
    if (changes.length > 0) {
      try {
        const metadata = getRequestMetadata(request);
        await logAuditTrail({
          targetUserId: session.user.id,
          action: 'profile_updated',
          performedBy: {
            _id: session.user.id,
            name: session.user.name,
            role: session.user.role
          },
          reason: 'User updated their own profile',
          changes,
          metadata
        });
      } catch (auditError) {
        console.error('Failed to log profile update audit:', auditError);
        // Don't fail the update if audit logging fails
      }
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating user profile:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to update profile', details: error.message },
      { status: 500 }
    );
  }
} 
