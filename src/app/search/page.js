'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  SparklesIcon,
  DocumentTextIcon,
  FunnelIcon,
  ClockIcon,
  StarIcon,
  EyeIcon,
  HeartIcon,
  UserIcon,
  TagIcon,
  CalendarIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

// Tool Result Card Component
const ToolResultCard = ({ tool }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 hover:border-[#00FFE0]/40 transition-all duration-200 hover:scale-[1.02] group cursor-pointer"
  >
    <Link href={`/tools/${tool.slug}`} className="block">
      <div className="flex items-start gap-4">
        {/* Tool Logo */}
        <div className="flex-shrink-0">
          <img
            src={tool.logo || '/images/placeholder-logo.jpeg'}
            alt={tool.name}
            className="w-12 h-12 rounded-xl object-cover bg-[#0A0F24] border border-[#00FFE0]/10"
          />
        </div>
        
        {/* Tool Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-[#F5F5F5] group-hover:text-[#00FFE0] transition-colors line-clamp-1">
              {tool.name}
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-2 py-1 bg-[#00FFE0]/20 text-[#00FFE0] rounded-full text-xs font-medium">
                {tool.category}
              </span>
              {tool.trending && (
                <span className="px-2 py-1 bg-[#B936F4]/20 text-[#B936F4] rounded-full text-xs font-medium">
                  Trending
                </span>
              )}
            </div>
          </div>
          
          <p 
            className="text-[#CFCFCF] text-sm mb-3 line-clamp-2"
            dangerouslySetInnerHTML={{ __html: tool.highlightedText || tool.description }}
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-[#CFCFCF]">
              <div className="flex items-center gap-1">
                <StarIcon className="w-4 h-4" />
                <span>{tool.rating?.toFixed(1) || '0.0'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{tool.reviewCount || 0} reviews</span>
              </div>
              <div className="px-2 py-1 bg-[#0A0F24]/30 rounded text-xs">
                {tool.price}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {tool.tags?.slice(0, 2).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-[#B936F4]/10 text-[#B936F4] rounded text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
);

// Blog Result Card Component
const BlogResultCard = ({ blog }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 hover:border-[#00FFE0]/40 transition-all duration-200 hover:scale-[1.02] group cursor-pointer"
  >
    <Link href={`/blog/${blog.slug}`} className="block">
      <div className="space-y-4">
        {/* Blog Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-[#F5F5F5] group-hover:text-[#00FFE0] transition-colors line-clamp-2 mb-2">
              {blog.title}
            </h3>
            
            {/* Categories */}
            {blog.categories && blog.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {blog.categories.slice(0, 2).map((category) => (
                  <span
                    key={category._id}
                    className="px-2 py-1 bg-[#00FFE0]/20 text-[#00FFE0] rounded-full text-xs font-medium"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-[#CFCFCF] ml-4">
            <ClockIcon className="w-4 h-4" />
            <span>{blog.readTime || 1} min read</span>
          </div>
        </div>
        
        {/* Blog Excerpt */}
        <p 
          className="text-[#CFCFCF] text-sm line-clamp-3"
          dangerouslySetInnerHTML={{ __html: blog.highlightedText || blog.excerpt }}
        />
        
        {/* Blog Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-[#00FFE0]/10">
          <div className="flex items-center gap-3">
            {blog.authorId?.image && (
              <img
                src={blog.authorId.image}
                alt={blog.authorId.name}
                className="w-6 h-6 rounded-full object-cover"
              />
            )}
            <div className="flex items-center gap-2 text-xs text-[#CFCFCF]">
              <UserIcon className="w-4 h-4" />
              <span>{blog.authorId?.name || 'Anonymous'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#CFCFCF]">
              <CalendarIcon className="w-4 h-4" />
              <span>
                {new Date(blog.publishedAt || blog.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-[#CFCFCF]">
            <div className="flex items-center gap-1">
              <EyeIcon className="w-4 h-4" />
              <span>{blog.views || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <HeartIcon className="w-4 h-4" />
              <span>{blog.likes || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
);

// Main Search Page Component
export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  
  const [searchResults, setSearchResults] = useState({ tools: [], blogs: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchInput, setSearchInput] = useState(query);
  const [filters, setFilters] = useState({
    type: 'all', // 'all', 'tools', 'blogs'
    sort: 'relevance' // 'relevance', 'newest', 'popular', 'rating'
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 20
  });

  useEffect(() => {
    if (query) {
      setSearchInput(query);
      performSearch(query, filters, 1);
    }
  }, [query]);

  const performSearch = async (searchQuery, currentFilters, page = 1) => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        q: searchQuery.trim(),
        type: currentFilters.type,
        sort: currentFilters.sort,
        page: page.toString(),
        limit: '20'
      });

      const response = await fetch(`/api/search?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch search results');
      }

      const data = await response.json();
      setSearchResults(data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error performing search:', error);
      setError('Failed to load search results');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (query) {
      performSearch(query, newFilters, 1);
    }
  };

  const handlePageChange = (newPage) => {
    performSearch(query, filters, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getResultsText = () => {
    const { tools, blogs, total } = searchResults;
    if (total === 0) return `No results found for "${query}"`;
    
    const parts = [];
    if (tools.length > 0) parts.push(`${tools.length} tool${tools.length === 1 ? '' : 's'}`);
    if (blogs.length > 0) parts.push(`${blogs.length} article${blogs.length === 1 ? '' : 's'}`);
    
    return `Found ${parts.join(' and ')} for "${query}"`;
  };

  if (!query) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-24 h-24 bg-[#0A0F24]/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <MagnifyingGlassIcon className="w-12 h-12 text-[#00FFE0]" />
            </div>
            <h1 className="text-3xl font-bold text-[#F5F5F5] mb-4">Search ToolNest</h1>
            <p className="text-[#CFCFCF] mb-8">
              Discover AI tools and articles across our platform
            </p>
            
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search for tools, articles, or content..."
                  className="w-full px-6 py-4 pl-12 rounded-2xl bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] placeholder-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-[#00FFE0]/20 focus:border-transparent cursor-text"
                />
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#CFCFCF]" />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-colors font-semibold cursor-pointer hover:scale-105 duration-200"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[#F5F5F5] mb-2">Search Results</h1>
                <p className="text-[#CFCFCF] text-lg">
                  {getResultsText()}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Link 
                  href="/"
                  className="flex items-center gap-2 px-6 py-3 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 transition-all duration-200 cursor-pointer hover:scale-105"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  Back to Home
                </Link>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search for tools, articles, or content..."
                    className="w-full px-6 py-3 pl-12 rounded-xl bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] placeholder-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-[#00FFE0]/20 focus:border-transparent cursor-text"
                  />
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#CFCFCF]" />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1 bg-[#00FFE0] text-[#0A0F24] rounded-lg hover:bg-[#00FFE0]/90 transition-colors font-semibold text-sm cursor-pointer hover:scale-105 duration-200"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 mb-8"
          >
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="flex items-center gap-2">
                <FunnelIcon className="w-5 h-5 text-[#CFCFCF]" />
                <span className="text-[#F5F5F5] font-medium">Filters:</span>
              </div>
              
              {/* Type Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[#CFCFCF] text-sm">Show:</span>
                <div className="flex bg-[#0A0F24]/30 rounded-lg p-1">
                  {[
                    { value: 'all', label: 'All Results' },
                    { value: 'tools', label: 'Tools Only' },
                    { value: 'blogs', label: 'Articles Only' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleFilterChange('type', option.value)}
                      className={`px-3 py-1 rounded text-sm transition-all duration-200 cursor-pointer hover:scale-105 ${
                        filters.type === option.value
                          ? 'bg-[#00FFE0] text-[#0A0F24] font-medium'
                          : 'text-[#CFCFCF] hover:text-[#00FFE0]'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Sort Filter */}
              <div className="flex items-center gap-2">
                <span className="text-[#CFCFCF] text-sm">Sort by:</span>
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className="px-3 py-2 bg-[#0A0F24]/30 border border-[#00FFE0]/20 rounded-lg text-[#F5F5F5] text-sm focus:outline-none focus:border-[#00FFE0]/40 cursor-pointer"
                >
                  <option value="relevance">Relevance</option>
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Results */}
          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonLoader key={index} type="card" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-[#F5F5F5] mb-4">Error Loading Results</h2>
              <p className="text-[#CFCFCF] mb-6">{error}</p>
              <button
                onClick={() => performSearch(query, filters, 1)}
                className="px-6 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-colors font-semibold cursor-pointer hover:scale-105 duration-200"
              >
                Retry Search
              </button>
            </div>
          ) : searchResults.total === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-[#0A0F24]/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <SparklesIcon className="w-12 h-12 text-[#00FFE0]" />
              </div>
              <h3 className="text-xl font-bold text-[#F5F5F5] mb-2">No Results Found</h3>
              <p className="text-[#CFCFCF] mb-6">
                We couldn&apos;t find anything matching &quot;{query}&quot;. Try different keywords or browse our categories.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/tools"
                  className="px-6 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-colors font-semibold cursor-pointer hover:scale-105 duration-200"
                >
                  Browse All Tools
                </Link>
                <Link
                  href="/blog"
                  className="px-6 py-3 bg-[#0A0F24] border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 transition-colors font-semibold cursor-pointer hover:scale-105 duration-200"
                >
                  Browse Articles
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Tools Results */}
              {searchResults.tools.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <SparklesIcon className="w-6 h-6 text-[#00FFE0]" />
                    <h2 className="text-2xl font-bold text-[#F5F5F5]">
                      AI Tools ({searchResults.tools.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {searchResults.tools.map((tool) => (
                      <ToolResultCard key={tool._id} tool={tool} />
                    ))}
                  </div>
                </div>
              )}

              {/* Blog Results */}
              {searchResults.blogs.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <DocumentTextIcon className="w-6 h-6 text-[#B936F4]" />
                    <h2 className="text-2xl font-bold text-[#F5F5F5]">
                      Articles ({searchResults.blogs.length})
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {searchResults.blogs.map((blog) => (
                      <BlogResultCard key={blog._id} blog={blog} />
                    ))}
                  </div>
                </div>
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-12">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className={`p-2 rounded-xl transition-all duration-200 ${
                      pagination.hasPrev
                        ? "bg-white/5 text-[#CFCFCF] hover:text-[#00FFE0] hover:bg-[#00FFE0]/10 cursor-pointer hover:scale-105"
                        : "bg-white/5 text-[#CFCFCF]/50 cursor-not-allowed opacity-50"
                    }`}
                    title={pagination.hasPrev ? "Previous page" : "No previous page"}
                  >
                    <ArrowLeftIcon className="w-5 h-5" />
                  </button>
                  <span className="text-[#CFCFCF] cursor-default select-none">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className={`p-2 rounded-xl transition-all duration-200 ${
                      pagination.hasNext
                        ? "bg-white/5 text-[#CFCFCF] hover:text-[#00FFE0] hover:bg-[#00FFE0]/10 cursor-pointer hover:scale-105"
                        : "bg-white/5 text-[#CFCFCF]/50 cursor-not-allowed opacity-50"
                    }`}
                    title={pagination.hasNext ? "Next page" : "No next page"}
                  >
                    <ArrowLeftIcon className="w-5 h-5 rotate-180" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 
