'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Star } from 'lucide-react';

export default function BookmarkButton({ toolId, className = "" }) {
  const { data: session } = useSession();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (session) {
      checkBookmarkStatus();
    }
  }, [session, toolId]);

  const checkBookmarkStatus = async () => {
    try {
      const response = await fetch('/api/bookmarks');
      if (response.ok) {
        const data = await response.json();
        const bookmarked = data.bookmarks.some(tool => tool._id === toolId);
        setIsBookmarked(bookmarked);
      }
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const toggleBookmark = async () => {
    if (!session) {
      // Redirect to login or show login modal
      window.location.href = '/login';
      return;
    }

    setIsLoading(true);
    try {
      if (isBookmarked) {
        // Remove bookmark
        const response = await fetch(`/api/bookmarks?toolId=${toolId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setIsBookmarked(false);
        }
      } else {
        // Add bookmark
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolId })
        });
        if (response.ok) {
          setIsBookmarked(true);
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={toggleBookmark}
      disabled={isLoading}
      className={`flex items-center justify-center p-2 rounded-lg transition-all duration-200 ${
        isBookmarked
          ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
          : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
      } ${className} ${
        isLoading 
          ? 'cursor-wait opacity-70' 
          : 'cursor-pointer hover:scale-105'
      }`}
      title={isBookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
    >
      <Star 
        className={`w-5 h-5 transition-all duration-200 ${
          isBookmarked ? 'fill-yellow-400' : ''
        } ${isLoading ? 'animate-pulse' : ''}`}
      />
    </button>
  );
} 
