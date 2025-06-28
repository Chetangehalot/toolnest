"use client";

import React, { useState } from 'react';
import { useKeyboardBindings } from '@/hooks/useKeyboardBindings';

const KeyboardBindingsProvider = ({ children }) => {
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Handle escape key actions
  const handleEscape = (type) => {
    if (type === 'modal') {
      // Close any open modals
      setSearchModalOpen(false);
      
      // Trigger close on any visible modals
      const modals = document.querySelectorAll('[role="dialog"]:not([hidden])');
      modals.forEach(modal => {
        const closeBtn = modal.querySelector('[data-modal-close], .modal-close');
        if (closeBtn) closeBtn.click();
      });
    } else if (type === 'general') {
      // Clear any active search
      const searchInputs = document.querySelectorAll('input[type="search"]');
      searchInputs.forEach(input => {
        if (input.value) {
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    }
  };



  // Handle search shortcut (Ctrl+F)
  const handleSearch = () => {
    // Try to focus existing search input first
    const searchInput = document.querySelector('input[name="search"], input[type="search"]');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    } else {
      // Open search modal if no search input is available
      setSearchModalOpen(true);
      // Trigger search modal opening (you can customize this based on your search modal)
      const searchButton = document.querySelector('[data-search-trigger]');
      if (searchButton) {
        searchButton.click();
      }
    }
  };



  // Initialize keyboard bindings
  const { showVisualFeedback, getFocusableElements, isMobileDevice } = useKeyboardBindings({
    onEscape: handleEscape,
    onSearch: handleSearch,
    enableFormSubmission: true,
    enableScrollNavigation: true,
    enableModalClose: true,
    enableSearchShortcut: true,
  });

  return (
    <>
      {children}
      
      {/* Accessibility announcements */}
      <div 
        id="keyboard-announcer" 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      />
      

    </>
  );
};

export default KeyboardBindingsProvider; 