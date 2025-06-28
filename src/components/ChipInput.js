'use client';

import { useState, useRef, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function ChipInput({ 
  label, 
  value = [], 
  onChange, 
  placeholder = "Type and press Enter or comma to add...",
  className = "",
  helperText = ""
}) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Ensure value is always an array
  const chips = Array.isArray(value) ? value : [];

  const addChip = (text) => {
    const trimmedText = text.trim();
    if (trimmedText && !chips.includes(trimmedText)) {
      const newChips = [...chips, trimmedText];
      onChange(newChips);
    }
    setInputValue('');
  };

  const removeChip = (indexToRemove) => {
    const newChips = chips.filter((_, index) => index !== indexToRemove);
    onChange(newChips);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    
    // Check if user typed a comma
    if (value.includes(',')) {
      const parts = value.split(',');
      const lastPart = parts.pop(); // Keep the last part as current input
      
      // Add all complete parts as chips
      parts.forEach(part => {
        if (part.trim()) {
          addChip(part.trim());
        }
      });
      
      setInputValue(lastPart);
    } else {
      setInputValue(value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (inputValue.trim()) {
        addChip(inputValue.trim());
      }
    } else if (e.key === 'Backspace' && inputValue === '' && chips.length > 0) {
      // Remove last chip when backspace is pressed on empty input
      removeChip(chips.length - 1);
    }
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    // Add current input as chip when losing focus
    if (inputValue.trim()) {
      addChip(inputValue.trim());
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-[#F5F5F5] mb-2">
          {label}
        </label>
      )}
      
      <div
        onClick={handleContainerClick}
        className={`min-h-[48px] w-full px-4 py-3 bg-[#0A0F24] border rounded-xl cursor-text transition-colors ${
          isFocused 
            ? 'border-[#00FFE0] ring-1 ring-[#00FFE0]/20' 
            : 'border-[#00FFE0]/20 hover:border-[#00FFE0]/40'
        }`}
      >
        <div className="flex flex-wrap gap-2 items-center">
          {/* Render chips */}
          {chips.map((chip, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-[#00FFE0]/20 text-[#00FFE0] rounded-lg text-sm border border-[#00FFE0]/30 group"
            >
              <span>{chip}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeChip(index);
                }}
                className="ml-1 hover:bg-[#00FFE0]/30 rounded-full p-0.5 transition-colors"
                title="Remove"
              >
                <XMarkIcon className="w-3 h-3" />
              </button>
            </div>
          ))}
          
          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={handleInputBlur}
            placeholder={chips.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] bg-transparent text-[#F5F5F5] placeholder-[#CFCFCF] outline-none"
          />
        </div>
      </div>
      
      {helperText && (
        <p className="text-xs text-[#CFCFCF] mt-2">{helperText}</p>
      )}
    </div>
  );
} 
