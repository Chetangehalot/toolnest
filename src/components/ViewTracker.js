'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function ViewTracker({ toolSlug }) {
  const { data: session } = useSession();

  useEffect(() => {
    const trackView = async () => {
      if (!session || !toolSlug) return;

      try {
        await fetch(`/api/tools/${toolSlug}/view`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Error tracking view:', error);
      }
    };

    // Track view after a short delay to ensure user is actually viewing
    const timer = setTimeout(trackView, 2000);

    return () => clearTimeout(timer);
  }, [session, toolSlug]);

  return null; // This component doesn't render anything
} 
