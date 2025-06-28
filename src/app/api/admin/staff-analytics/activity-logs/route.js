import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import Blog from '@/models/Blog';
import Review from '@/models/Review';
import Tool from '@/models/Tool';
import AuditLog from '@/models/AuditLog';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['admin', 'manager'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 30;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all staff members (admin, manager, writer)
    const staffMembers = await User.find({
      role: { $in: ['admin', 'manager', 'writer'] }
    }).select('_id name email role image').lean();

    const staffLookup = {};
    staffMembers.forEach(staff => {
      staffLookup[staff._id.toString()] = staff;
    });

    // SINGLE SOURCE OF TRUTH: Only use centralized AuditLog collection
    const allActivities = [];

    try {
      const auditLogs = await AuditLog.find({
        timestamp: { $gte: startDate },
        'performedBy._id': { $in: Object.keys(staffLookup) }
      }).sort({ timestamp: -1 }).lean();

      for (const log of auditLogs) {
        const performerId = log.performedBy?._id || log.userId;
        const staff = staffLookup[performerId?.toString()];
        
        if (staff) {
          // Get entity name from stored data or fetch if needed
          let entityName = log.targetName || log.details?.targetName;
          let entityInfo = {};

          // Try to get more detailed entity information
          if (!entityName && log.targetId) {
            try {
              switch (log.targetType) {
                case 'user':
                case 'User':
                  if (log.details?.deletedUserInfo) {
                    entityName = log.details.deletedUserInfo.name;
                    entityInfo = { 
                      email: log.details.deletedUserInfo.email,
                      role: log.details.deletedUserInfo.role 
                    };
                  } else {
                    const user = await User.findById(log.targetId).select('name email role').lean();
                    if (user) {
                      entityName = user.name;
                      entityInfo = { email: user.email, role: user.role };
                    }
                  }
                  break;
                case 'blog':
                case 'Blog':
                  if (log.details?.deletedBlogInfo) {
                    entityName = log.details.deletedBlogInfo.title;
                    entityInfo = { 
                      author: log.details.deletedBlogInfo.authorName,
                      status: log.details.deletedBlogInfo.status 
                    };
                  } else {
                    const blog = await Blog.findById(log.targetId).select('title authorId status').populate('authorId', 'name').lean();
                    if (blog) {
                      entityName = blog.title;
                      entityInfo = { 
                        author: blog.authorId?.name,
                        status: blog.status 
                      };
                    }
                  }
                  break;
                case 'tool':
                case 'Tool':
                  if (log.details?.deletedToolInfo) {
                    entityName = log.details.deletedToolInfo.name;
                    entityInfo = { 
                      category: log.details.deletedToolInfo.category,
                      verified: log.details.deletedToolInfo.verified 
                    };
                  } else {
                    const tool = await Tool.findById(log.targetId).select('name category verified').lean();
                    if (tool) {
                      entityName = tool.name;
                      entityInfo = { 
                        category: tool.category,
                        verified: tool.verified 
                      };
                    }
                  }
                  break;
                case 'review':
                case 'Review':
                  if (log.details?.deletedReviewInfo) {
                    entityName = `Review by ${log.details.deletedReviewInfo.userName}`;
                    entityInfo = { 
                      rating: log.details.deletedReviewInfo.rating,
                      tool: log.details.deletedReviewInfo.toolName 
                    };
                  } else {
                    const review = await Review.findById(log.targetId).select('rating userId toolId').populate([
                      { path: 'userId', select: 'name' },
                      { path: 'toolId', select: 'name' }
                    ]).lean();
                    if (review) {
                      entityName = `Review by ${review.userId?.name || 'Unknown'}`;
                      entityInfo = { 
                        rating: review.rating,
                        tool: review.toolId?.name 
                      };
                    }
                  }
                  break;
              }
            } catch (fetchError) {
              // Silent error handling for entity detail fetching
            }
          }

          // Enhanced description generation
          const description = generateEnhancedDescription(log, entityName, entityInfo);

          allActivities.push({
            id: log._id.toString(),
            timestamp: log.timestamp,
            staffId: staff._id.toString(),
            staffName: staff.name,
            staffEmail: staff.email,
            staffRole: staff.role,
            staffImage: staff.image,
            action: log.action,
            entityType: log.targetType || log.type,
            entityId: log.targetId,
            entityName: entityName || 'Unknown',
            entityInfo,
            description,
            reason: log.reason,
            metadata: log.metadata || {},
            changes: log.changes || [],
            details: log.details || {},
            source: 'centralized_audit'
          });
        }
      }

      // Sort by timestamp (most recent first)
      allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch staff activities',
        data: { activities: [] }
      }, { status: 500 });
          }

    return NextResponse.json({
      success: true,
      data: {
        activities: allActivities,
        summary: {
        totalActivities: allActivities.length,
          dateRange: { start: startDate, end: new Date() },
          staffCount: staffMembers.length,
          source: 'centralized_audit_only'
        }
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      data: { activities: [] }
    }, { status: 500 });
  }
}

