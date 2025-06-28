'use client';

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/Toast';

export const useNotifications = () => {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [lastChecked, setLastChecked] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!session) return;

    // Set initial last checked time to current time
    if (!lastChecked) {
      setLastChecked(new Date());
    }

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Poll for new notifications every 15 seconds
    intervalRef.current = setInterval(async () => {
      try {
        const response = await fetch('/api/notifications?page=1&limit=10');
        const data = await response.json();

        if (data.success && data.notifications && lastChecked) {
          // Find notifications newer than last checked
          const newNotifications = data.notifications.filter(
            notification => new Date(notification.createdAt) > lastChecked && !notification.read
          );

          // Show toast for new notifications
          newNotifications.forEach(notification => {
            
            if (notification.type === 'success') {
              toast.success(notification.message, {
                title: notification.title,
                duration: 8000,
                action: notification.link ? {
                  label: 'View',
                  onClick: () => window.location.href = notification.link
                } : undefined
              });
            } else if (notification.type === 'error') {
              toast.error(notification.message, {
                title: notification.title,
                duration: 10000,
                action: notification.link ? {
                  label: 'View',
                  onClick: () => window.location.href = notification.link
                } : undefined
              });
            } else {
              toast.info(notification.message, {
                title: notification.title,
                duration: 6000,
                action: notification.link ? {
                  label: 'View',
                  onClick: () => window.location.href = notification.link
                } : undefined
              });
            }
          });

          // Update last checked time if we found new notifications
          if (newNotifications.length > 0) {
            setLastChecked(new Date());
          }
        }
      } catch (error) {
        // Silently handle notification errors in production
      }
    }, 15000); // Check every 15 seconds for better responsiveness

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session, lastChecked, toast]);

  return {
    lastChecked,
    setLastChecked
  };
};

export default useNotifications; 
