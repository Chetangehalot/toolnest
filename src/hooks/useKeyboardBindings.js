"use client";

import { useEffect, useCallback, useRef } from 'react';

export const useKeyboardBindings = ({
  onEscape,
  onSearch,
  enableFormSubmission = true,
  enableScrollNavigation = true,
  enableModalClose = true,
  enableSearchShortcut = true,
} = {}) => {
  const lastFocusedElement = useRef(null);
  const isCarouselActive = useRef(false);
  const isDropdownActive = useRef(false);
  const scrollTimeout = useRef(null);
  const isScrolling = useRef(false);

  // Check if we're on a mobile device
  const isMobileDevice = useCallback(() => {
    // Check if we're in browser environment
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  }, []);

  // Focus management utilities
  const getFocusableElements = useCallback((container) => {
    if (typeof document === 'undefined') return [];
    
    const actualContainer = container || document;
    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled])',
      '[role="tab"]:not([disabled])',
      '[role="menuitem"]:not([disabled])'
    ].join(',');
    
    return Array.from(actualContainer.querySelectorAll(selectors))
      .filter(el => el.offsetParent !== null); // Only visible elements
  }, []);

  // Visual feedback for keyboard interactions
  const showVisualFeedback = useCallback((element, type = 'focus') => {
    if (!element) return;
    
    // Add visual feedback class
    element.classList.add(`keyboard-${type}`);
    
    // Remove after animation
    setTimeout(() => {
      element.classList.remove(`keyboard-${type}`);
    }, 200);
  }, []);

  // Form submission handler
  const handleFormSubmission = useCallback((event) => {
    if (event.key !== 'Enter' || typeof document === 'undefined') return;
    
    const activeElement = document.activeElement;
    if (!activeElement || activeElement.tagName === 'TEXTAREA') return;
    
    // Find the closest form
    const form = activeElement.closest('form');
    if (!form) return;
    
    // Check if we're in an input field
    const isInputField = ['INPUT', 'SELECT'].includes(activeElement.tagName);
    if (!isInputField) return;
    
    // Don't submit if it's a search input with a separate submit button
    if (activeElement.type === 'search') return;
    
    // Prevent default and submit form
    event.preventDefault();
    
    // Look for submit button first
    const submitButton = form.querySelector('button[type="submit"], input[type="submit"]') || 
                        form.querySelector('button:not([type="button"])');
    
    if (submitButton) {
      showVisualFeedback(submitButton, 'activate');
      submitButton.click();
    } else {
      // Fallback to form submission
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
    }
  }, [showVisualFeedback]);

  // Arrow key navigation handler
  const handleArrowNavigation = useCallback((event) => {
    const { key } = event;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key) || typeof document === 'undefined') return;
    
    const activeElement = document.activeElement;
    
    // Handle dropdown/select navigation
    if (activeElement && activeElement.tagName === 'SELECT') {
      return; // Let browser handle native select navigation
    }
    
    // Handle custom dropdown navigation
    const dropdown = document.querySelector('[role="listbox"]:not([hidden]), [role="menu"]:not([hidden])');
    if (dropdown) {
      event.preventDefault();
      const items = dropdown.querySelectorAll('[role="option"], [role="menuitem"]');
      const currentIndex = Array.from(items).indexOf(activeElement);
      
      if (key === 'ArrowDown' && currentIndex < items.length - 1) {
        items[currentIndex + 1].focus();
        showVisualFeedback(items[currentIndex + 1]);
      } else if (key === 'ArrowUp' && currentIndex > 0) {
        items[currentIndex - 1].focus();
        showVisualFeedback(items[currentIndex - 1]);
      }
      return;
    }
    
    // Handle carousel navigation
    const carousel = document.querySelector('[data-carousel]');
    if (carousel && (key === 'ArrowLeft' || key === 'ArrowRight')) {
      event.preventDefault();
      const prevBtn = carousel.querySelector('[data-carousel-prev]');
      const nextBtn = carousel.querySelector('[data-carousel-next]');
      
      if (key === 'ArrowLeft' && prevBtn) {
        prevBtn.click();
        showVisualFeedback(prevBtn, 'activate');
      } else if (key === 'ArrowRight' && nextBtn) {
        nextBtn.click();
        showVisualFeedback(nextBtn, 'activate');
      }
      return;
    }
    
    // Handle tab navigation
    const tabList = document.querySelector('[role="tablist"]');
    if (tabList && (key === 'ArrowLeft' || key === 'ArrowRight')) {
      const tabs = tabList.querySelectorAll('[role="tab"]');
      const currentIndex = Array.from(tabs).indexOf(activeElement);
      
      if (currentIndex !== -1) {
        event.preventDefault();
        let nextIndex;
        
        if (key === 'ArrowRight') {
          nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        }
        
        tabs[nextIndex].focus();
        tabs[nextIndex].click();
        showVisualFeedback(tabs[nextIndex]);
      }
      return;
    }
    
    // Page scrolling (only if no specific navigation is active)
    if (enableScrollNavigation && (key === 'ArrowUp' || key === 'ArrowDown')) {
      // Don't scroll if user is in an input field
      if (activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName)) {
        return;
      }
      
      // Throttle scrolling to prevent lag during continuous use
      if (isScrolling.current) {
        return;
      }
      
      isScrolling.current = true;
      const scrollAmount = 100;
      
      if (key === 'ArrowUp' && typeof window !== 'undefined') {
        window.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
      } else if (key === 'ArrowDown' && typeof window !== 'undefined') {
        window.scrollBy({ top: scrollAmount, behavior: 'smooth' });
      }
      
      // Reset scrolling flag after a short delay
      clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        isScrolling.current = false;
      }, 100);
    }
  }, [enableScrollNavigation, showVisualFeedback]);

  // Modal/dropdown close handler
  const handleEscapeKey = useCallback((event) => {
    if (event.key !== 'Escape' || typeof document === 'undefined') return;
    
    // Find and close modals
    const modal = document.querySelector('[role="dialog"]:not([hidden]), .modal:not([hidden])');
    if (modal) {
      event.preventDefault();
      const closeButton = modal.querySelector('[data-modal-close], .modal-close, [aria-label*="close" i]');
      if (closeButton) {
        closeButton.click();
        showVisualFeedback(closeButton, 'activate');
      } else if (onEscape) {
        onEscape('modal');
      }
      return;
    }
    
    // Close dropdowns
    const dropdown = document.querySelector('[role="listbox"]:not([hidden]), [role="menu"]:not([hidden])');
    if (dropdown) {
      event.preventDefault();
      dropdown.setAttribute('hidden', '');
      // Return focus to trigger element
      const trigger = document.querySelector('[aria-expanded="true"]');
      if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
        trigger.focus();
        showVisualFeedback(trigger);
      }
      return;
    }
    
    // Clear search if search input is focused
    const searchInput = document.querySelector('input[type="search"]:focus');
    if (searchInput && searchInput.value) {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    
    // Custom escape handler
    if (onEscape) {
      onEscape('general');
    }
  }, [onEscape, showVisualFeedback]);



  // Search shortcut handler
  const handleSearchShortcut = useCallback((event) => {
    if (event.ctrlKey && event.key === 'f') {
      // Only override if we have a custom search handler
      if (onSearch) {
        event.preventDefault();
        onSearch();
      }
    }
  }, [onSearch]);

  // Focus management for Tab key
  const handleTabNavigation = useCallback((event) => {
    if (event.key !== 'Tab' || typeof document === 'undefined') return;
    
    // Let browser handle tab navigation naturally, but add visual feedback
    setTimeout(() => {
      if (typeof document === 'undefined') return;
      const focusedElement = document.activeElement;
      if (focusedElement && focusedElement !== document.body) {
        showVisualFeedback(focusedElement);
      }
    }, 0);
    
    // Handle modal tab trapping
    const modal = document.querySelector('[role="dialog"]:not([hidden])');
    if (modal) {
      const focusableElements = getFocusableElements(modal);
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        showVisualFeedback(lastElement);
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
        showVisualFeedback(firstElement);
      }
    }
  }, [getFocusableElements, showVisualFeedback]);

  // Main keyboard event handler
  const handleKeyDown = useCallback((event) => {
    // Skip if on mobile device
    if (isMobileDevice()) return;
    
    // Handle different key combinations
    switch (true) {
      case event.key === 'Enter' && enableFormSubmission:
        handleFormSubmission(event);
        break;
        
      case ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key):
        handleArrowNavigation(event);
        break;
        
      case event.key === 'Escape' && enableModalClose:
        handleEscapeKey(event);
        break;
        
      case event.ctrlKey && event.key === 'f' && enableSearchShortcut:
        handleSearchShortcut(event);
        break;
        
      case event.key === 'Tab':
        handleTabNavigation(event);
        break;
        
      default:
        break;
    }
  }, [
    isMobileDevice,
    enableFormSubmission,
    enableModalClose,
    enableSearchShortcut,
    handleFormSubmission,
    handleArrowNavigation,
    handleEscapeKey,
    handleSearchShortcut,
    handleTabNavigation
  ]);

  // Setup and cleanup
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('keydown', handleKeyDown);
      }
      // Cleanup scroll timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [handleKeyDown]);

  // Return utilities for components to use
  return {
    showVisualFeedback,
    getFocusableElements,
    isMobileDevice: isMobileDevice(),
  };
}; 