/**
 * Generate enhanced descriptions for different actions
 */
function generateEnhancedDescription(log, entityName = 'Unknown', entityInfo = {}) {
  const action = log.action;
  const entityType = log.targetType || log.type;
  const changes = log.changes || [];
  const details = log.details || {};

  // Handle profile updates with detailed field changes
  if (action === 'profile_updated' && changes.length > 0) {
    const fieldList = changes.map(change => change.field).join(', ');
    return `Updated ${entityName}'s profile (${fieldList})`;
  }

  // Handle role changes
  if (action === 'role_changed' && changes.length > 0) {
    const roleChange = changes.find(c => c.field === 'role');
    if (roleChange) {
      return `Changed ${entityName}'s role from ${roleChange.oldValue} to ${roleChange.newValue}`;
    }
  }

  // Handle blog status changes
  if (entityType === 'blog' || entityType === 'Blog') {
    switch (action) {
      case 'created':
        return `Created blog post "${entityName}"`;
      case 'updated':
        if (changes.length > 0) {
          const fieldList = changes.map(c => c.field).join(', ');
          return `Updated blog "${entityName}" (${fieldList})`;
        }
        return `Updated blog post "${entityName}"`;
      case 'approved':
        return `Approved blog post "${entityName}" for publication`;
      case 'rejected':
        const reason = log.reason || details.reason;
        return `Rejected blog post "${entityName}"${reason ? ` - ${reason}` : ''}`;
      case 'published':
        return `Published blog post "${entityName}"`;
      case 'unpublished':
        return `Unpublished blog post "${entityName}"`;
      case 'moved_to_trash':
        return `Moved blog post "${entityName}" to trash`;
      case 'restored':
      case 'reposted':
        return `Restored blog post "${entityName}" from trash`;
      case 'deleted':
      case 'permanently_deleted':
        return `Permanently deleted blog post "${entityName}"`;
      default:
        return `Performed ${action.replace(/_/g, ' ')} on blog "${entityName}"`;
    }
  }

  // Handle tool actions
  if (entityType === 'tool' || entityType === 'Tool') {
    switch (action) {
      case 'created':
        return `Created tool "${entityName}"${entityInfo.category ? ` in ${entityInfo.category}` : ''}`;
      case 'updated':
        if (changes.length > 0) {
          const fieldList = changes.map(c => c.field).join(', ');
          return `Updated tool "${entityName}" (${fieldList})`;
        }
        return `Updated tool "${entityName}"`;
      case 'verified':
        return `Verified tool "${entityName}"`;
      case 'unverified':
        return `Removed verification from tool "${entityName}"`;
      case 'deleted':
        return `Deleted tool "${entityName}"`;
      default:
        return `Performed ${action.replace(/_/g, ' ')} on tool "${entityName}"`;
    }
  }

  // Handle review actions
  if (entityType === 'review' || entityType === 'Review') {
    switch (action) {
      case 'created':
        return `Created ${entityName}${entityInfo.tool ? ` for ${entityInfo.tool}` : ''}`;
      case 'updated':
        return `Updated ${entityName}`;
      case 'hidden':
        return `Hid ${entityName}`;
      case 'restored':
        return `Restored ${entityName}`;
      case 'replied':
        return `Replied to ${entityName}`;
      case 'deleted':
        return `Deleted ${entityName}`;
      default:
        return `Performed ${action.replace(/_/g, ' ')} on ${entityName}`;
    }
  }

  // Handle user management actions
  if (entityType === 'user' || entityType === 'User') {
    switch (action) {
      case 'blocked':
        return `Blocked user ${entityName}`;
      case 'unblocked':
        return `Unblocked user ${entityName}`;
      case 'role_changed':
        return `Changed ${entityName}'s role`;
      case 'profile_updated':
        return `Updated ${entityName}'s profile`;
      case 'account_deleted':
        return `Deleted user account: ${entityName}`;
      default:
        return `Performed ${action.replace(/_/g, ' ')} on user ${entityName}`;
    }
  }

  // Generic fallback
  return `Performed ${action.replace(/_/g, ' ')} on ${entityType} "${entityName}"`;
} 