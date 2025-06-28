import User from '@/models/User';
import AuditLog from '@/models/AuditLog';
import connectDB from '@/lib/dbConnect';

/**
 * Extract request metadata for audit logging
 */
export function getRequestMetadata(request) {
  try {
    return {
      ipAddress: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 request.headers.get('remote-addr') || 
                 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      referer: request.headers.get('referer') || '',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.warn('Failed to extract request metadata:', error);
    return {
      ipAddress: 'unknown',
      userAgent: 'unknown',
      referer: '',
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Log an audit trail entry for user management actions
 * @param {Object} params - The audit parameters
 * @param {string} params.targetUserId - ID of the user being acted upon
 * @param {string} params.action - The action being performed
 * @param {Object} params.performedBy - User performing the action
 * @param {string} params.reason - Reason for the action
 * @param {Array} params.changes - Array of field changes
 * @param {Object} params.metadata - Additional metadata (IP, user agent, etc.)
 */
export async function logAuditTrail({
  targetUserId,
  action,
  performedBy,
  reason = '',
  changes = [],
  metadata = {}
}) {
  try {
    await connectDB();
    
    // Get target user info for the audit log
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      console.error(`Target user ${targetUserId} not found for audit logging`);
      return false;
    }
    
    // Create centralized audit log entry
    const auditEntry = new AuditLog({
      type: 'user_management',
      action,
      performedBy: {
        _id: performedBy._id || performedBy.id,
        name: performedBy.name,
        role: performedBy.role
      },
      targetId: targetUserId,
      targetType: 'User',
      targetName: targetUser.name,
      changes,
      reason,
      metadata
    });
    
    await auditEntry.save();
    
    // Also keep the legacy audit log in User model for backward compatibility
    try {
      const legacyAuditEntry = {
        action,
        performedBy: performedBy._id || performedBy.id,
        performedByName: performedBy.name,
        performedByRole: performedBy.role,
        timestamp: new Date(),
        reason,
        changes,
        metadata
      };

      await User.findByIdAndUpdate(
        targetUserId,
        {
          $push: {
            auditLog: legacyAuditEntry
          }
        },
        { new: true }
      );
    } catch (legacyError) {
      // Legacy audit log failed, but centralized log was saved successfully
    }

    return true;
  } catch (error) {
    console.error('Failed to log audit trail:', error);
    return false;
  }
}

/**
 * Log tool management action
 */
export async function logToolAction({
  toolId,
  action,
  performedBy,
  changes = [],
  reason = '',
  metadata = {}
}) {
  try {
    await connectDB();
    
    // Get tool info for the audit log
    const Tool = (await import('@/models/Tool')).default;
    const tool = await Tool.findById(toolId);
    
    if (!tool) {
      console.error(`Tool ${toolId} not found for audit logging`);
      return false;
    }
    
    // For deletions, store complete tool information
    let details = {};
    if (action === 'deleted') {
      details = {
        deletedToolInfo: {
          _id: tool._id,
          name: tool.name,
          slug: tool.slug,
          description: tool.description,
          category: tool.category,
          subcategory: tool.subcategory,
          url: tool.url,
          website: tool.website,
          logo: tool.logo,
          rating: tool.rating,
          reviewCount: tool.reviewCount,
          price: tool.price,
          createdBy: tool.createdBy,
          updatedBy: tool.updatedBy,
          createdAt: tool.createdAt,
          updatedAt: tool.updatedAt
        },
        deletionTime: new Date(),
        deletedBy: {
          _id: performedBy._id || performedBy.id,
          name: performedBy.name,
          role: performedBy.role
        }
      };
    }
    
    // Create centralized audit log entry
    const auditEntry = new AuditLog({
      type: 'tool_management',
      action,
      performedBy: {
        _id: performedBy._id || performedBy.id,
        name: performedBy.name,
        role: performedBy.role
      },
      targetId: toolId,
      targetType: 'Tool',
      targetName: tool.name,
      changes,
      reason,
      details,
      metadata
    });

    await auditEntry.save();
    
    return true;
  } catch (error) {
    console.error('Failed to log tool audit trail:', error);
    return false;
  }
}

/**
 * Log review management action
 */
export async function logReviewAction({
  reviewId,
  action,
  performedBy,
  changes = [],
  reason = '',
  metadata = {}
}) {
  try {
    await connectDB();
    
    // Get review info for the audit log
    const Review = (await import('@/models/Review')).default;
    const review = await Review.findById(reviewId).populate('toolId', 'name').populate('userId', 'name email');
    
    if (!review) {
      console.error(`Review ${reviewId} not found for audit logging`);
      return false;
    }
    
    // For deletions, store complete review information
    let details = {};
    if (action === 'deleted') {
      details = {
        deletedReviewInfo: {
          _id: review._id,
          userId: review.userId?._id,
          userName: review.userId?.name,
          userEmail: review.userId?.email,
          toolId: review.toolId?._id,
          toolName: review.toolId?.name,
          rating: review.rating,
          comment: review.comment,
          reply: review.reply,
          replyAuthor: review.replyAuthor,
          replyRole: review.replyRole,
          status: review.status,
          pros: review.pros,
          cons: review.cons,
          verified: review.verified,
          createdAt: review.createdAt,
          updatedAt: review.updatedAt
        },
        deletionTime: new Date(),
        deletedBy: {
          _id: performedBy._id || performedBy.id,
          name: performedBy.name,
          role: performedBy.role
        }
      };
    }
    
    // Create centralized audit log entry
    const auditEntry = new AuditLog({
      type: 'review_management',
      action,
      performedBy: {
        _id: performedBy._id || performedBy.id,
        name: performedBy.name,
        role: performedBy.role
      },
      targetId: reviewId,
      targetType: 'Review',
      targetName: `Review on ${review.toolId?.name || 'Unknown Tool'}`,
      changes,
      reason,
      details,
      metadata
    });

    await auditEntry.save();
    
    return true;
  } catch (error) {
    console.error('Failed to log review audit trail:', error);
    return false;
  }
}

/**
 * Log blog management action
 */
export async function logBlogAction({
  blogId,
  action,
  performedBy,
  changes = [],
  reason = '',
  metadata = {}
}) {
  try {
    await connectDB();
    
    // Get blog info for the audit log
    const Blog = (await import('@/models/Blog')).default;
    const blog = await Blog.findById(blogId).populate('authorId', 'name email');
    
    if (!blog) {
      console.error(`Blog ${blogId} not found for audit logging`);
      return false;
    }
    
    // For deletions, store complete blog information
    let details = {};
    if (action === 'deleted') {
      details = {
        deletedBlogInfo: {
          _id: blog._id,
          title: blog.title,
          slug: blog.slug,
          content: blog.content?.substring(0, 500) + '...', // Store first 500 chars
          excerpt: blog.excerpt,
          authorId: blog.authorId?._id,
          authorName: blog.authorId?.name,
          authorEmail: blog.authorId?.email,
          status: blog.status,
          categories: blog.categories,
          tags: blog.tags,
          featuredImage: blog.featuredImage,
          likes: blog.likes,
          views: blog.views,
          comments: blog.comments,
          publishedAt: blog.publishedAt,
          approvedBy: blog.approvedBy,
          approvedAt: blog.approvedAt,
          rejectionReason: blog.rejectionReason,
          rejectedBy: blog.rejectedBy,
          rejectedAt: blog.rejectedAt,
          createdAt: blog.createdAt,
          updatedAt: blog.updatedAt
        },
        deletionTime: new Date(),
        deletedBy: {
          _id: performedBy._id || performedBy.id,
          name: performedBy.name,
          role: performedBy.role
        }
      };
    }
    
    // Create centralized audit log entry
    const auditEntry = new AuditLog({
      type: 'blog_moderation',
      action,
      performedBy: {
        _id: performedBy._id || performedBy.id,
        name: performedBy.name,
        role: performedBy.role
      },
      targetId: blogId,
      targetType: 'Blog',
      targetName: blog.title,
      changes,
      reason,
      details,
      metadata
    });

    await auditEntry.save();
    
    return true;
  } catch (error) {
    console.error('Failed to log blog audit trail:', error);
    return false;
  }
}

/**
 * Log role change action
 */
export async function logRoleChange({
  targetUserId,
  performedBy,
  fromRole,
  toRole,
  reason,
  metadata = {}
}) {
  return await logAuditTrail({
    targetUserId,
    action: 'role_changed',
    performedBy,
    reason,
    changes: [{
      field: 'role',
      oldValue: fromRole,
      newValue: toRole
    }],
    metadata
  });
}

/**
 * Log user block action
 */
export async function logUserBlock({
  targetUserId,
  performedBy,
  reason,
  metadata = {}
}) {
  return await logAuditTrail({
    targetUserId,
    action: 'blocked',
    performedBy,
    reason,
    changes: [{
      field: 'isBlocked',
      oldValue: false,
      newValue: true
    }],
    metadata
  });
}

/**
 * Log user unblock action
 */
export async function logUserUnblock({
  targetUserId,
  performedBy,
  reason,
  metadata = {}
}) {
  return await logAuditTrail({
    targetUserId,
    action: 'unblocked',
    performedBy,
    reason,
    changes: [{
      field: 'isBlocked',
      oldValue: true,
      newValue: false
    }],
    metadata
  });
}

/**
 * Log data modification action
 */
export async function logDataModification({
  targetUserId,
  performedBy,
  changes,
  reason,
  metadata = {}
}) {
  return await logAuditTrail({
    targetUserId,
    action: 'data_modified',
    performedBy,
    reason,
    changes,
    metadata
  });
}

/**
 * Log account deletion action
 */
export async function logAccountDeletion({
  targetUserId,
  performedBy,
  reason,
  metadata = {}
}) {
  try {
    await connectDB();
    
    // Get target user info BEFORE deletion
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      console.error(`Target user ${targetUserId} not found for audit logging`);
      return false;
    }
    
    // Store complete user information for historical preservation
    const userInfo = {
      _id: targetUser._id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      image: targetUser.image,
      profession: targetUser.profession,
      createdAt: targetUser.createdAt,
      updatedAt: targetUser.updatedAt
    };
    
    // Create centralized audit log entry with complete user info
    const auditEntry = new AuditLog({
      type: 'user_management',
      action: 'account_deleted',
      performedBy: {
        _id: performedBy._id || performedBy.id,
        name: performedBy.name,
        role: performedBy.role
      },
      targetId: targetUserId,
      targetType: 'User',
      targetName: targetUser.name,
      changes: [{
        field: 'status',
        oldValue: 'active',
        newValue: 'deleted'
      }],
      reason,
      details: {
        deletedUserInfo: userInfo, // Store complete user info for historical reference
        deletionTime: new Date(),
        deletedBy: {
          _id: performedBy._id || performedBy.id,
          name: performedBy.name,
          role: performedBy.role
        }
      },
      metadata
    });

    await auditEntry.save();
    
    // Also create a legacy audit entry if possible (before deletion)
    try {
      const legacyAuditEntry = {
    action: 'account_deleted',
        performedBy: performedBy._id || performedBy.id,
        performedByName: performedBy.name,
        performedByRole: performedBy.role,
        timestamp: new Date(),
    reason,
    changes: [{
      field: 'status',
      oldValue: 'active',
      newValue: 'deleted'
    }],
    metadata
      };

      await User.findByIdAndUpdate(
        targetUserId,
        {
          $push: {
            auditLog: legacyAuditEntry
          }
        },
        { new: true }
      );
    } catch (legacyError) {
      console.error('Failed to add legacy audit log (user may be deleted):', legacyError);
      // This is expected to fail if user is already deleted - continue
    }

    // Account deletion audit logged successfully
    return true;
  } catch (error) {
    console.error('Failed to log account deletion audit trail:', error);
    return false;
  }
}

/**
 * Log account creation action
 */
export async function logAccountCreation({
  userId,
  userData,
  reason = 'Account created',
  metadata = {}
}) {
  try {
    await connectDB();
    
    // Create centralized audit log entry
    const auditEntry = new AuditLog({
      type: 'user_management',
      action: 'account_created',
      performedBy: {
        _id: userId,
        name: userData.name,
        role: userData.role
      },
      targetId: userId,
      targetType: 'User',
      targetName: userData.name,
      changes: [{
        field: 'status',
        oldValue: null,
        newValue: 'active'
      }],
      reason,
      details: {
        createdUserInfo: userData,
        creationTime: new Date()
      },
      metadata
    });

    await auditEntry.save();
    return true;
  } catch (error) {
    console.error('Failed to log account creation audit trail:', error);
    return false;
  }
}

/**
 * Log profile update action
 */
export async function logProfileUpdate({
  targetUserId,
  performedBy,
  changes,
  reason,
  metadata = {}
}) {
  return await logAuditTrail({
    targetUserId,
    action: 'profile_updated',
    performedBy,
    reason,
    changes,
    metadata
  });
} 