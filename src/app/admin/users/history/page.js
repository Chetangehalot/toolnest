'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import {
  ClockIcon,
  MagnifyingGlassIcon,
  DocumentArrowDownIcon,
  ArrowLeftIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

const TableView = ({ activities }) => {
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRowExpansion = (activityId) => {
    setExpandedRow(expandedRow === activityId ? null : activityId);
  };

  const getActionBadge = (action) => {
    const actionConfig = {
      'role_changed': { color: 'bg-orange-500/20 text-orange-400', icon: '🔄' },
      'blocked': { color: 'bg-red-500/20 text-red-400', icon: '🚫' },
      'unblocked': { color: 'bg-green-500/20 text-green-400', icon: '✅' },
      'profile_updated': { color: 'bg-blue-500/20 text-blue-400', icon: '✏️' },
      'data_modified': { color: 'bg-purple-500/20 text-purple-400', icon: '📝' },
      'account_deleted': { color: 'bg-red-600/20 text-red-500', icon: '🗑️' }
    };

    const config = actionConfig[action] || { color: 'bg-gray-500/20 text-gray-400', icon: '❓' };
    
    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${config.color} flex items-center gap-1`}>
        <span>{config.icon}</span>
        {action.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      'admin': 'bg-[#F59E0B]/20 text-[#F59E0B]',
      'manager': 'bg-[#10B981]/20 text-[#10B981]',
      'writer': 'bg-[#B936F4]/20 text-[#B936F4]',
      'user': 'bg-[#6B7280]/20 text-[#6B7280]',
      'system': 'bg-[#6B7280]/20 text-[#6B7280]'
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${roleConfig[role] || roleConfig.user}`}>
        {role || 'user'}
      </span>
    );
  };

  return (
    <div className="bg-[#0A0F24]/30 border border-[#00FFE0]/10 rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#0A0F24]/50 border-b border-[#00FFE0]/10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#00FFE0] uppercase tracking-wider">
                Date/Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#00FFE0] uppercase tracking-wider">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#00FFE0] uppercase tracking-wider">
                Target User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#00FFE0] uppercase tracking-wider">
                Performed By
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#00FFE0] uppercase tracking-wider">
                Details
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#00FFE0] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#00FFE0]/10">
            {activities.map((activity) => (
              <>
                <tr key={activity._id} className="hover:bg-[#0A0F24]/20 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-[#F5F5F5]">
                      {new Date(activity.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-xs text-[#CFCFCF]">
                      {new Date(activity.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getActionBadge(activity.action)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="text-sm font-medium text-[#F5F5F5] flex items-center gap-1">
                          {activity.targetUser?.name || 'Unknown'}
                          {activity.originalNames?.targetUser && 
                           activity.originalNames.targetUser !== activity.targetUser?.name && (
                            <span className="text-xs text-yellow-400 bg-yellow-500/10 px-1 py-0.5 rounded" title={`Originally: ${activity.originalNames.targetUser}`}>
                              ✏️
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#CFCFCF]">
                          {activity.targetUser?.email || 'unknown@email.com'}
                        </div>
                      </div>
                      {getRoleBadge(activity.targetUser?.role)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="text-sm font-medium text-[#00FFE0] flex items-center gap-1">
                          {activity.performedBy?.name || 'Unknown'}
                          {activity.originalNames?.performedBy && 
                           activity.originalNames.performedBy !== activity.performedBy?.name && (
                            <span className="text-xs text-yellow-400 bg-yellow-500/10 px-1 py-0.5 rounded" title={`Originally: ${activity.originalNames.performedBy}`}>
                              ✏️
                            </span>
                          )}
                        </div>
                      </div>
                      {getRoleBadge(activity.performedBy?.role)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-[#F5F5F5] max-w-xs truncate">
                      {activity.details?.description || activity.reason || 'No details'}
                    </div>
                    {activity.changes && activity.changes.length > 0 && (
                      <div className="text-xs text-[#CFCFCF] mt-1">
                        {activity.changes.length} field(s) changed
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleRowExpansion(activity._id)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-[#00FFE0] hover:bg-[#00FFE0]/10 rounded transition-colors"
                    >
                      <EyeIcon className="w-3 h-3" />
                      Details
                      {expandedRow === activity._id ? (
                        <ChevronUpIcon className="w-3 h-3" />
                      ) : (
                        <ChevronDownIcon className="w-3 h-3" />
                      )}
                    </button>
                  </td>
                </tr>
                {expandedRow === activity._id && (
                  <tr>
                    <td colSpan="6" className="px-4 py-4 bg-[#0A0F24]/20">
                      <div className="space-y-4">
                        {/* Reason */}
                        {activity.reason && (
                          <div>
                            <h4 className="text-sm font-medium text-[#00FFE0] mb-1">Reason:</h4>
                            <p className="text-sm text-[#CFCFCF]">{activity.reason}</p>
                          </div>
                        )}

                        {/* Field Changes */}
                        {activity.changes && activity.changes.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-[#00FFE0] mb-2">Field Changes:</h4>
                            <div className="space-y-2">
                              {activity.changes.map((change, index) => (
                                <div key={index} className="flex items-start gap-2 text-sm">
                                  <span className="text-[#CFCFCF] font-medium min-w-[80px] capitalize">
                                    {change.field.replace('_', ' ')}:
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-red-400 bg-red-500/10 px-2 py-1 rounded text-xs">
                                      {JSON.stringify(change.oldValue) || 'null'}
                                    </span>
                                    <span className="text-[#CFCFCF]">→</span>
                                    <span className="text-green-400 bg-green-500/10 px-2 py-1 rounded text-xs">
                                      {JSON.stringify(change.newValue) || 'null'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Metadata */}
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-[#00FFE0] mb-2">Technical Details:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#CFCFCF]">
                              {activity.metadata.ipAddress && activity.metadata.ipAddress !== 'system' && (
                                <div>
                                  <span className="font-medium">IP Address:</span> {activity.metadata.ipAddress}
                                </div>
                              )}
                              {activity.metadata.userAgent && activity.metadata.userAgent !== 'system' && (
                                <div>
                                  <span className="font-medium">Browser:</span> {activity.metadata.userAgent.split(' ')[0]}
                                </div>
                              )}
                              {activity.metadata.sessionId && (
                                <div>
                                  <span className="font-medium">Session:</span> {activity.metadata.sessionId}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Name Changes */}
                        {activity.originalNames && (
                          (activity.originalNames.targetUser !== activity.targetUser?.name || 
                           activity.originalNames.performedBy !== activity.performedBy?.name) && (
                          <div>
                            <h4 className="text-sm font-medium text-[#00FFE0] mb-2">Name Updates Since Action:</h4>
                            <div className="space-y-1 text-xs text-[#CFCFCF]">
                              {activity.originalNames.targetUser !== activity.targetUser?.name && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Target User:</span>
                                  <span className="text-red-400">{activity.originalNames.targetUser}</span>
                                  <span>→</span>
                                  <span className="text-green-400">{activity.targetUser?.name}</span>
                                </div>
                              )}
                              {activity.originalNames.performedBy !== activity.performedBy?.name && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Performed By:</span>
                                  <span className="text-red-400">{activity.originalNames.performedBy}</span>
                                  <span>→</span>
                                  <span className="text-green-400">{activity.performedBy?.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function UserManagementHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('30');
  const [staffMembers, setStaffMembers] = useState([]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (session.user.role !== 'admin' && session.user.role !== 'manager') {
      router.push('/dashboard');
      return;
    }

    fetchUserManagementHistory();
  }, [session, status, router, searchTerm, actionFilter, staffFilter, timeRange]);

  const fetchUserManagementHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        search: searchTerm,
        action: actionFilter,
        staff: staffFilter,
        days: timeRange
      });

      const response = await fetch(`/api/admin/users/history?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch user management history');
      }

      const data = await response.json();
      setActivities(data.activities || []);
      setStaffMembers(data.staffMembers || []);
    } catch (error) {
      console.error('Error fetching user management history:', error);
      setError('Failed to load user management history');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!activities.length) return;

    const csvData = activities.map(activity => {
      // Base activity data
      const baseData = {
        'Date': new Date(activity.timestamp).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        'Time': new Date(activity.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        'Full Timestamp': new Date(activity.timestamp).toISOString(),
        'Action Type': activity.action.replace(/_/g, ' ').toUpperCase(),
        'Action Description': activity.details?.description || activity.reason || 'N/A',
        'Status': activity.status || 'completed',
        
        // Target User Information
        'Target User ID': activity.targetUser?._id || 'N/A',
        'Target User Name': activity.targetUser?.name || 'Unknown',
        'Target User Email': activity.targetUser?.email || 'unknown@email.com',
        'Target User Role': activity.targetUser?.role || 'user',
        
        // Staff Member Information
        'Performed By ID': activity.performedBy?._id || 'N/A',
        'Performed By Name': activity.performedBy?.name || 'Unknown',
        'Performed By Role': activity.performedBy?.role || 'unknown',
        
        // Action Details
        'Reason': activity.reason || 'N/A',
        'Days Ago': Math.floor((new Date() - new Date(activity.timestamp)) / (1000 * 60 * 60 * 24)),
        
        // Metadata
        'IP Address': activity.metadata?.ipAddress || 'N/A',
        'User Agent': activity.metadata?.userAgent || 'N/A',
        'Session ID': activity.metadata?.sessionId || 'N/A',
      };

      // Add action-specific details
      switch (activity.action) {
        case 'role_changed':
          baseData['From Role'] = activity.details?.fromRole || 'N/A';
          baseData['To Role'] = activity.details?.toRole || 'N/A';
          baseData['Role Change Summary'] = activity.details?.description || 'N/A';
          break;
        
        case 'blocked':
        case 'unblocked':
          baseData['Previous Status'] = activity.details?.previousStatus || 'N/A';
          baseData['New Status'] = activity.details?.newStatus || 'N/A';
          baseData['Block/Unblock Details'] = activity.details?.description || 'N/A';
          break;
        
        case 'profile_updated':
        case 'data_modified':
          baseData['Fields Changed Count'] = activity.details?.changesCount || 0;
          baseData['Fields Changed'] = activity.details?.fieldsChanged?.join(', ') || 'N/A';
          baseData['Changes Summary'] = activity.details?.description || 'N/A';
          break;
        
        case 'account_deleted':
          baseData['Deleted User Name'] = activity.details?.deletedUser?.name || 'N/A';
          baseData['Deleted User Email'] = activity.details?.deletedUser?.email || 'N/A';
          baseData['Deleted User Role'] = activity.details?.deletedUser?.role || 'N/A';
          baseData['Deletion Details'] = activity.details?.description || 'N/A';
          break;
      }

      // Add detailed field changes
      if (activity.changes && activity.changes.length > 0) {
        activity.changes.forEach((change, index) => {
          const changeIndex = index + 1;
          baseData[`Change ${changeIndex} - Field`] = change.field || 'N/A';
          baseData[`Change ${changeIndex} - Old Value`] = typeof change.oldValue === 'object' 
            ? JSON.stringify(change.oldValue) 
            : (change.oldValue || 'null');
          baseData[`Change ${changeIndex} - New Value`] = typeof change.newValue === 'object' 
            ? JSON.stringify(change.newValue) 
            : (change.newValue || 'null');
        });
        
        // Add summary of all changes
        const changesSummary = activity.changes.map(change => 
          `${change.field}: "${change.oldValue}" → "${change.newValue}"`
        ).join(' | ');
        baseData['All Changes Summary'] = changesSummary;
      } else {
        baseData['All Changes Summary'] = 'No field changes recorded';
      }

      return baseData;
    });

    // Create CSV content with proper escaping
    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          const escapedValue = String(value).replace(/"/g, '""');
          return /[",\n\r]/.test(escapedValue) ? `"${escapedValue}"` : escapedValue;
        }).join(',')
      )
    ].join('\n');

    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Generate detailed filename with timestamp and filters
    const timestamp = new Date().toISOString().split('T')[0];
    const filterSuffix = actionFilter !== 'all' ? `-${actionFilter}` : '';
    const timeRangeSuffix = timeRange !== '30' ? `-${timeRange}days` : '';
    
    a.download = `user-management-audit-trail-${timestamp}${filterSuffix}${timeRangeSuffix}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="w-64 h-8 bg-[#00FFE0]/10 rounded-lg"></div>
              <div className="w-96 h-5 bg-[#00FFE0]/10 rounded-lg"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-full h-10 bg-[#00FFE0]/10 rounded-xl"></div>
                ))}
              </div>
              <div className="space-y-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="w-full h-24 bg-[#00FFE0]/10 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-[#F5F5F5] mb-4">Error Loading History</h2>
            <p className="text-[#CFCFCF] mb-6">{error}</p>
            <button
              onClick={fetchUserManagementHistory}
              className="px-6 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-all duration-200 font-semibold cursor-pointer hover:scale-105"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[#F5F5F5]">User Management History</h1>
              <p className="text-[#CFCFCF]">Track all user management activities and changes</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportCSV}
                disabled={!activities.length}
                className="flex items-center gap-2 px-4 py-3 bg-[#10B981]/20 backdrop-blur-lg border border-[#10B981]/20 text-[#10B981] rounded-xl hover:border-[#10B981]/40 transition-all duration-200 cursor-pointer hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                Export CSV
              </button>
              <Link 
                href="/admin/users"
                className="flex items-center gap-2 px-6 py-3 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 transition-all duration-200 cursor-pointer hover:scale-105"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Users
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#CFCFCF]" />
                  <input
                    type="text"
                    placeholder="Search users or staff..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] placeholder-[#CFCFCF] focus:border-[#00FFE0] focus:outline-none transition-all duration-200"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Action Type</label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] focus:border-[#00FFE0] focus:outline-none transition-all duration-200"
                >
                  <option value="all">All Actions</option>
                  <option value="role_changed">Role Changes</option>
                  <option value="blocked">User Blocks</option>
                  <option value="unblocked">User Unblocks</option>
                  <option value="profile_updated">Profile Updates</option>
                  <option value="data_modified">Data Modifications</option>
                  <option value="account_deleted">Account Deletions</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Staff Member</label>
                <select
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] focus:border-[#00FFE0] focus:outline-none transition-all duration-200"
                >
                  <option value="all">All Staff</option>
                  {staffMembers.map(staff => (
                    <option key={staff._id} value={staff._id}>
                      {staff.name} ({staff.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Time Range</label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="w-full px-4 py-2 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] focus:border-[#00FFE0] focus:outline-none transition-all duration-200"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 3 months</option>
                  <option value="365">Last year</option>
                  <option value="all">All time</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setActionFilter('all');
                    setStaffFilter('all');
                    setTimeRange('30');
                  }}
                  className="w-full px-4 py-2 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-all duration-200 font-semibold cursor-pointer hover:scale-105"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Activities List */}
          <div className="space-y-4">
            {activities.length > 0 ? (
              <TableView activities={activities} />
            ) : (
              <div className="text-center py-12 bg-[#0A0F24]/30 border border-[#00FFE0]/10 rounded-2xl">
                <ClockIcon className="w-16 h-16 text-[#CFCFCF] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#F5F5F5] mb-2">No Activities Found</h3>
                <p className="text-[#CFCFCF]">
                  {searchTerm || actionFilter !== 'all' || staffFilter !== 'all' 
                    ? 'Try adjusting your filters to see more results.'
                    : 'No user management activities have been recorded yet.'}
                </p>
              </div>
            )}
          </div>

          {/* Summary */}
          {activities.length > 0 && (
            <div className="mt-8 p-4 bg-[#0A0F24]/30 border border-[#00FFE0]/10 rounded-xl">
              <div className="flex items-center justify-between text-sm text-[#CFCFCF]">
                <span>Showing {activities.length} activities</span>
                <span>
                  Time range: {timeRange === 'all' ? 'All time' : `Last ${timeRange} days`}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 