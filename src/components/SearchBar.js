'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function SearchBar({ placeholder = "Search AI tools...", className = "" }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/tools?search=${encodeURIComponent(query)}&limit=5`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.tools || []);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
    } else {
      // Show tooltip for empty search
      const input = e.target.querySelector('input');
      if (input) {
        input.focus();
        input.placeholder = "Please enter a search term";
        setTimeout(() => {
          input.placeholder = placeholder;
        }, 2000);
      }
    }
  };

  const handleSuggestionClick = (tool) => {
    router.push(`/tools/${tool.slug}`);
    setShowSuggestions(false);
    setQuery('');
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length >= 2);
  };

  return (
    <div ref={searchRef} className={`relative w-full max-w-2xl mx-auto ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="w-full px-4 py-3 pl-12 pr-4 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] placeholder-[#CFCFCF] focus:border-[#00FFE0] focus:outline-none focus:ring-2 focus:ring-[#00FFE0]/20 transition-all duration-200"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-[#CFCFCF]" />
          </div>
          <button
            type="submit"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <div className="px-3 py-1 bg-[#00FFE0] text-[#0A0F24] rounded-lg hover:bg-[#00FFE0]/90 transition-colors font-semibold text-sm">
              Search
            </div>
          </button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0F24]/95 backdrop-blur-lg border border-[#00FFE0]/20 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00FFE0] mx-auto"></div>
              <p className="text-[#CFCFCF] text-sm mt-2">Searching...</p>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((tool) => (
                <button
                  key={tool._id}
                  onClick={() => handleSuggestionClick(tool)}
                  className="w-full px-4 py-3 text-left hover:bg-[#00FFE0]/10 transition-colors flex items-center gap-3 group"
                >
                  {tool.logo && (
                    <img 
                      src={tool.logo} 
                      alt={tool.name}
                      className="w-8 h-8 rounded-lg object-cover bg-[#0A0F24]"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#F5F5F5] font-medium truncate group-hover:text-[#00FFE0] transition-colors">
                      {tool.name}
                    </p>
                    <p className="text-[#CFCFCF] text-sm truncate">
                      {tool.category} • {tool.price}
                    </p>
                  </div>
                </button>
              ))}
              <div className="border-t border-[#00FFE0]/10 mt-2 pt-2">
                <button
                  onClick={handleSubmit}
                  className="w-full px-4 py-2 text-[#00FFE0] hover:bg-[#00FFE0]/10 transition-colors text-sm font-medium"
                >
                  Search all results for &ldquo;{query}&rdquo;
                </button>
              </div>
            </div>
          ) : query.length >= 2 ? (
            <div className="p-4 text-center">
              <p className="text-[#CFCFCF] text-sm">No tools found for &ldquo;{query}&rdquo;</p>
              <button
                onClick={handleSubmit}
                className="mt-2 px-4 py-2 bg-[#00FFE0] text-[#0A0F24] rounded-lg hover:bg-[#00FFE0]/90 transition-colors font-semibold text-sm"
              >
                Search anyway
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
} 
