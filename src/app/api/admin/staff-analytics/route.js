import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import connectDB from '@/lib/dbConnect';
import User from '@/models/User';
import Blog from '@/models/Blog';
import Tool from '@/models/Tool';
import Review from '@/models/Review';
import RecentView from '@/models/RecentView';
import AuditLog from '@/models/AuditLog';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin/manager permissions
    if (!['manager', 'admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30'; // days
    const staffId = searchParams.get('staffId'); // For individual staff details

    // Calculate date range
    const days = parseInt(timeRange);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all staff members (writers, managers, admins)
    const staff = await User.find({
      role: { $in: ['writer', 'manager', 'admin'] }
    }).lean();

    // Get all blogs for moderation analysis
    const allBlogs = await Blog.find()
      .populate('authorId', 'name email role')
      .populate('approvedBy', 'name email role')
      .populate('rejectedBy', 'name email role')
      .populate('repostedBy', 'name email role')
      .populate('deletedBy', 'name email role')
      .lean();

    // Get activities within time range
    const recentBlogs = allBlogs.filter(blog => 
      new Date(blog.createdAt) >= startDate
    );

    const tools = await Tool.find({
      createdAt: { $gte: startDate }
    }).lean();

    const reviews = await Review.find({
      createdAt: { $gte: startDate }
    })
    .populate('userId', 'name email role')
    .lean();

    const recentViewsData = await RecentView.find({
      viewedAt: { $gte: startDate }
    })
    .populate('userId', 'name email role')
    .lean();

    // If requesting individual staff details
    if (staffId) {
      const staffMember = staff.find(s => s._id.toString() === staffId);
      if (!staffMember) {
        return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
      }

      // Get all audit logs for this staff member from the centralized audit system
      const auditLogs = await AuditLog.find({
        'performedBy._id': staffId,
        timestamp: { $gte: startDate, $lte: new Date() }
      }).sort({ timestamp: -1 });

      // Found audit logs for staff member

      // Process audit logs to create activity summary
      const activities = auditLogs.map(log => {
        const actionConfig = getActionConfig(log.action, log.type);
        
        return {
          id: log._id,
          type: log.type,
          action: log.action,
          targetType: log.targetType,
          targetName: log.targetName,
          targetId: log.targetId,
          timestamp: log.timestamp,
          reason: log.reason,
          changes: log.changes,
          details: log.details,
          metadata: log.metadata,
          // UI display properties
          icon: actionConfig.icon,
          color: actionConfig.color,
          description: actionConfig.description,
          category: actionConfig.category
        };
      });

      // Calculate statistics
      const stats = {
        totalActions: activities.length,
        userManagement: activities.filter(a => a.type === 'user_management').length,
        toolManagement: activities.filter(a => a.type === 'tool_management').length,
        reviewManagement: activities.filter(a => a.type === 'review_management').length,
        blogModeration: activities.filter(a => a.type === 'blog_moderation').length,
        blogCreation: activities.filter(a => a.type === 'blog_creation').length
      };

      // Group activities by date for timeline
      const activitiesByDate = {};
      activities.forEach(activity => {
        const date = activity.timestamp.toISOString().split('T')[0];
        if (!activitiesByDate[date]) {
          activitiesByDate[date] = [];
        }
        activitiesByDate[date].push(activity);
      });

      // Create daily timeline
      const timeline = Object.keys(activitiesByDate)
        .sort((a, b) => new Date(b) - new Date(a))
        .map(date => ({
          date,
          activities: activitiesByDate[date]
        }));

      // Get recent activity (last 10 actions)
      const recentActivity = activities.slice(0, 10);

      // Calculate action breakdown
      const actionBreakdown = {};
      activities.forEach(activity => {
        const key = `${activity.type}_${activity.action}`;
        if (!actionBreakdown[key]) {
          actionBreakdown[key] = 0;
        }
        actionBreakdown[key]++;
      });

      // Get detailed moderation logs for this staff member
      const moderatedBlogs = allBlogs.filter(blog => 
        (blog.approvedBy && blog.approvedBy._id.toString() === staffId) ||
        (blog.rejectedBy && blog.rejectedBy._id.toString() === staffId) ||
        (blog.repostedBy && blog.repostedBy._id.toString() === staffId) ||
        (blog.deletedBy && blog.deletedBy._id.toString() === staffId)
      );

      // Get blogs created by this staff member (for writers)
      const createdBlogs = allBlogs.filter(blog => 
        blog.authorId && blog.authorId._id.toString() === staffId
      );

      const moderationLogs = [];
      
      // Add moderation actions performed BY this staff member
      moderatedBlogs.forEach(blog => {
        // Staff member approved this blog
        if (blog.approvedBy && blog.approvedBy._id.toString() === staffId) {
          moderationLogs.push({
            _id: `${blog._id}-approved`,
            type: 'blog_moderation',
            action: 'approved',
            title: blog.title,
            blogId: blog._id,
            timestamp: blog.approvedAt || blog.updatedAt,
            status: blog.status,
            performedBy: blog.approvedBy.name
          });
        }
        
        // Staff member rejected this blog
        if (blog.rejectedBy && blog.rejectedBy._id.toString() === staffId) {
          moderationLogs.push({
            _id: `${blog._id}-rejected`,
            type: 'blog_moderation',
            action: 'rejected',
            title: blog.title,
            blogId: blog._id,
            timestamp: blog.rejectedAt || blog.updatedAt,
            reason: blog.rejectionReason,
            status: blog.status,
            performedBy: blog.rejectedBy.name
          });
        }
        
        // Staff member re-published this blog
        if (blog.repostedBy && blog.repostedBy._id.toString() === staffId) {
          moderationLogs.push({
            _id: `${blog._id}-reposted`,
            type: 'blog_moderation',
            action: 'reposted',
            title: blog.title,
            blogId: blog._id,
            timestamp: blog.repostedAt || blog.updatedAt,
            status: blog.status,
            performedBy: blog.repostedBy.name
          });
        }
        
        // Staff member moved this blog to trash
        if (blog.deletedBy && blog.deletedBy._id.toString() === staffId) {
          moderationLogs.push({
            _id: `${blog._id}-deleted`,
            type: 'blog_moderation',
            action: 'moved_to_trash',
            title: blog.title,
            blogId: blog._id,
            timestamp: blog.deletedAt || blog.updatedAt,
            status: 'deleted',
            performedBy: blog.deletedBy.name
          });
        }
      });

      // Add blog creation activities (for writers)
      createdBlogs.forEach(blog => {
        moderationLogs.push({
          _id: `${blog._id}-created`,
          type: 'blog_creation',
          action: 'created',
          title: blog.title,
          blogId: blog._id,
          timestamp: blog.createdAt,
          status: blog.status,
          performedBy: blog.authorId.name
        });
      });

      // Add tool management activities
      // First, get tools that have createdBy/updatedBy fields set
      const managedTools = await Tool.find({
        $or: [
          { createdBy: staffId },
          { updatedBy: staffId }
        ]
      }).lean();

      managedTools.forEach(tool => {
        if (tool.createdBy && tool.createdBy.toString() === staffId) {
          moderationLogs.push({
            _id: `${tool._id}-created`,
            type: 'tool_management',
            action: 'created',
            title: tool.name,
            toolId: tool._id,
            timestamp: tool.createdAt,
            status: 'published',
            performedBy: staffMember.name
          });
        }
        
        if (tool.updatedBy && tool.updatedBy.toString() === staffId && tool.updatedAt > tool.createdAt) {
          moderationLogs.push({
            _id: `${tool._id}-updated`,
            type: 'tool_management',
            action: 'updated',
            title: tool.name,
            toolId: tool._id,
            timestamp: tool.updatedAt,
            status: 'published',
            performedBy: staffMember.name
          });
        }
      });

      // For tools without createdBy/updatedBy fields, we'll approximate based on recent activity
      // This is a fallback for existing tools that don't have audit fields
      const recentTools = await Tool.find({
        $and: [
          { 
            $or: [
              { createdBy: { $exists: false } },
              { createdBy: null },
              { updatedBy: { $exists: false } },
              { updatedBy: null }
            ]
          },
          {
            $or: [
              { createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } },
              { updatedAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) } }
            ]
          }
        ]
      }).lean();

      // Add these as potential tool management activities (with a note that they're approximated)
      recentTools.forEach(tool => {
        const daysSinceCreation = Math.floor((new Date() - new Date(tool.createdAt)) / (1000 * 60 * 60 * 24));
        const daysSinceUpdate = Math.floor((new Date() - new Date(tool.updatedAt)) / (1000 * 60 * 60 * 24));
        
        if (daysSinceCreation <= days) {
          moderationLogs.push({
            _id: `${tool._id}-created-approx`,
            type: 'tool_management',
            action: 'created',
            title: tool.name,
            toolId: tool._id,
            timestamp: tool.createdAt,
            status: 'published',
            performedBy: staffMember.name,
            details: {
              note: 'Approximated - tool created within time range',
              hasAuditFields: false
            }
          });
        }
        
        if (daysSinceUpdate <= days && tool.updatedAt > tool.createdAt) {
          moderationLogs.push({
            _id: `${tool._id}-updated-approx`,
            type: 'tool_management',
            action: 'updated',
            title: tool.name,
            toolId: tool._id,
            timestamp: tool.updatedAt,
            status: 'published',
            performedBy: staffMember.name,
            details: {
              note: 'Approximated - tool updated within time range',
              hasAuditFields: false
            }
          });
        }
      });

      // Add review management activities (replies, hide/restore, deletion, moderation)
      const allReviews = await Review.find({})
        .populate('toolId', 'name')
        .populate('userId', 'name')
        .lean();

      // Add review reply activities from the replies field
      const reviewReplies = await Review.find({
        'replies.userId': staffId
      }).populate('replies.userId', 'name').lean();

      reviewReplies.forEach(review => {
        const staffReplies = review.replies.filter(reply => 
          reply.userId && reply.userId._id.toString() === staffId
        );
        
        staffReplies.forEach(reply => {
          moderationLogs.push({
            _id: `${review._id}-reply-${reply._id}`,
            type: 'review_management',
            action: 'replied',
            title: `Reply to review on ${review.toolId?.name || 'Unknown Tool'}`,
            reviewId: review._id,
            timestamp: reply.createdAt,
            status: 'published',
            performedBy: reply.userId.name
          });
        });
      });

      // Add review moderation activities (hide/restore actions)
      // Note: Since Review model doesn't have audit logs for hide/restore,
      // we'll need to check if there are any recently modified reviews that might indicate moderation
      allReviews.forEach(review => {
        // Check if review was recently updated (could indicate moderation action)
        if (review.updatedAt && review.updatedAt > review.createdAt) {
          const daysSinceUpdate = Math.floor((new Date() - new Date(review.updatedAt)) / (1000 * 60 * 60 * 24));
          
          // If updated within the time range, it could be a moderation action
          if (daysSinceUpdate <= days) {
            // Add a log entry for review moderation (approximated)
            if (review.status === 'hidden') {
              moderationLogs.push({
                _id: `${review._id}-hidden-${review.updatedAt}`,
                type: 'review_management',
                action: 'hidden',
                title: `Hidden review on ${review.toolId?.name || 'Unknown Tool'}`,
                reviewId: review._id,
                targetUser: review.userId,
                timestamp: review.updatedAt,
                status: 'hidden',
                performedBy: staffMember.name,
                details: {
                  reviewContent: review.comment,
                  reviewRating: review.rating,
                  originalUser: review.userId?.name || 'Unknown User'
                }
              });
            } else if (review.status === 'visible') {
              moderationLogs.push({
                _id: `${review._id}-restored-${review.updatedAt}`,
                type: 'review_management',
                action: 'restored',
                title: `Restored review on ${review.toolId?.name || 'Unknown Tool'}`,
                reviewId: review._id,
                targetUser: review.userId,
                timestamp: review.updatedAt,
                status: 'visible',
                performedBy: staffMember.name,
                details: {
                  reviewContent: review.comment,
                  reviewRating: review.rating,
                  originalUser: review.userId?.name || 'Unknown User'
                }
              });
            }
          }
        }

        // Check for review replies by staff members
        if (review.replyAuthor && review.replyRole && 
            ['admin', 'manager'].includes(review.replyRole) &&
            review.updatedAt) {
          const daysSinceReply = Math.floor((new Date() - new Date(review.updatedAt)) / (1000 * 60 * 60 * 24));
          
          if (daysSinceReply <= days) {
            moderationLogs.push({
              _id: `${review._id}-replied-${review.updatedAt}`,
              type: 'review_management',
              action: 'replied',
              title: `Replied to review on ${review.toolId?.name || 'Unknown Tool'}`,
              reviewId: review._id,
              targetUser: review.userId,
              timestamp: review.updatedAt,
              status: 'published',
              performedBy: review.replyAuthor,
              details: {
                replyContent: review.reply,
                replyRole: review.replyRole,
                originalUser: review.userId?.name || 'Unknown User'
              }
            });
          }
        }
      });

      // Add user management activities from audit logs
      const usersWithAuditLogs = await User.find({
        'auditLog.performedBy': staffId
      }).lean();

      // Also fetch from centralized AuditLog collection
      const centralizedAuditLogs = await AuditLog.find({
        'performedBy._id': staffId,
        timestamp: { $gte: startDate }
      }).populate('targetId', 'name email role').lean();

      // Process centralized audit logs
      centralizedAuditLogs.forEach(log => {
        if (log.targetId) {
          let title = '';
          let details = {};

          switch (log.action) {
            case 'role_changed':
              const roleChange = log.changes?.find(c => c.field === 'role');
              if (roleChange) {
                title = `Changed ${log.targetName}'s role from ${roleChange.oldValue} to ${roleChange.newValue}`;
                details = {
                  fromRole: roleChange.oldValue,
                  toRole: roleChange.newValue,
                  reason: log.reason,
                  changes: log.changes || []
                };
              } else {
                title = `Changed ${log.targetName}'s role`;
              }
              break;
            
            case 'blocked':
              title = `Blocked user ${log.targetName}`;
              details = {
                reason: log.reason,
                previousStatus: 'active',
                newStatus: 'blocked',
                changes: log.changes || []
              };
              break;
            
            case 'unblocked':
              title = `Unblocked user ${log.targetName}`;
              details = {
                reason: log.reason,
                previousStatus: 'blocked',
                newStatus: 'active',
                changes: log.changes || []
              };
              break;
            
            case 'profile_updated':
              const fieldsChanged = log.changes?.map(c => c.field) || [];
              title = `Updated ${log.targetName}'s profile${fieldsChanged.length > 0 ? ` (${fieldsChanged.join(', ')})` : ''}`;
              details = {
                fieldsChanged,
                changesCount: log.changes?.length || 0,
                reason: log.reason,
                changes: log.changes || []
              };
              break;
            
            case 'data_modified':
              const modifiedFields = log.changes?.map(c => c.field) || [];
              title = `Modified ${log.targetName}'s data${modifiedFields.length > 0 ? ` (${modifiedFields.join(', ')})` : ''}`;
              details = {
                fieldsChanged: modifiedFields,
                changesCount: log.changes?.length || 0,
                reason: log.reason,
                changes: log.changes || []
              };
              break;
            
            case 'account_deleted':
              title = `Deleted user account: ${log.targetName}`;
              details = {
                deletedUser: {
                  name: log.targetId.name,
                  email: log.targetId.email,
                  role: log.targetId.role
                },
                reason: log.reason,
                changes: log.changes || []
              };
              break;
            
            default:
              title = `${log.action.replace(/_/g, ' ')} for ${log.targetName}`;
              details = { 
                reason: log.reason,
                changes: log.changes || []
              };
          }

          moderationLogs.push({
            _id: `central-${log._id}`,
            type: log.type || 'user_management',
            action: log.action,
            title,
            userId: log.targetId._id,
            targetUser: {
              _id: log.targetId._id,
              name: log.targetId.name || log.targetName,
              email: log.targetId.email,
              role: log.targetId.role
            },
            timestamp: log.timestamp,
            status: log.action === 'account_deleted' ? 'deleted' : 
                    log.action === 'blocked' ? 'blocked' : 'completed',
            performedBy: log.performedBy?.name || staffMember.name,
            reason: log.reason,
            details,
            metadata: log.metadata || {}
          });
        }
      });

      usersWithAuditLogs.forEach(user => {
        // Process audit log entries performed by this staff member
        if (user.auditLog && user.auditLog.length > 0) {
          user.auditLog
            .filter(log => log.performedBy && log.performedBy.toString() === staffId)
            .forEach(log => {
              // Create detailed title based on action type
              let title = '';
              let details = {};

              switch (log.action) {
                case 'role_changed':
                  const roleChange = log.changes?.find(c => c.field === 'role');
                  if (roleChange) {
                    title = `Changed ${user.name}'s role from ${roleChange.oldValue} to ${roleChange.newValue}`;
                    details = {
                      fromRole: roleChange.oldValue,
                      toRole: roleChange.newValue,
                      reason: log.reason
                    };
                  } else {
                    title = `Changed ${user.name}'s role`;
                  }
                  break;
                
                case 'blocked':
                  title = `Blocked user ${user.name}`;
                  details = {
                    reason: log.reason,
                    previousStatus: 'active',
                    newStatus: 'blocked'
                  };
                  break;
                
                case 'unblocked':
                  title = `Unblocked user ${user.name}`;
                  details = {
                    reason: log.reason,
                    previousStatus: 'blocked',
                    newStatus: 'active'
                  };
                  break;
                
                case 'profile_updated':
                  const fieldsChanged = log.changes?.map(c => c.field) || [];
                  title = `Updated ${user.name}'s profile${fieldsChanged.length > 0 ? ` (${fieldsChanged.join(', ')})` : ''}`;
                  details = {
                    fieldsChanged,
                    changesCount: log.changes?.length || 0,
                    reason: log.reason,
                    changes: log.changes || []
                  };
                  break;
                
                case 'data_modified':
                  const modifiedFields = log.changes?.map(c => c.field) || [];
                  title = `Modified ${user.name}'s data${modifiedFields.length > 0 ? ` (${modifiedFields.join(', ')})` : ''}`;
                  details = {
                    fieldsChanged: modifiedFields,
                    changesCount: log.changes?.length || 0,
                    reason: log.reason,
                    changes: log.changes
                  };
                  break;
                
                case 'account_deleted':
                  title = `Deleted user account: ${user.name}`;
                  details = {
                    deletedUser: {
                      name: user.name,
                      email: user.email,
                      role: user.role
                    },
                    reason: log.reason
                  };
                  break;
                
                default:
                  title = `${log.action.replace('_', ' ')} for ${user.name}`;
                  details = { reason: log.reason };
              }

              moderationLogs.push({
                _id: `${user._id}-${log.action}-${log.timestamp}`,
                type: 'user_management',
                action: log.action,
                title,
                userId: user._id,
                targetUser: {
                  _id: user._id,
                  name: user.name,
                  email: user.email,
                  role: user.role
                },
                timestamp: log.timestamp,
                status: log.action === 'account_deleted' ? 'deleted' : 
                        log.action === 'blocked' ? 'active' : 'completed',
                performedBy: log.performedByName || staffMember.name,
                reason: log.reason,
                details,
                metadata: log.metadata || {}
              });
            });
        }
      });

      // Sort moderation logs by timestamp
      moderationLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Remove duplicates based on action, timestamp, and target
      const uniqueLogs = [];
      const seenLogs = new Set();
      
      moderationLogs.forEach(log => {
        const logKey = `${log.action}-${log.timestamp}-${log.userId || log.targetUser?._id}`;
        if (!seenLogs.has(logKey)) {
          seenLogs.add(logKey);
          uniqueLogs.push(log);
        }
      });

      // Calculate individual stats
      const blogsApproved = allBlogs.filter(blog => 
        blog.approvedBy && blog.approvedBy._id.toString() === staffId
      ).length;

      const blogsRejected = allBlogs.filter(blog => 
        blog.rejectedBy && blog.rejectedBy._id.toString() === staffId
      ).length;

      const blogsReposted = allBlogs.filter(blog => 
        blog.repostedBy && blog.repostedBy._id.toString() === staffId
      ).length;

      const blogsTrashed = allBlogs.filter(blog => 
        blog.deletedBy && blog.deletedBy._id.toString() === staffId
      ).length;

      const blogsCreated = allBlogs.filter(blog => 
        blog.authorId && blog.authorId._id.toString() === staffId
      ).length;

      const toolsModerated = tools.filter(tool => 
        tool.createdBy && tool.createdBy.toString() === staffId
      ).length;

      // Calculate decision impact score
      const decisionImpactScore = (blogsApproved * 2 + blogsReposted) - blogsRejected;

      // Convert moderationLogs to activities format expected by frontend
      const staffActivities = uniqueLogs.map(log => {
        const activity = {
          id: log._id,
          action: log.action,
          entityType: log.type === 'blog_moderation' || log.type === 'blog_creation' ? 'blog' : 
                     log.type === 'tool_management' ? 'tool' :
                     log.type === 'review_management' ? 'review' :
                     log.type === 'user_management' ? 'user' : 'unknown',
          entityName: log.title || log.targetUser?.name || 'Unknown',
          entityId: log.blogId || log.toolId || log.reviewId || log.userId,
          timestamp: log.timestamp,
          details: log.details || {},
          changes: log.details?.changes || log.changes || []
        };
        
        return activity;
      });

      // Calculate stats in the format expected by frontend
      const staffStats = {
        totalActions: staffActivities.length,
        userManagement: staffActivities.filter(a => a.entityType === 'user').length,
        toolManagement: staffActivities.filter(a => a.entityType === 'tool').length,
        reviewManagement: staffActivities.filter(a => a.entityType === 'review').length,
        blogModeration: staffActivities.filter(a => a.entityType === 'blog' && a.action !== 'created').length,
        blogCreation: staffActivities.filter(a => a.entityType === 'blog' && a.action === 'created').length,
        // Additional metrics for Activity Summary
        totalActivities: staffActivities.length,
        // Calculate average online time per day (assuming 8 hours active work day for staff)
        avgOnlinePerDay: staffActivities.length > 0 ? Math.min(8, (staffActivities.length * 0.5 / days)).toFixed(1) : 0,
        // Get last action with descriptive title
        lastActionTitle: staffActivities.length > 0 ? (() => {
          const lastActivity = staffActivities[0];
          switch(lastActivity.action) {
            case 'profile_updated': return 'Updated user profile';
            case 'role_changed': return 'Changed user role';
            case 'blocked': return 'Blocked user';
            case 'unblocked': return 'Unblocked user';
            case 'approved': return 'Approved blog';
            case 'rejected': return 'Rejected blog';
            case 'moved_to_trash': return 'Moved blog to trash';
            case 'restored': return 'Restored blog';
            case 'created': 
              return lastActivity.entityType === 'blog' ? 'Created blog' : 
                     lastActivity.entityType === 'tool' ? 'Created tool' : 'Created content';
            case 'updated':
              return lastActivity.entityType === 'tool' ? 'Edited tool' : 'Updated content';
            case 'deleted': return 'Deleted content';
            case 'hidden': return 'Hidden review';
            case 'replied': return 'Replied to review';
            default: return lastActivity.action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
          }
        })() : null,
        lastAction: staffActivities.length > 0 ? staffActivities[0].timestamp : null,
        lastLogin: staffMember.lastLogin || null,
        // Check if user is currently online (last activity within 30 minutes)
        isOnline: staffMember.lastLogin && (new Date() - new Date(staffMember.lastLogin)) < (30 * 60 * 1000)
      };

      return NextResponse.json({
        success: true,
        staffMember: {
          _id: staffMember._id,
          name: staffMember.name,
          email: staffMember.email,
          role: staffMember.role,
          image: staffMember.image,
          lastLogin: staffMember.lastLogin,
          lastAction: staffStats.lastAction
        },
        stats: staffStats,
        activities: staffActivities,
        timeline: timeline,
        actionBreakdown,
        recentActivity: recentActivity,
        // Keep the old structure for backward compatibility
        moderationLogs: uniqueLogs.slice(0, 100), // Limit to 100 recent logs
        timeRange: days,
        auditLogs: auditLogs.slice(0, 100) // Limit to 100 recent audit logs
      });
    }

    // Calculate comprehensive staff statistics
    const staffLeaderboard = staff.map(member => {
      // Moderation statistics
      const blogsApproved = allBlogs.filter(blog => 
        blog.approvedBy && blog.approvedBy._id.toString() === member._id.toString()
      ).length;

      const blogsRejected = allBlogs.filter(blog => 
        blog.rejectedBy && blog.rejectedBy._id.toString() === member._id.toString()
      ).length;

      const blogsReposted = allBlogs.filter(blog => 
        blog.repostedBy && blog.repostedBy._id.toString() === member._id.toString()
      ).length;

      const blogsTrashed = allBlogs.filter(blog => 
        blog.deletedBy && blog.deletedBy._id.toString() === member._id.toString()
      ).length;

      const blogsCreated = allBlogs.filter(blog => 
        blog.authorId && blog.authorId._id.toString() === member._id.toString()
      ).length;

      const toolsApproved = tools.filter(tool => 
        tool.createdBy && tool.createdBy.toString() === member._id.toString()
      ).length;

      // Activity in time range
      const recentBlogsCreated = recentBlogs.filter(blog => 
        blog.authorId && blog.authorId._id.toString() === member._id.toString()
      ).length;

      const memberRecentReviews = reviews.filter(review => 
        review.userId && review.userId._id.toString() === member._id.toString()
      ).length;

      const memberRecentViews = recentViewsData.filter(view => 
        view.userId && view.userId._id.toString() === member._id.toString()
      ).length;

      // Calculate decision impact score
      const decisionImpactScore = (blogsApproved * 2 + blogsReposted) - blogsRejected;

      // Calculate login frequency (days since last login)
      const daysSinceLastLogin = member.lastLogin ? 
        Math.floor((new Date() - new Date(member.lastLogin)) / (1000 * 60 * 60 * 24)) : 999;

      const loginFrequency = daysSinceLastLogin <= 1 ? 'Very Active' :
                            daysSinceLastLogin <= 7 ? 'Active' :
                            daysSinceLastLogin <= 30 ? 'Moderate' : 'Inactive';

      const totalActivity = recentBlogsCreated + memberRecentReviews + (memberRecentViews * 0.1);
      const totalModerationActions = blogsApproved + blogsRejected + blogsReposted + blogsTrashed;

      return {
        _id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        image: member.image,
        // Moderation metrics
        blogsApproved,
        blogsRejected,
        blogsReposted,
        blogsTrashed,
        blogsCreated,
        toolsApproved,
        decisionImpactScore,
        totalModerationActions,
        // Activity metrics
        recentBlogs: recentBlogsCreated,
        recentReviews: memberRecentReviews,
        recentViews: memberRecentViews,
        totalActivity,
        // Login metrics
        lastLogin: member.lastLogin,
        daysSinceLastLogin,
        loginFrequency,
        createdAt: member.createdAt
      };
    });

    // Sort by total moderation actions + recent activity
    const sortedStaffLeaderboard = staffLeaderboard
      .sort((a, b) => (b.totalModerationActions + b.totalActivity) - (a.totalModerationActions + a.totalActivity));

    // Calculate overall statistics
    const totalStaff = staff.length;
    const writers = staff.filter(s => s.role === 'writer');
    const managers = staff.filter(s => s.role === 'manager');
    const admins = staff.filter(s => s.role === 'admin');

    // Enhanced metrics
    const totalBlogsApproved = allBlogs.filter(blog => blog.status === 'published').length;
    const totalBlogsRejected = allBlogs.filter(blog => blog.status === 'rejected').length;
    const totalBlogsTrashed = allBlogs.filter(blog => blog.deletedAt).length;
    const totalBlogsReposted = allBlogs.filter(blog => blog.repostedBy).length;
    const totalToolsApproved = tools.length;

    // Get most active staff members (top 10)
    const mostActiveStaff = sortedStaffLeaderboard.slice(0, 10);

    // Calculate staff activity by role with enhanced metrics (after staffLeaderboard is constructed)
    const roleStats = {
      writer: {
        count: writers.length,
        blogs: recentBlogs.filter(b => b.authorId?.role === 'writer').length,
        reviews: reviews.filter(r => r.userId?.role === 'writer').length,
        views: recentViewsData.filter(v => v.userId?.role === 'writer').length,
        avgBlogsPerWriter: writers.length > 0 ? 
          (recentBlogs.filter(b => b.authorId?.role === 'writer').length / writers.length).toFixed(1) : 0,
        moderationActions: sortedStaffLeaderboard.filter(s => s.role === 'writer')
          .reduce((sum, s) => sum + s.totalModerationActions, 0)
      },
      manager: {
        count: managers.length,
        blogs: recentBlogs.filter(b => b.authorId?.role === 'manager').length,
        reviews: reviews.filter(r => r.userId?.role === 'manager').length,
        views: recentViewsData.filter(v => v.userId?.role === 'manager').length,
        toolsAdded: tools.filter(t => t.createdBy && 
          staff.find(s => s._id.toString() === t.createdBy.toString())?.role === 'manager').length,
        moderationActions: sortedStaffLeaderboard.filter(s => s.role === 'manager')
          .reduce((sum, s) => sum + s.totalModerationActions, 0)
      },
      admin: {
        count: admins.length,
        blogs: recentBlogs.filter(b => b.authorId?.role === 'admin').length,
        reviews: reviews.filter(r => r.userId?.role === 'admin').length,
        views: recentViewsData.filter(v => v.userId?.role === 'admin').length,
        toolsAdded: tools.filter(t => t.createdBy && 
          staff.find(s => s._id.toString() === t.createdBy.toString())?.role === 'admin').length,
        moderationActions: sortedStaffLeaderboard.filter(s => s.role === 'admin')
          .reduce((sum, s) => sum + s.totalModerationActions, 0)
      }
    };

    // Calculate daily activity stats with enhanced metrics
    const dailyStats = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayBlogs = recentBlogs.filter(b => {
        const blogDate = new Date(b.createdAt);
        return blogDate >= date && blogDate < nextDate;
      });

      const dayReviews = reviews.filter(r => {
        const reviewDate = new Date(r.createdAt);
        return reviewDate >= date && reviewDate < nextDate;
      });

      const dayViews = recentViewsData.filter(v => {
        const viewDate = new Date(v.viewedAt);
        return viewDate >= date && viewDate < nextDate;
      });

      // Calculate moderation actions for the day
      const dayModerationActions = allBlogs.filter(blog => {
        const approvedDate = blog.approvedAt && new Date(blog.approvedAt);
        const rejectedDate = blog.rejectedAt && new Date(blog.rejectedAt);
        const repostedDate = blog.repostedAt && new Date(blog.repostedAt);
        const deletedDate = blog.deletedAt && new Date(blog.deletedAt);
        
        return (approvedDate && approvedDate >= date && approvedDate < nextDate) ||
               (rejectedDate && rejectedDate >= date && rejectedDate < nextDate) ||
               (repostedDate && repostedDate >= date && repostedDate < nextDate) ||
               (deletedDate && deletedDate >= date && deletedDate < nextDate);
      }).length;

      // Calculate logins (approximate based on activity)
      const activeUsers = new Set([
        ...dayBlogs.map(b => b.authorId?._id?.toString()).filter(Boolean),
        ...dayReviews.map(r => r.userId?._id?.toString()).filter(Boolean),
        ...dayViews.map(v => v.userId?._id?.toString()).filter(Boolean)
      ]);

      dailyStats.push({
        date: date.toISOString().split('T')[0],
        blogs: dayBlogs.length,
        reviews: dayReviews.length,
        views: dayViews.length,
        moderationActions: dayModerationActions,
        activeUsers: activeUsers.size,
        writerActivity: dayBlogs.filter(b => b.authorId?.role === 'writer').length,
        managerActivity: dayBlogs.filter(b => b.authorId?.role === 'manager').length + 
                        dayReviews.filter(r => r.userId?.role === 'manager').length,
        adminActivity: dayBlogs.filter(b => b.authorId?.role === 'admin').length + 
                      dayReviews.filter(r => r.userId?.role === 'admin').length
      });
    }

    // Get recent staff activities with enhanced details - Include ALL activity types
    const recentActivities = [];

    // 1. Add audit log activities from centralized AuditLog collection
    try {
      const AuditLog = (await import('@/models/AuditLog')).default;
      const centralizedAuditLogs = await AuditLog.find({
        timestamp: { $gte: startDate }
      })
      .populate('performedBy._id', 'name email image role')
      .populate('targetId', 'name email role title')
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();

      centralizedAuditLogs.forEach(log => {
        if (log.performedBy && log.performedBy._id) {
          recentActivities.push({
            _id: `audit-${log._id}`,
            type: 'audit',
            action: log.action,
            description: getActivityDescription(log.action, log.type, log.targetName || log.targetId?.name),
            title: log.targetName || log.targetId?.name || 'Unknown',
            user: {
              _id: log.performedBy._id._id,
              name: log.performedBy._id.name,
              email: log.performedBy._id.email,
              image: log.performedBy._id.image,
              role: log.performedBy._id.role
            },
            timestamp: log.timestamp,
            createdAt: log.timestamp,
            metadata: {
              entityType: log.type,
              changes: log.changes || [],
              reason: log.reason,
              ipAddress: log.ipAddress
            }
          });
        }
      });
    } catch (error) {
      // Error fetching centralized audit logs, continuing with legacy logs
    }

    // 2. Add activities from User audit logs (legacy system)
    const usersWithAuditLogs = await User.find({
      'auditLog.timestamp': { $gte: startDate }
    }).lean();

    usersWithAuditLogs.forEach(user => {
      if (user.auditLog && user.auditLog.length > 0) {
        user.auditLog
          .filter(log => log.timestamp && new Date(log.timestamp) >= startDate)
          .slice(0, 20) // Limit per user
          .forEach(log => {
            if (log.performedBy) {
              const performer = staff.find(s => s._id.toString() === log.performedBy.toString());
              if (performer) {
                recentActivities.push({
                  _id: `user-audit-${user._id}-${log.timestamp}`,
                  type: 'user_management',
                  action: log.action,
                  description: getActivityDescription(log.action, 'user_management', user.name),
                  title: user.name,
                  user: {
                    _id: performer._id,
                    name: performer.name,
                    email: performer.email,
                    image: performer.image,
                    role: performer.role
                  },
                  timestamp: log.timestamp,
                  createdAt: log.timestamp,
                  metadata: {
                    entityType: 'user',
                    targetUser: {
                      _id: user._id,
                      name: user.name,
                      email: user.email,
                      role: user.role
                    },
                    changes: log.changes || [],
                    reason: log.reason
                  }
                });
              }
            }
          });
      }
    });

    // 3. Add blog activities (creation and moderation)
    recentBlogs.slice(0, 20).forEach(blog => {
      if (blog.authorId) {
        recentActivities.push({
          _id: `blog-created-${blog._id}`,
          type: 'blog_creation',
          action: 'created',
          description: 'Created blog post',
          title: blog.title,
          user: blog.authorId,
          timestamp: blog.createdAt,
          createdAt: blog.createdAt,
          metadata: {
            entityType: 'blog',
            status: blog.status,
            categories: blog.categories
          }
        });
      }
    });

    // Add blog moderation activities
    const moderationActivities = [
      { field: 'approvedAt', action: 'approved', byField: 'approvedBy' },
      { field: 'rejectedAt', action: 'rejected', byField: 'rejectedBy' },
      { field: 'repostedAt', action: 'reposted', byField: 'repostedBy' },
      { field: 'deletedAt', action: 'moved_to_trash', byField: 'deletedBy' }
    ];

    moderationActivities.forEach(({ field, action, byField }) => {
      allBlogs
        .filter(blog => blog[field] && new Date(blog[field]) >= startDate && blog[byField])
        .slice(0, 15)
        .forEach(blog => {
          recentActivities.push({
            _id: `blog-${action}-${blog._id}`,
            type: 'blog_moderation',
            action: action,
            description: getActivityDescription(action, 'blog_moderation', blog.title),
            title: blog.title,
            user: blog[byField],
            timestamp: blog[field],
            createdAt: blog[field],
            metadata: {
              entityType: 'blog',
              status: blog.status,
              reason: blog.rejectionReason || blog.deletionReason
            }
          });
        });
    });

    // 4. Add review activities
    reviews.slice(0, 20).forEach(review => {
      if (review.userId) {
        recentActivities.push({
          _id: `review-posted-${review._id}`,
          type: 'review_management',
          action: 'posted',
          description: `Posted ${review.rating}/5 star review`,
          title: review.toolId?.name || 'Unknown Tool',
          user: review.userId,
          timestamp: review.createdAt,
          createdAt: review.createdAt,
          metadata: {
            entityType: 'review',
            rating: review.rating,
            toolId: review.toolId?._id
          }
        });
      }
    });

    // 5. Add tool management activities
    tools.slice(0, 15).forEach(tool => {
      if (tool.createdBy) {
        const creator = staff.find(s => s._id.toString() === tool.createdBy.toString());
        if (creator) {
          recentActivities.push({
            _id: `tool-created-${tool._id}`,
            type: 'tool_management',
            action: 'created',
            description: 'Added new tool',
            title: tool.name,
            user: {
              _id: creator._id,
              name: creator.name,
              email: creator.email,
              image: creator.image,
              role: creator.role
            },
            timestamp: tool.createdAt,
            createdAt: tool.createdAt,
            metadata: {
              entityType: 'tool',
              category: tool.category,
              status: tool.status
            }
          });
        }
      }
    });

    // Helper function to get activity description
    function getActivityDescription(action, type, targetName = '') {
      const descriptions = {
        // User Management
        'role_changed': `Changed ${targetName}'s role`,
        'blocked': `Blocked user ${targetName}`,
        'unblocked': `Unblocked user ${targetName}`,
        'profile_updated': `Updated ${targetName}'s profile`,
        'data_modified': `Modified ${targetName}'s data`,
        'account_deleted': `Deleted user account: ${targetName}`,
        
        // Blog Management
        'created': type === 'blog_creation' ? `Created blog post` : `Created ${type.replace('_', ' ')}`,
        'approved': `Approved blog post`,
        'rejected': `Rejected blog post`,
        'reposted': `Re-published blog post`,
        'moved_to_trash': `Moved blog to trash`,
        'updated': `Updated ${type.replace('_', ' ')}`,
        
        // Tool Management
        'tool_created': 'Added new tool',
        'tool_updated': 'Updated tool',
        'tool_deleted': 'Deleted tool',
        
        // Review Management
        'posted': 'Posted review',
        'hidden': 'Hidden review',
        'restored': 'Restored review',
        'replied': 'Replied to review'
      };
      
      return descriptions[action] || `${action.replace(/_/g, ' ')} ${targetName}`;
    }

    // Sort all recent activities by timestamp (most recent first)
    recentActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Login statistics
    const recentLogins = staff
      .filter(member => member.lastLogin && new Date(member.lastLogin) >= startDate)
      .sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin))
      .slice(0, 20)
      .map(member => ({
        _id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        image: member.image,
        lastLogin: member.lastLogin
      }));

    // Staff registration trends
    const newStaffMembers = staff
      .filter(member => new Date(member.createdAt) >= startDate)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(member => ({
        _id: member._id,
        name: member.name,
        email: member.email,
        role: member.role,
        image: member.image,
        createdAt: member.createdAt
      }));

    // Inactive writers (no posts in last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const inactiveWriters = writers.filter(writer => {
      const writerBlogs = allBlogs.filter(blog => 
        blog.authorId && blog.authorId._id.toString() === writer._id.toString() &&
        new Date(blog.createdAt) >= fourteenDaysAgo
      );
      return writerBlogs.length === 0;
    }).map(writer => ({
      _id: writer._id,
      name: writer.name,
      email: writer.email,
      image: writer.image,
      lastLogin: writer.lastLogin,
      daysSinceLastLogin: writer.lastLogin ? 
        Math.floor((new Date() - new Date(writer.lastLogin)) / (1000 * 60 * 60 * 24)) : 999
    }));

    // Stale drafts (drafts not updated for more than 14 days)
    const staleDrafts = allBlogs.filter(blog => 
      blog.status === 'draft' && 
      new Date(blog.updatedAt) < fourteenDaysAgo
    ).map(blog => ({
      _id: blog._id,
      title: blog.title,
      author: blog.authorId,
      lastUpdated: blog.updatedAt,
      daysSinceUpdate: Math.floor((new Date() - new Date(blog.updatedAt)) / (1000 * 60 * 60 * 24))
    }));

    // Login frequency distribution
    const loginFrequencyDistribution = {
      'Very Active': 0,
      'Active': 0,
      'Moderate': 0,
      'Inactive': 0
    };

    staff.forEach(member => {
      const daysSinceLastLogin = member.lastLogin ? 
        Math.floor((new Date() - new Date(member.lastLogin)) / (1000 * 60 * 60 * 24)) : 999;
      
      const frequency = daysSinceLastLogin <= 1 ? 'Very Active' :
                       daysSinceLastLogin <= 7 ? 'Active' :
                       daysSinceLastLogin <= 30 ? 'Moderate' : 'Inactive';
      
      loginFrequencyDistribution[frequency]++;
    });

    return NextResponse.json({
      success: true,
      timeRange: days,
      analytics: {
        overview: {
          totalStaff,
          totalWriters: writers.length,
          totalManagers: managers.length,
          totalAdmins: admins.length,
          activeStaffThisMonth: staff.filter(s => 
            s.lastLogin && new Date(s.lastLogin) >= startDate
          ).length,
          totalModerationActions: totalBlogsApproved + totalBlogsRejected + totalBlogsTrashed + totalBlogsReposted,
          avgDecisionImpact: totalStaff > 0 ? 
            (totalBlogsApproved + totalBlogsRejected + totalBlogsTrashed + totalBlogsReposted) / totalStaff : 0,
          totalBlogsApproved,
          totalBlogsRejected,
          totalBlogsTrashed,
          totalBlogsReposted,
          totalToolsApproved,
          avgActivityPerStaff: totalStaff > 0 ? 
            ((recentBlogs.length + reviews.length + recentViewsData.length * 0.1) / totalStaff).toFixed(1) : 0,
          avgModerationActionsPerStaff: totalStaff > 0 ?
            ((totalBlogsApproved + totalBlogsRejected + totalBlogsTrashed + totalBlogsReposted) / totalStaff).toFixed(1) : 0
        },
        roleStats,
        rolePerformance: roleStats,
        staffLeaderboard: sortedStaffLeaderboard,
        mostActiveStaff,
        dailyStats,
        recentActivity: recentActivities.slice(0, 30),
        recentLogins,
        newStaffMembers,
        inactiveWriters,
        staleDrafts,
        staffByRole: {
          writers: writers.map(w => ({
            _id: w._id,
            name: w.name,
            email: w.email,
            image: w.image,
            lastLogin: w.lastLogin,
            createdAt: w.createdAt
          })),
          managers: managers.map(m => ({
            _id: m._id,
            name: m.name,
            email: m.email,
            image: m.image,
            lastLogin: m.lastLogin,
            createdAt: m.createdAt
          })),
          admins: admins.map(a => ({
            _id: a._id,
            name: a.name,
            email: a.email,
            image: a.image,
            lastLogin: a.lastLogin,
            createdAt: a.createdAt
          }))
        },
        loginFrequency: loginFrequencyDistribution,
        loginFrequencyDistribution
      }
    });

  } catch (error) {
    console.error('Staff Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch staff analytics data' },
      { status: 500 }
    );
  }
}

