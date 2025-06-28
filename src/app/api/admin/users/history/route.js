import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-simple';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import AuditLog from '@/models/AuditLog';

export async function GET(request) {
  try {
    // Try to get session with better error handling
    let session;
    try {
      session = await getServerSession(authOptions);
    } catch (sessionError) {
      console.error('❌ Session error:', sessionError);
      return NextResponse.json({ error: 'Session error', details: sessionError.message }, { status: 500 });
    }
    
    if (!session) {
      return NextResponse.json({ error: 'No session found. Please login first.' }, { status: 401 });
    }
    
    if (session.user.role !== 'admin' && session.user.role !== 'manager') {
      return NextResponse.json({ error: 'Insufficient permissions. Admin or Manager access required.' }, { status: 403 });
    }

    try {
      await connectToDatabase();
    } catch (dbError) {
      console.error('❌ Database connection error:', dbError);
      return NextResponse.json({ error: 'Database connection failed', details: dbError.message }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const action = searchParams.get('action') || 'all';
    const staff = searchParams.get('staff') || 'all';
    const days = searchParams.get('days') || '30';

    // Calculate date range
    const startDate = new Date();
    if (days !== 'all') {
      startDate.setDate(startDate.getDate() - parseInt(days));
    } else {
      startDate.setFullYear(2020); // Far back date for "all time"
    }

    // Get all staff members for filtering
    let staffMembers = [];
    try {
      staffMembers = await User.find({
        role: { $in: ['admin', 'manager', 'writer'] }
      }, 'name email role').lean();
    } catch (staffError) {
      console.error('❌ Error fetching staff members:', staffError);
      // Continue without staff members
    }

    const activities = [];

    // 1. FIRST: Fetch from centralized AuditLog collection (this preserves logs even after entity deletion)
    try {
      const dateFilter = days !== 'all' ? { timestamp: { $gte: startDate } } : {};
      const auditLogs = await AuditLog.find({
        type: 'user_management',
        ...dateFilter
      }).sort({ timestamp: -1 }).lean();

      // Get all user IDs from audit logs for current user info lookup
      const userIds = new Set();
      auditLogs.forEach(log => {
        if (log.targetId) userIds.add(log.targetId.toString());
        if (log.performedBy?._id) userIds.add(log.performedBy._id.toString());
      });

      // Fetch current user information
      const currentUsers = await User.find({
        _id: { $in: Array.from(userIds) }
      }, 'name email role').lean();

      const currentUserInfo = {};
      currentUsers.forEach(user => {
        currentUserInfo[user._id.toString()] = {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        };
      });

      // Process centralized audit logs
      auditLogs.forEach(log => {
        // Get current user info or use stored/historical info
        const currentTargetUser = currentUserInfo[log.targetId?.toString()] || {
          _id: log.targetId,
          name: log.targetName || 'Deleted User',
          email: log.details?.deletedUserInfo?.email || 'unknown@email.com',
          role: log.details?.deletedUserInfo?.role || 'unknown'
        };

        const currentPerformer = currentUserInfo[log.performedBy?._id?.toString()] || {
          _id: log.performedBy?._id,
          name: log.performedBy?.name || 'Unknown User',
          role: log.performedBy?.role || 'unknown'
        };

        // Create activity object
        const activity = {
          _id: `central-${log._id}`,
          type: 'user_management',
          action: log.action,
          timestamp: log.timestamp,
          status: 'completed',
          targetUser: currentTargetUser,
          performedBy: currentPerformer,
          reason: log.reason,
          changes: log.changes || [],
          metadata: log.metadata || {},
          source: 'centralized_audit',
          // Store original names for reference
          originalNames: {
            targetUser: log.targetName,
            performedBy: log.performedBy?.name
          }
        };

        // Add detailed information based on action type
        switch (log.action) {
          case 'role_changed':
            const roleChange = log.changes?.find(c => c.field === 'role');
            if (roleChange) {
              activity.details = {
                fromRole: roleChange.oldValue,
                toRole: roleChange.newValue,
                description: `Role changed from ${roleChange.oldValue} to ${roleChange.newValue}`
              };
            }
            break;
          
          case 'blocked':
          case 'unblocked':
            activity.details = {
              description: `User account ${log.action}`,
              previousStatus: log.action === 'blocked' ? 'active' : 'blocked',
              newStatus: log.action === 'blocked' ? 'blocked' : 'active'
            };
            break;
          
          case 'profile_updated':
          case 'data_modified':
            activity.details = {
              fieldsChanged: log.changes?.map(c => c.field) || [],
              changesCount: log.changes?.length || 0,
              description: `${log.changes?.length || 0} field(s) modified: ${log.changes?.map(c => c.field).join(', ') || 'Unknown'}`
            };
            break;
          
          case 'account_deleted':
            activity.details = {
              description: 'User account permanently deleted',
              deletedUser: log.details?.deletedUserInfo || {
                name: log.targetName,
                email: 'unknown@email.com',
                role: 'unknown'
              }
            };
            break;
        }

        activities.push(activity);
      });

    } catch (auditError) {
      console.error('❌ Error fetching centralized audit logs:', auditError);
      // Continue with legacy logs as fallback
    }

    // 2. SECOND: Fetch from legacy embedded audit logs (for backward compatibility)
    let users = [];
    try {
      // First try to get users with recent audit logs
      const dateFilter = days !== 'all' ? { 'auditLog.timestamp': { $gte: startDate } } : { auditLog: { $exists: true, $ne: [] } };
      users = await User.find(dateFilter).lean();
      
              // Found users with legacy audit logs

      // Create a map of all user IDs we'll need to fetch current info for
      const allUserIds = new Set();
      
      // First pass: collect all user IDs from audit logs
      users.forEach(user => {
        if (user.auditLog && user.auditLog.length > 0) {
          user.auditLog
            .filter(log => {
              if (days !== 'all') {
                return new Date(log.timestamp) >= startDate;
              }
              return true;
            })
            .forEach(log => {
              allUserIds.add(user._id.toString()); // Target user
              if (log.performedBy) {
                allUserIds.add(log.performedBy.toString()); // Performer
              }
            });
        }
      });

      // Fetch current information for all users involved
              // Fetching current user information
      const currentUserInfo = {};
      try {
        const currentUsers = await User.find({
          _id: { $in: Array.from(allUserIds) }
        }, 'name email role').lean();
        
        currentUsers.forEach(user => {
          currentUserInfo[user._id.toString()] = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          };
        });
        // Fetched current user information
      } catch (fetchError) {
        console.error('❌ Error fetching current user info:', fetchError);
        // Continue with stored info as fallback
      }

      // Process audit logs from all users
      users.forEach(user => {
        if (user.auditLog && user.auditLog.length > 0) {
          user.auditLog
            .filter(log => {
              // For recent logs, filter by date
              if (days !== 'all') {
                return new Date(log.timestamp) >= startDate;
              }
              return true; // For 'all', include all logs
            })
            .forEach(log => {
              // Skip if we already have this from centralized logs
              const existingCentralLog = activities.find(a => 
                a.source === 'centralized_audit' && 
                a.targetUser._id?.toString() === user._id.toString() &&
                a.action === log.action &&
                Math.abs(new Date(a.timestamp) - new Date(log.timestamp)) < 5000 // Within 5 seconds
              );
              
              if (existingCentralLog) {
                return; // Skip duplicate
              }

              // Get current user info or fallback to stored info
              const currentTargetUser = currentUserInfo[user._id.toString()] || {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
              };

              const currentPerformer = currentUserInfo[log.performedBy?.toString()] || {
                _id: log.performedBy,
                name: log.performedByName,
                role: log.performedByRole
              };

              // Create activity object with current user information
              const activity = {
                _id: `legacy-${user._id}-${log._id || Date.now()}`,
                type: 'user_management',
                action: log.action,
                timestamp: log.timestamp,
                status: 'completed',
                targetUser: currentTargetUser,
                performedBy: currentPerformer,
                reason: log.reason,
                changes: log.changes || [],
                metadata: log.metadata || {},
                source: 'legacy_audit',
                // Store original names for reference if needed
                originalNames: {
                  targetUser: user.name,
                  performedBy: log.performedByName
                }
              };

              // Add detailed information based on action type
              switch (log.action) {
                case 'role_changed':
                  const roleChange = log.changes?.find(c => c.field === 'role');
                  if (roleChange) {
                    activity.details = {
                      fromRole: roleChange.oldValue,
                      toRole: roleChange.newValue,
                      description: `Role changed from ${roleChange.oldValue} to ${roleChange.newValue}`
                    };
                  }
                  break;
                
                case 'blocked':
                case 'unblocked':
                  activity.details = {
                    description: `User account ${log.action}`,
                    previousStatus: log.action === 'blocked' ? 'active' : 'blocked',
                    newStatus: log.action === 'blocked' ? 'blocked' : 'active'
                  };
                  break;
                
                case 'profile_updated':
                case 'data_modified':
                  activity.details = {
                    fieldsChanged: log.changes?.map(c => c.field) || [],
                    changesCount: log.changes?.length || 0,
                    description: `${log.changes?.length || 0} field(s) modified: ${log.changes?.map(c => c.field).join(', ') || 'Unknown'}`
                  };
                  break;
                
                case 'account_deleted':
                  activity.details = {
                    description: 'User account permanently deleted',
                    deletedUser: {
                      name: user.name,
                      email: user.email,
                      role: user.role
                    }
                  };
                  break;
              }

              activities.push(activity);
            });
        }
      });

    } catch (userError) {
      console.error('❌ Error fetching legacy audit logs:', userError);
      // Continue without legacy logs
    }

    // Processed all activities

    // Apply filters
    let filteredActivities = activities;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredActivities = filteredActivities.filter(activity => 
        activity.targetUser?.name.toLowerCase().includes(searchLower) ||
        activity.targetUser?.email.toLowerCase().includes(searchLower) ||
        activity.performedBy?.name.toLowerCase().includes(searchLower) ||
        activity.reason?.toLowerCase().includes(searchLower) ||
        activity.details?.description?.toLowerCase().includes(searchLower)
      );
    }

    // Action filter
    if (action !== 'all') {
      filteredActivities = filteredActivities.filter(activity => 
        activity.action === action
      );
    }

    // Staff filter
    if (staff !== 'all') {
      filteredActivities = filteredActivities.filter(activity => 
        activity.performedBy?._id?.toString() === staff
      );
    }

    // Sort by timestamp (most recent first)
    filteredActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Limit results for performance
    const limitedActivities = filteredActivities.slice(0, 200);

    // Calculate statistics
    const stats = {
      totalActivities: filteredActivities.length,
      actionBreakdown: {},
      staffBreakdown: {},
      timeRange: days
    };

    // Count actions
    filteredActivities.forEach(activity => {
      stats.actionBreakdown[activity.action] = (stats.actionBreakdown[activity.action] || 0) + 1;
      const staffName = activity.performedBy?.name || 'Unknown';
      stats.staffBreakdown[staffName] = (stats.staffBreakdown[staffName] || 0) + 1;
    });

    // Returning processed activities

    return NextResponse.json({
      success: true,
      activities: limitedActivities,
      staffMembers,
      stats,
      message: 'User management history loaded successfully'
    });

  } catch (error) {
    console.error('❌ User Management History API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch user management history', 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 