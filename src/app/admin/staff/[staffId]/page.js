'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UserIcon, 
  WrenchScrewdriverIcon, 
  ChatBubbleLeftRightIcon, 
  DocumentTextIcon,
  CalendarIcon,
  ChartBarIcon,
  ClockIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import Layout from '@/components/layout/Layout';

const AnalyticsCard = ({ title, value, icon: Icon, color = "text-[#00FFE0]", bgColor = "from-[#00FFE0]/20 to-[#B936F4]/20" }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    className="text-center p-4 bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/20 rounded-xl"
  >
    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${bgColor} flex items-center justify-center mx-auto mb-3`}>
      <Icon className={`w-6 h-6 ${color}`} />
    </div>
    <div className={`${color} text-3xl font-bold mb-2`}>{value}</div>
    <div className="text-[#CFCFCF] text-sm font-medium">{title}</div>
  </motion.div>
);

const ActivityTableRow = ({ activity, getActionIcon, getActionColor, getActionDescription }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getActionBadge = (action, entityType) => {
    const actionConfig = {
      'role_changed': { color: 'bg-orange-500/20 text-orange-400', icon: '🔄' },
      'blocked': { color: 'bg-red-500/20 text-red-400', icon: '🚫' },
      'unblocked': { color: 'bg-green-500/20 text-green-400', icon: '✅' },
      'profile_updated': { color: 'bg-blue-500/20 text-blue-400', icon: '✏️' },
      'data_modified': { color: 'bg-purple-500/20 text-purple-400', icon: '🔧' },
      'account_deleted': { color: 'bg-red-600/20 text-red-500', icon: '🗑️' },
      'created': { color: 'bg-green-500/20 text-green-400', icon: '🛠️' },
      'updated': { color: 'bg-blue-500/20 text-blue-400', icon: '✏️' },
      'deleted': { color: 'bg-red-500/20 text-red-400', icon: '🗑️' },
      'hidden': { color: 'bg-orange-500/20 text-orange-400', icon: '👁️' },
      'restored': { color: 'bg-green-500/20 text-green-400', icon: '🔄' },
      'replied': { color: 'bg-blue-500/20 text-blue-400', icon: '💬' },
      'approved': { color: 'bg-green-500/20 text-green-400', icon: '✅' },
      'rejected': { color: 'bg-red-500/20 text-red-400', icon: '❌' },
      'moved_to_trash': { color: 'bg-red-500/20 text-red-400', icon: '🗑️' }
    };

    const config = actionConfig[action] || { color: 'bg-gray-500/20 text-gray-400', icon: '❓' };
    
    return (
      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${config.color} flex items-center gap-1`}>
        <span>{config.icon}</span>
        {action.replace(/_/g, ' ').toUpperCase()}
      </span>
    );
  };

  const getEntityTypeBadge = (entityType) => {
    const typeConfig = {
      'user': 'bg-blue-500/20 text-blue-400',
      'tool': 'bg-purple-500/20 text-purple-400',
      'review': 'bg-orange-500/20 text-orange-400',
      'blog': 'bg-indigo-500/20 text-indigo-400'
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${typeConfig[entityType] || 'bg-gray-500/20 text-gray-400'}`}>
        {entityType || 'unknown'}
      </span>
    );
  };

  return (
    <>
      <tr className="hover:bg-[#0A0F24]/20 transition-colors">
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
          {getActionBadge(activity.action, activity.entityType)}
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          {getEntityTypeBadge(activity.entityType)}
        </td>
        <td className="px-4 py-4">
          <div className="text-sm font-medium text-[#F5F5F5]">
            {activity.entityName || 'N/A'}
          </div>
        </td>
        <td className="px-4 py-4">
          <div className="text-sm text-[#F5F5F5] max-w-xs truncate">
            {getActionDescription(activity)}
                </div>
          {Array.isArray(activity.details?.changes) && activity.details.changes.length > 0 && (
            <div className="text-xs text-[#CFCFCF] mt-1">
              {activity.details.changes.length} field(s) changed
              </div>
          )}
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[#00FFE0] hover:bg-[#00FFE0]/10 rounded transition-colors"
          >
            <EyeIcon className="w-3 h-3" />
            Details
            {isExpanded ? (
              <ChevronUpIcon className="w-3 h-3" />
            ) : (
              <ChevronDownIcon className="w-3 h-3" />
            )}
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan="6" className="px-4 py-4 bg-[#0A0F24]/20 max-w-screen-lg overflow-x-auto">
            <div className="space-y-4">
              {/* Additional Details */}
              {activity.details && Object.keys(activity.details).length > 0 && !Array.isArray(activity.details?.changes) && (
                <div>
                  <h4 className="text-sm font-medium text-[#00FFE0] mb-2">Additional Details:</h4>
                  <div className="bg-[#0A0F24]/30 rounded-lg p-4 space-y-3">
                    {Object.entries(activity.details).map(([key, value]) => {
                      if (key === 'changes') return null;
                      const displayKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                      let displayValue = value;
                      let valueType = 'text';
                      if (typeof value === 'number') {
                        valueType = 'number';
                      } else if (typeof value === 'boolean') {
                        valueType = 'boolean';
                        displayValue = value ? 'Yes' : 'No';
                      } else if (Array.isArray(value)) {
                        valueType = 'array';
                      } else if (typeof value === 'object' && value !== null) {
                        valueType = 'object';
                        displayValue = JSON.stringify(value, null, 2);
                      } else if (typeof value === 'string') {
                        if (value.length > 100) {
                          displayValue = value.substring(0, 100) + '...';
                          valueType = 'long-text';
                        }
                      }
                      return (
                        <div key={key} className="flex items-start gap-3">
                          <span className="text-[#CFCFCF] font-medium min-w-[120px] text-sm capitalize">
                            {displayKey}:
                          </span>
                          <div className="flex-1 break-all">
                            {valueType === 'array' ? (
                              <div className="space-y-2">
            <div className="text-[#CFCFCF] text-sm">
                                  {value.length} item{value.length !== 1 ? 's' : ''}:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {value.map((item, index) => (
                                    <span 
                                      key={index}
                                      className="px-2 py-1 bg-[#0A0F24]/50 text-[#00FFE0] text-xs rounded border border-[#00FFE0]/20 break-all"
                                    >
                                      {item}
                </span>
                                  ))}
                                </div>
                              </div>
                            ) : valueType === 'object' ? (
                              <pre className="text-[#CFCFCF] text-xs whitespace-pre-wrap bg-[#0A0F24]/50 p-2 rounded border border-[#00FFE0]/10 max-h-48 overflow-auto break-all">
                                {displayValue}
                              </pre>
                            ) : valueType === 'long-text' ? (
                              <div>
                                <span className="text-[#CFCFCF] text-sm break-all">{displayValue}</span>
                                <button 
                                  onClick={() => {
                                    const fullText = value;
                                    const truncatedText = value.substring(0, 100) + '...';
                                    const element = document.querySelector(`[data-key="${key}"]`);
                                    if (element) {
                                      element.textContent = element.textContent === truncatedText ? fullText : truncatedText;
                                    }
                                  }}
                                  className="ml-2 text-[#00FFE0] text-xs hover:underline"
                                >
                                  Show {value.length > 100 ? 'more' : 'less'}
                                </button>
                              </div>
                            ) : valueType === 'number' ? (
                              <span className="text-green-400 font-semibold text-sm">{displayValue}</span>
                            ) : valueType === 'boolean' ? (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                displayValue === 'Yes' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                                {displayValue}
                </span>
                            ) : (
                              <span className="text-[#CFCFCF] text-sm break-all">{displayValue}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Field Changes - Enhanced Display */}
              {((Array.isArray(activity.details?.changes) && activity.details.changes.length > 0) || 
               (Array.isArray(activity.changes) && activity.changes.length > 0)) && (
                <div>
                  <h4 className="text-sm font-medium text-[#00FFE0] mb-2">Field Changes:</h4>
                  <div className="bg-[#0A0F24]/30 rounded-lg p-4 overflow-x-auto">
                    <div className="space-y-3">
                      {(activity.details?.changes || activity.changes || []).map((change, index) => (
                        <div key={index} className="border border-[#00FFE0]/10 rounded-lg p-3 bg-[#0A0F24]/20">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[#00FFE0] font-semibold text-sm capitalize break-all">
                              {change.field.replace(/_/g, ' ')}:
                </span>
                            <span className="text-[#CFCFCF] text-xs bg-[#0A0F24]/50 px-2 py-1 rounded break-all">
                              Field #{index + 1}
                </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <span className="text-red-400 text-xs font-medium">Previous Value:</span>
                              <div className="mt-1 p-2 bg-red-500/10 border border-red-500/20 rounded text-sm break-all">
                                <span className="text-red-400 font-mono break-all">
                                  {change.oldValue === null || change.oldValue === undefined 
                                    ? 'null' 
                                    : typeof change.oldValue === 'object' 
                                      ? JSON.stringify(change.oldValue) 
                                      : String(change.oldValue)
                                  }
                </span>
                              </div>
                            </div>
                            <div>
                              <span className="text-green-400 text-xs font-medium">New Value:</span>
                              <div className="mt-1 p-2 bg-green-500/10 border border-green-500/20 rounded text-sm break-all">
                                <span className="text-green-400 font-mono break-all">
                                  {change.newValue === null || change.newValue === undefined 
                                    ? 'null' 
                                    : typeof change.newValue === 'object' 
                                      ? JSON.stringify(change.newValue) 
                                      : String(change.newValue)
                                  }
                </span>
            </div>
          </div>
        </div>
      </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div>
                <h4 className="text-sm font-medium text-[#00FFE0] mb-2">Technical Details:</h4>
                <div className="bg-[#0A0F24]/30 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {activity.ipAddress && (
                      <div className="flex items-center gap-2">
                        <span className="text-[#CFCFCF] font-medium min-w-[100px]">IP Address:</span>
                        <span className="text-[#F5F5F5] font-mono text-xs bg-[#0A0F24]/50 px-2 py-1 rounded break-all">
                          {activity.ipAddress}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-[#CFCFCF] font-medium min-w-[100px]">Date:</span>
                      <span className="text-[#F5F5F5] text-sm">
                        {new Date(activity.timestamp).toLocaleDateString('en-US', {
                          weekday: 'long',
            year: 'numeric',
                          month: 'long',
            day: 'numeric'
          })}
                      </span>
        </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#CFCFCF] font-medium min-w-[100px]">Time:</span>
                      <span className="text-[#F5F5F5] text-sm">
                        {new Date(activity.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
                          second: '2-digit',
            hour12: true
          })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#CFCFCF] font-medium min-w-[100px]">Activity ID:</span>
                      <span className="text-[#F5F5F5] font-mono text-xs bg-[#0A0F24]/50 px-2 py-1 rounded break-all">
                        {activity.id || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#CFCFCF] font-medium min-w-[100px]">ISO Timestamp:</span>
                      <span className="text-[#F5F5F5] font-mono text-xs bg-[#0A0F24]/50 px-2 py-1 rounded break-all">
                        {new Date(activity.timestamp).toISOString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#CFCFCF] font-medium min-w-[100px]">Time Ago:</span>
                      <span className="text-[#CFCFCF] text-sm">
                        {(() => {
                          const now = new Date();
                          const activityTime = new Date(activity.timestamp);
                          const diffInMs = now - activityTime;
                          const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
                          const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
                          const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
                          if (diffInMinutes < 1) return 'Just now';
                          if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
                          if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
                          return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
                        })()}
                      </span>
                    </div>
        </div>
        </div>
      </div>
    </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default function StaffAnalyticsPage({ params }) {
  const [staffData, setStaffData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTimeRange, setSelectedTimeRange] = useState(30);
  const [activeTab, setActiveTab] = useState('activity-log');
  const router = useRouter();

  const { staffId } = params;

  useEffect(() => {
    fetchStaffAnalytics();
  }, [staffId]);

  const fetchStaffAnalytics = async () => {
    try {
      setLoading(true);
      // Always fetch data for the longest period (365 days) and filter client-side
      const response = await fetch(`/api/admin/staff-analytics?staffId=${staffId}&days=365`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch staff analytics');
      }

      const data = await response.json();
      setStaffData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action, type) => {
    const iconMap = {
      'role_changed': '👤',
      'blocked': '🚫',
      'unblocked': '✅',
      'profile_updated': '✏️',
      'data_modified': '🔧',
      'account_deleted': '🗑️',
      'created': '🛠️',
      'updated': '✏️',
      'deleted': '🗑️',
      'hidden': '👁️',
      'restored': '🔄',
      'replied': '💬',
      'approved': '✅',
      'rejected': '❌',
      'moved_to_trash': '🗑️'
    };
    return iconMap[action] || '📝';
  };

  const getActionColor = (action, type) => {
    const colorMap = {
      'role_changed': 'text-blue-400',
      'blocked': 'text-red-400',
      'unblocked': 'text-green-400',
      'profile_updated': 'text-yellow-400',
      'data_modified': 'text-purple-400',
      'account_deleted': 'text-red-500',
      'created': 'text-green-400',
      'updated': 'text-blue-400',
      'deleted': 'text-red-400',
      'hidden': 'text-orange-400',
      'restored': 'text-green-400',
      'replied': 'text-blue-400',
      'approved': 'text-green-400',
      'rejected': 'text-red-400',
      'moved_to_trash': 'text-red-400'
    };
    return colorMap[action] || 'text-gray-400';
  };

  const getActionDescription = (activity) => {
    const { action, entityType, entityName, details, changes } = activity;
    
    // Handle role changes with proper field names
    if (action === 'role_changed') {
      // Check for role change in details object
      if (details?.fromRole && details?.toRole) {
        return `Changed role from ${details.fromRole} to ${details.toRole}`;
      }
      
      // Check for role change in changes array
      const roleChange = (changes || details?.changes || []).find(c => c.field === 'role');
      if (roleChange) {
        return `Changed role from ${roleChange.oldValue || 'unknown'} to ${roleChange.newValue || 'unknown'}`;
      }
      
      // Fallback if no specific role data found
      return `Changed user role`;
    }
    
    const descriptions = {
      'blocked': `Blocked user account`,
      'unblocked': `Unblocked user account`,
      'profile_updated': (() => {
        const profileChanges = changes || details?.changes || [];
        if (profileChanges.length > 0) {
          const fieldNames = profileChanges.map(c => c.field).join(', ');
          return `Updated profile information (${fieldNames})`;
        }
        return `Updated profile information`;
      })(),
      'data_modified': (() => {
        const dataChanges = changes || details?.changes || [];
        if (dataChanges.length > 0) {
          const fieldNames = dataChanges.map(c => c.field).join(', ');
          return `Modified ${entityType} data (${fieldNames})`;
        }
        return `Modified ${entityType} data`;
      })(),
      'account_deleted': `Deleted user account`,
      'created': `Created new ${entityType}`,
      'updated': `Updated ${entityType}`,
      'deleted': `Deleted ${entityType}`,
      'hidden': `Hidden ${entityType}`,
      'restored': `Restored ${entityType} from trash`,
      'replied': `Replied to ${entityType}`,
      'approved': `Approved ${entityType}`,
      'rejected': `Rejected ${entityType}`,
      'moved_to_trash': `Moved ${entityType} to trash`
    };
    
    return descriptions[action] || `Performed ${action.replace(/_/g, ' ')} on ${entityType}`;
  };

  const filteredActivities = staffData?.activities?.filter(activity => {
    // Time range filtering (client-side)
    const activityDate = new Date(activity.timestamp);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - selectedTimeRange);
    const withinTimeRange = activityDate >= cutoffDate;
    
    // Activity type filtering
    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'user_management' && activity.entityType === 'user') ||
      (selectedFilter === 'tool_management' && activity.entityType === 'tool') ||
      (selectedFilter === 'review_management' && activity.entityType === 'review') ||
      (selectedFilter === 'blog_management' && activity.entityType === 'blog'); // Combined blog filter
    
    // Search filtering
    const matchesSearch = !searchTerm || 
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.entityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getActionDescription(activity).toLowerCase().includes(searchTerm.toLowerCase());
    
    return withinTimeRange && matchesFilter && matchesSearch;
  }) || [];

  const exportToCSV = () => {
    // Enhanced headers with more detailed information
    const headers = [
      'Date',
      'Time', 
      'Action',
      'Entity Type',
      'Entity Name',
      'Description',
      'Performed By',
      'Reason',
      'IP Address',
      'Status',
      'Fields Changed',
      'Field Changes Details',
      'Additional Details',
      'Activity ID',
      'Timestamp (ISO)'
    ];
    
    // Helper function to escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    };
    
    // Format field changes for CSV
    const formatFieldChanges = (changes) => {
      if (!Array.isArray(changes) || changes.length === 0) return '';
      return changes.map(change => 
        `${change.field}: "${change.oldValue}" → "${change.newValue}"`
      ).join('; ');
    };
    
    // Format additional details for CSV
    const formatAdditionalDetails = (details) => {
      if (!details || typeof details !== 'object') return '';
      const filtered = { ...details };
      delete filtered.changes; // Remove changes as they're handled separately
      delete filtered.fieldsChanged; // Remove as it's redundant
      delete filtered.changesCount; // Remove as it's calculated
      
      if (Object.keys(filtered).length === 0) return '';
      return Object.entries(filtered)
        .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
        .join('; ');
    };

    const csvRows = filteredActivities.map(activity => {
      const activityDate = new Date(activity.timestamp);
      const changes = activity.changes || activity.details?.changes || [];
      const fieldsChanged = Array.isArray(changes) ? changes.map(c => c.field).join(', ') : '';
      
      return [
        escapeCSV(activityDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
        })),
        escapeCSV(activityDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
          second: '2-digit',
        hour12: true
        })),
        escapeCSV(activity.action || ''),
        escapeCSV(activity.entityType || ''),
        escapeCSV(activity.entityName || ''),
        escapeCSV(getActionDescription(activity)),
        escapeCSV(activity.performedBy || ''),
        escapeCSV(activity.reason || ''),
        escapeCSV(activity.ipAddress || ''),
        escapeCSV(activity.status || ''),
        escapeCSV(fieldsChanged),
        escapeCSV(formatFieldChanges(changes)),
        escapeCSV(formatAdditionalDetails(activity.details)),
        escapeCSV(activity.id || ''),
        escapeCSV(activityDate.toISOString())
      ].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Enhanced filename with timestamp and staff name
    const timestamp = new Date().toISOString().split('T')[0];
    const staffName = staffData.staffMember.name.replace(/[^a-zA-Z0-9]/g, '-');
    const timeRange = `${selectedTimeRange}days`;
    const totalRecords = filteredActivities.length;
    
    a.download = `staff-analytics-${staffName}-${timeRange}-${totalRecords}records-${timestamp}.csv`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-[#0A0F24] via-[#0F1629] to-[#1A1F3A]">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
              <div className="animate-pulse">
                <div className="h-8 bg-[#00FFE0]/20 rounded mb-4 w-64"></div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-32 bg-[#00FFE0]/10 rounded-xl"></div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-64 bg-[#00FFE0]/10 rounded-2xl"></div>
                  ))}
                </div>
                <div className="h-96 bg-[#00FFE0]/10 rounded-2xl"></div>
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
        <div className="min-h-screen bg-gradient-to-br from-[#0A0F24] via-[#0F1629] to-[#1A1F3A] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Analytics</h2>
            <p className="text-[#CFCFCF] mb-6">{error}</p>
            <div className="flex items-center gap-4 justify-center">
              <button
                onClick={fetchStaffAnalytics}
                className="px-6 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-colors font-semibold"
              >
                Retry
              </button>
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 px-6 py-3 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 hover:scale-105 transition-all duration-200 cursor-pointer"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Staff List
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!staffData) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-[#0A0F24] via-[#0F1629] to-[#1A1F3A] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">No Data Available</h2>
            <p className="text-[#CFCFCF] mb-6">No analytics data found for this staff member</p>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-6 py-3 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Staff List
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F24] via-[#0F1629] to-[#1A1F3A]">
        <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F5F5F5] to-[#CFCFCF] mb-4">
                  Staff Analytics
                </h1>
                {staffData.staffMember && (
                  <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-xl p-4 inline-flex items-center gap-4">
                    {staffData.staffMember.image && (
                      <img
                        src={staffData.staffMember.image}
                        alt={staffData.staffMember.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-[#00FFE0]/30"
                />
              )}
              <div>
                      <p className="text-[#F5F5F5] text-xl font-semibold">{staffData.staffMember.name}</p>
                      <p className="text-[#CFCFCF] text-sm">{staffData.staffMember.email}</p>
                      <p className="text-[#00FFE0] text-xs font-medium uppercase">{staffData.staffMember.role}</p>
                    </div>
              </div>
                )}
            </div>
            <div className="flex items-center gap-4">
              <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(parseInt(e.target.value))}
                  className="px-4 py-2 bg-[#0A0F24]/50 border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl focus:border-[#00FFE0]/40 focus:outline-none"
                >
                  <option value={7}>Last 7 days</option>
                  <option value={30}>Last 30 days</option>
                  <option value={90}>Last 90 days</option>
                  <option value={365}>Last year</option>
              </select>
              <button
                onClick={() => router.back()}
                  className="flex items-center gap-2 px-6 py-3 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 hover:scale-105 transition-all duration-200 cursor-pointer"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                  Back to Staff List
              </button>
            </div>
          </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <AnalyticsCard
                title="Total Actions"
                value={staffData.stats ? staffData.stats.totalActions : 0}
                icon={ChartBarIcon}
              color="text-[#00FFE0]"
              bgColor="from-[#00FFE0]/20 to-[#00D4AA]/20"
            />

              <AnalyticsCard
                title="User Management"
                value={staffData.stats ? staffData.stats.userManagement : 0}
                icon={UserIcon}
                color="text-green-400"
                bgColor="from-green-400/20 to-[#10B981]/20"
              />

              <AnalyticsCard
                title="Tool Management"
                value={staffData.stats ? staffData.stats.toolManagement : 0}
              icon={WrenchScrewdriverIcon}
                color="text-purple-400"
                bgColor="from-purple-400/20 to-[#8B5CF6]/20"
              />

              <AnalyticsCard
                title="Review Management"
                value={staffData.stats ? staffData.stats.reviewManagement : 0}
                icon={ChatBubbleLeftRightIcon}
                color="text-orange-400"
                bgColor="from-orange-400/20 to-[#F59E0B]/20"
              />

              <AnalyticsCard
                title="Blog Management"
                value={staffData.stats ? (staffData.stats.blogModeration + staffData.stats.blogCreation) : 0}
                icon={DocumentTextIcon}
                color="text-indigo-400"
                bgColor="from-indigo-400/20 to-[#6366F1]/20"
            />
          </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                <h3 className="text-[#F5F5F5] font-semibold mb-4">Activity Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[#CFCFCF]">Total Activities</span>
                    <span className="text-[#00FFE0] font-semibold">{staffData.stats?.totalActivities || filteredActivities.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#CFCFCF]">Avg Online per Day</span>
                    <span className="text-[#B936F4] font-semibold">
                      {staffData.stats?.avgOnlinePerDay || '0.0'} hrs
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#CFCFCF]">Last Login</span>
                    <span className={`font-semibold ${staffData.stats?.isOnline ? 'text-green-400' : 'text-orange-400'}`}>
                      {staffData.stats?.isOnline ? 
                        'Online' : 
                        (staffData.staffMember?.lastLogin ? 
                          new Date(staffData.staffMember.lastLogin).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }) : 'Never')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#CFCFCF]">Last Action</span>
                    <span className="text-yellow-400 font-semibold">
                      {staffData.stats?.lastActionTitle || 'No recent activity'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6">
                <h3 className="text-[#F5F5F5] font-semibold mb-4">Action Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[#CFCFCF]">Blog Moderation</span>
                    <span className="text-green-400 font-semibold">{staffData.stats?.blogModeration || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#CFCFCF]">Blog Creation</span>
                    <span className="text-blue-400 font-semibold">{staffData.stats?.blogCreation || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#CFCFCF]">Tool Updates</span>
                    <span className="text-purple-400 font-semibold">{staffData.stats?.toolManagement || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#CFCFCF]">User Actions</span>
                    <span className="text-orange-400 font-semibold">{staffData.stats?.userManagement || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation - Remove Activity Log tag */}
            {/* Activity Log Header - Moved above filters */}
            <div className="mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[#F5F5F5]">
                    Activity Log ({filteredActivities.length} activities)
                  </h2>
                  <p className="text-sm text-[#CFCFCF] mt-1">
                    Detailed audit trail showing all actions performed by {staffData.staffMember.name}
                  </p>
                </div>
                <div className="flex items-center">
                  {/* Export Button */}
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-6 py-3 bg-[#10B981]/20 backdrop-blur-lg border border-[#10B981]/20 text-[#10B981] rounded-xl hover:border-[#10B981]/40 hover:scale-105 transition-all duration-200 cursor-pointer"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    Export CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Filters Section - Match User Management History style */}
            <div className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Search</label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#CFCFCF]" />
                    <input
                      type="text"
                      placeholder="Search activities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] placeholder-[#CFCFCF] focus:border-[#00FFE0] focus:outline-none transition-all duration-200"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Activity Type</label>
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] focus:border-[#00FFE0] focus:outline-none transition-all duration-200"
                  >
                    <option value="all">All Activities</option>
                    <option value="user_management">User Management</option>
                    <option value="tool_management">Tool Management</option>
                    <option value="review_management">Review Management</option>
                    <option value="blog_management">Blog Management</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Time Range</label>
                  <select
                    value={selectedTimeRange}
                    onChange={(e) => {
                      const newTimeRange = parseInt(e.target.value);
                      setSelectedTimeRange(newTimeRange);
                      // Don't trigger a page refresh - just update the client-side filtering
                    }}
                    className="w-full px-4 py-2 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] focus:border-[#00FFE0] focus:outline-none transition-all duration-200"
                  >
                    <option value={7}>Last 7 days</option>
                    <option value={30}>Last 30 days</option>
                    <option value={90}>Last 90 days</option>
                    <option value={365}>Last year</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedFilter('all');
                      setSelectedTimeRange(30);
                    }}
                    className="w-full px-4 py-2 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-all duration-200 font-semibold cursor-pointer hover:scale-105"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Activity Log Table */}
            <div className="bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl">
              <div className="p-6 border-b border-[#00FFE0]/10">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div>
                    <p className="text-sm text-[#CFCFCF]">
                      {filteredActivities.length > 0 
                        ? `Showing ${filteredActivities.length} activities` 
                        : 'No activities found'}
                      {selectedFilter !== 'all' && ` for ${selectedFilter.replace('_', ' ')}`}
                      {searchTerm && ` matching "${searchTerm}"`}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Table View */}
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
                        Entity Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#00FFE0] uppercase tracking-wider">
                        Entity Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#00FFE0] uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#00FFE0] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#00FFE0]/10">
                    {filteredActivities.map((activity, index) => (
                      <ActivityTableRow 
                        key={activity.id || index} 
                        activity={activity} 
                        getActionIcon={getActionIcon}
                        getActionColor={getActionColor}
                        getActionDescription={getActionDescription}
                      />
                    ))}
                  </tbody>
                </table>
                
                {filteredActivities.length === 0 && (
                  <div className="p-12 text-center">
                    <div className="text-[#CFCFCF] text-lg mb-2">No activities found</div>
                    <p className="text-[#CFCFCF]/70 text-sm">
                      Try adjusting your filters or search terms
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 