// Helper function to get action configuration for UI display
function getActionConfig(action, type) {
  const configs = {
    // User Management
    'user_management_role_changed': {
      icon: '👤',
      color: 'blue',
      description: 'Changed user role',
      category: 'User Management'
    },
    'user_management_blocked': {
      icon: '🚫',
      color: 'red',
      description: 'Blocked user account',
      category: 'User Management'
    },
    'user_management_unblocked': {
      icon: '✅',
      color: 'green',
      description: 'Unblocked user account',
      category: 'User Management'
    },
    'user_management_profile_updated': {
      icon: '✏️',
      color: 'purple',
      description: 'Updated user profile',
      category: 'User Management'
    },
    'user_management_data_modified': {
      icon: '🔧',
      color: 'orange',
      description: 'Modified user data',
      category: 'User Management'
    },
    'user_management_account_deleted': {
      icon: '🗑️',
      color: 'red',
      description: 'Deleted user account',
      category: 'User Management'
    },

    // Tool Management
    'tool_management_created': {
      icon: '🛠️',
      color: 'green',
      description: 'Created new tool',
      category: 'Tool Management'
    },
    'tool_management_updated': {
      icon: '✏️',
      color: 'blue',
      description: 'Updated tool information',
      category: 'Tool Management'
    },
    'tool_management_deleted': {
      icon: '🗑️',
      color: 'red',
      description: 'Deleted tool',
      category: 'Tool Management'
    },

    // Review Management
    'review_management_hidden': {
      icon: '👁️',
      color: 'orange',
      description: 'Hidden review',
      category: 'Review Management'
    },
    'review_management_restored': {
      icon: '🔄',
      color: 'green',
      description: 'Restored review',
      category: 'Review Management'
    },
    'review_management_deleted': {
      icon: '🗑️',
      color: 'red',
      description: 'Deleted review',
      category: 'Review Management'
    },
    'review_management_replied': {
      icon: '💬',
      color: 'blue',
      description: 'Replied to review',
      category: 'Review Management'
    },

    // Blog Management
    'blog_moderation_approved': {
      icon: '✅',
      color: 'green',
      description: 'Approved blog post',
      category: 'Blog Moderation'
    },
    'blog_moderation_rejected': {
      icon: '❌',
      color: 'red',
      description: 'Rejected blog post',
      category: 'Blog Moderation'
    },
    'blog_moderation_moved_to_trash': {
      icon: '🗑️',
      color: 'orange',
      description: 'Moved blog to trash',
      category: 'Blog Moderation'
    },
    'blog_moderation_restored': {
      icon: '🔄',
      color: 'green',
      description: 'Restored blog post',
      category: 'Blog Moderation'
    },
    'blog_creation_created': {
      icon: '✍️',
      color: 'purple',
      description: 'Created blog post',
      category: 'Blog Creation'
    },
    'blog_creation_updated': {
      icon: '✏️',
      color: 'blue',
      description: 'Updated blog post',
      category: 'Blog Creation'
    }
  };

  const key = `${type}_${action}`;
  return configs[key] || {
    icon: '📝',
    color: 'gray',
    description: `${action} on ${type}`,
    category: type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  };
} 