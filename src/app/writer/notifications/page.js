'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowLeftIcon,
  EyeIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';

const NotificationItem = ({ notification, onMarkAsRead }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-6 h-6 text-emerald-400" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-6 h-6 text-rose-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-6 h-6 text-amber-400" />;
      default:
        return <InformationCircleIcon className="w-6 h-6 text-sky-400" />;
    }
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return 'border-l-emerald-500 bg-emerald-500/5';
      case 'error':
        return 'border-l-rose-500 bg-rose-500/5';
      case 'warning':
        return 'border-l-amber-500 bg-amber-500/5';
      default:
        return 'border-l-sky-500 bg-sky-500/5';
    }
  };

  const handleCardClick = async () => {
    // Mark as read if unread
    if (!notification.read) {
      await onMarkAsRead(notification._id);
    }
    
    // Navigate to link if available
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  const handleMarkAsRead = async (e) => {
    e.stopPropagation(); // Prevent card click
    if (!notification.read) {
      await onMarkAsRead(notification._id);
    }
  };

  const handleViewClick = (e) => {
    e.stopPropagation(); // Prevent card click
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-xl p-6 border-l-4 ${getTypeStyles(notification.type)} ${
        !notification.read ? 'bg-[#0A0F24]/70' : 'bg-[#0A0F24]/30'
      } ${notification.link ? 'cursor-pointer hover:bg-[#0A0F24]/60' : ''} transition-colors`}
      onClick={notification.link ? handleCardClick : undefined}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          {getIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className={`text-lg font-semibold mb-2 ${
                !notification.read ? 'text-[#F5F5F5]' : 'text-[#CFCFCF]'
              }`}>
                {notification.title}
              </h3>
              <p className={`text-sm mb-3 ${
                !notification.read ? 'text-[#CFCFCF]' : 'text-[#999]'
              }`}>
                {notification.message}
              </p>
            </div>
            
            {!notification.read && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#00FFE0] rounded-full" />
                <button
                  onClick={handleMarkAsRead}
                  className="text-xs text-[#00FFE0] hover:text-[#00FFE0]/80 font-medium"
                >
                  Mark as read
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-[#999]">
              <span className="flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                {new Date(notification.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              
              {notification.actionBy && (
                <span>
                  by {notification.actionBy.name}
                </span>
              )}
            </div>
            
            {notification.link && (
              <button
                onClick={handleViewClick}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#00FFE0]/20 text-[#00FFE0] rounded-lg hover:bg-[#00FFE0]/30 transition-colors text-sm font-medium"
              >
                <EyeIcon className="w-4 h-4" />
                View
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function WriterNotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    if (!['writer', 'manager', 'admin'].includes(session.user.role)) {
      router.push('/dashboard');
      return;
    }

    fetchNotifications();
  }, [session, status, router, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const unreadOnly = filter === 'unread';
      const response = await fetch(`/api/notifications?unreadOnly=${unreadOnly}&limit=50`);
      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } else {
        setError('Failed to fetch notifications');
      }
    } catch (error) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH'
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n._id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' })
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00FFE0] mx-auto"></div>
            <p className="text-[#F5F5F5] mt-4 text-lg">Loading notifications...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold text-[#F5F5F5] mb-2">
                📬 Writer Notifications
              </h1>
              <p className="text-[#CFCFCF] text-lg">
                Stay updated with your post reviews and platform updates
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-6 py-3 bg-[#00FFE0]/20 text-[#00FFE0] border border-[#00FFE0]/30 rounded-xl hover:bg-[#00FFE0]/30 transition-all duration-200 cursor-pointer hover:scale-105"
                  title="Mark all notifications as read"
                >
                  <CheckIcon className="w-5 h-5" />
                  Mark All Read ({unreadCount})
                </button>
              )}
              
              <Link
                href="/writer/dashboard"
                className="flex items-center gap-2 px-6 py-3 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 transition-all duration-200 cursor-pointer hover:scale-105"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Stats & Actions */}
          <div className="flex items-center justify-between mb-8 p-6 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-xl">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#00FFE0]">{notifications.length}</p>
                <p className="text-sm text-[#CFCFCF]">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">{unreadCount}</p>
                <p className="text-sm text-[#CFCFCF]">Unread</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Filter Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-[#00FFE0] text-[#0A0F24]'
                      : 'bg-[#0A0F24]/30 text-[#CFCFCF] hover:bg-[#00FFE0]/20'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'unread'
                      ? 'bg-[#00FFE0] text-[#0A0F24]'
                      : 'bg-[#0A0F24]/30 text-[#CFCFCF] hover:bg-[#00FFE0]/20'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          {error ? (
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="w-16 h-16 text-rose-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#F5F5F5] mb-2">Error Loading Notifications</h3>
              <p className="text-[#CFCFCF] mb-4">{error}</p>
              <button
                onClick={fetchNotifications}
                className="px-6 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-colors font-semibold"
              >
                Try Again
              </button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <BellIcon className="w-16 h-16 text-[#CFCFCF]/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[#F5F5F5] mb-2">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p className="text-[#CFCFCF]">
                {filter === 'unread' 
                  ? 'All caught up! Check back later for updates.'
                  : 'You\'ll receive notifications here when your blog posts are reviewed.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification._id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 
