'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';

const NotificationItem = ({ notification, onMarkAsRead, onClose }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-emerald-400" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-rose-400" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-amber-400" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-sky-400" />;
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
      onClose(); // Close dropdown first
      window.location.href = notification.link;
    }
  };

  const handleMarkAsReadClick = async (e) => {
    e.stopPropagation(); // Prevent card click
    if (!notification.read) {
      await onMarkAsRead(notification._id);
    }
  };

  const handleViewClick = (e) => {
    e.stopPropagation(); // Prevent card click
    if (notification.link) {
      onClose();
      window.location.href = notification.link;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 border-l-4 ${getTypeStyles(notification.type)} ${
        !notification.read ? 'bg-[#0A0F24]/30' : 'bg-[#0A0F24]/10'
      } hover:bg-[#0A0F24]/40 transition-colors ${
        notification.link ? 'cursor-pointer' : ''
      }`}
      onClick={notification.link ? handleCardClick : undefined}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-sm font-medium ${
              !notification.read ? 'text-[#F5F5F5]' : 'text-[#CFCFCF]'
            }`}>
              {notification.title}
            </h4>
            {!notification.read && (
              <div className="w-2 h-2 bg-[#00FFE0] rounded-full flex-shrink-0 mt-1" />
            )}
          </div>
          
          <p className={`text-xs mt-1 ${
            !notification.read ? 'text-[#CFCFCF]' : 'text-[#999]'
          }`}>
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[#999] flex items-center gap-1">
              <ClockIcon className="w-3 h-3" />
              {new Date(notification.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
            
            <div className="flex items-center gap-2">
              {!notification.read && (
                <button
                  onClick={handleMarkAsReadClick}
                  className="text-xs text-[#00FFE0] hover:text-[#00FFE0]/80 font-medium"
                >
                  Mark read
                </button>
              )}
              {notification.link && (
                <button
                  onClick={handleViewClick}
                  className="text-xs text-[#00FFE0] hover:text-[#00FFE0]/80 font-medium"
                >
                  View →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function NotificationDropdown() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  const fetchNotifications = async (pageNum = 1, reset = false) => {
    if (!session || loading) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/notifications?page=${pageNum}&limit=10`);
      const data = await response.json();

      if (data.success) {
        if (reset) {
          setNotifications(data.notifications);
        } else {
          setNotifications(prev => [...prev, ...data.notifications]);
        }
        setUnreadCount(data.unreadCount);
        setHasMore(data.pagination.hasNext);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen && session) {
      fetchNotifications(1, true);
    }
  }, [isOpen, session]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (!session) return;

    // Initial fetch
    fetchNotifications(1, true);

    const interval = setInterval(() => {
      // Fetch latest notifications and update unread count
      fetch('/api/notifications?page=1&limit=10')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUnreadCount(data.unreadCount);
            // Update notifications if dropdown is open
            if (isOpen) {
              setNotifications(data.notifications);
            }
          }
        })
        .catch(console.error);
    }, 10000); // Check every 10 seconds for better responsiveness

    return () => clearInterval(interval);
  }, [session, isOpen]);

  // Mark notification as read
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

  // Mark all as read
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

  // Load more notifications
  const loadMore = () => {
    if (hasMore && !loading) {
      fetchNotifications(page + 1, false);
    }
  };

  if (!session) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#F5F5F5] hover:text-[#00FFE0] transition-colors"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellSolidIcon className="w-6 h-6" />
        ) : (
          <BellIcon className="w-6 h-6" />
        )}
        
        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-[#00FFE0] text-[#0A0F24] text-xs font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-full mt-2 w-96 bg-[#0A0F24]/95 backdrop-blur-lg border border-[#00FFE0]/20 rounded-xl shadow-2xl z-50 max-h-96 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#00FFE0]/10">
              <h3 className="text-lg font-semibold text-[#F5F5F5]">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-[#00FFE0] hover:text-[#00FFE0]/80 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-[#CFCFCF] hover:text-[#F5F5F5] transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00FFE0] mx-auto"></div>
                  <p className="text-[#CFCFCF] mt-2">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <BellIcon className="w-12 h-12 text-[#CFCFCF]/50 mx-auto mb-3" />
                  <p className="text-[#CFCFCF]">No notifications yet</p>
                  <p className="text-[#999] text-sm mt-1">
                    You'll see updates about your blog posts here
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#00FFE0]/5">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification._id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onClose={() => setIsOpen(false)}
                    />
                  ))}
                  
                  {/* Load More Button */}
                  {hasMore && (
                    <div className="p-4 text-center">
                      <button
                        onClick={loadMore}
                        disabled={loading}
                        className="text-sm text-[#00FFE0] hover:text-[#00FFE0]/80 font-medium disabled:opacity-50"
                      >
                        {loading ? 'Loading...' : 'Load more'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 
