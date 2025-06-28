'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
  EyeIcon,
  HeartIcon,
  ClockIcon,
  SparklesIcon,
  FireIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';
import Link from 'next/link';

const BlogCard = ({ post }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5 }}
    className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl overflow-hidden hover:border-[#00FFE0]/40 transition-all duration-300"
  >
    <Link href={`/blog/${post.slug}`} className="block cursor-pointer group">
      {post.featuredImage && (
        <div className="aspect-video overflow-hidden">
          <img
            src={post.featuredImage}
            alt={post.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex items-center gap-2 mb-3">
          {post.categories && post.categories.length > 0 && (
            <span className="px-3 py-1 bg-[#00FFE0]/20 text-[#00FFE0] rounded-full text-sm border border-[#00FFE0]/30 cursor-help" title={`Category: ${post.categories[0].name}`}>
              {post.categories[0].name}
            </span>
          )}
          <span className="px-3 py-1 bg-[#B936F4]/20 text-[#B936F4] rounded-full text-sm border border-[#B936F4]/30 cursor-help" title="Estimated reading time">
            {post.readTime || 1} min read
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-[#F5F5F5] mb-3 line-clamp-2 hover:text-[#00FFE0] transition-colors cursor-pointer">
          {post.title}
        </h3>
        
        {post.excerpt && (
          <p className="text-[#CFCFCF] mb-4 line-clamp-3 cursor-text select-text">{post.excerpt}</p>
        )}
        
        <div className="flex items-center justify-between text-sm text-[#CFCFCF]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {post.authorId?.image && (
                <img
                  src={post.authorId.image}
                  alt={post.authorId.name}
                  className="w-6 h-6 rounded-full object-cover"
                />
              )}
              <div className="flex items-center gap-1">
                <UserIcon className="w-4 h-4" />
                <span className="hover:text-[#00FFE0] transition-colors cursor-pointer" title={`Author: ${post.authorId?.name || 'Anonymous'}`}>{post.authorId?.name || 'Anonymous'}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 cursor-help" title="Publication date">
              <CalendarIcon className="w-4 h-4" />
              <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 cursor-help" title="View count">
              <EyeIcon className="w-4 h-4" />
              <span>{post.views || 0}</span>
            </div>
            <div className="flex items-center gap-1 cursor-help" title="Like count">
              <HeartIcon className="w-4 h-4" />
              <span>{post.likes || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
);

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    hasNext: false,
    hasPrev: false
  });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 9
  });

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [filters, searchTerm, selectedCategory, sortBy]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        status: 'published',
        page: filters.page,
        limit: filters.limit
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      
      const response = await fetch(`/api/blog/posts?${params}`);
      if (!response.ok) throw new Error('Failed to fetch posts');
      
      const data = await response.json();
      
      let sortedPosts = data.posts || [];
      
      // Apply client-side sorting
      sortedPosts.sort((a, b) => {
        switch (sortBy) {
          case 'latest':
            return new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt);
          case 'popular':
            return (b.views || 0) - (a.views || 0);
          case 'trending':
            return (b.likes || 0) - (a.likes || 0);
          default:
            return 0;
        }
      });
      
      setPosts(sortedPosts);
      setPagination(data.pagination || {});
      
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/blog/categories?active=true');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-[#F5F5F5] mb-4">
              <span className="bg-gradient-to-r from-[#00FFE0] to-[#B936F4] bg-clip-text text-transparent">
                Blog & Insights
              </span>
            </h1>
            <p className="text-[#CFCFCF] text-lg max-w-2xl mx-auto">
              Discover the latest insights, tutorials, and industry trends from our community of experts
            </p>
          </motion.div>

          {/* Search and Filters */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 text-[#CFCFCF] absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchTerm.trim()) {
                      // Redirect to unified search for blog-specific search
                      window.location.href = `/search?q=${encodeURIComponent(searchTerm.trim())}&type=blogs`;
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-[#0A0F24]/30 border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] placeholder-[#CFCFCF]/50 focus:outline-none focus:border-[#00FFE0]/40 focus:ring-2 focus:ring-[#00FFE0]/20 cursor-text transition-all duration-200"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <FunnelIcon className="w-5 h-5 text-[#CFCFCF] absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0A0F24]/30 border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] focus:outline-none focus:border-[#00FFE0]/40 focus:ring-2 focus:ring-[#00FFE0]/20 appearance-none cursor-pointer transition-all duration-200 hover:border-[#00FFE0]/30"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>{category.name}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="relative">
                <FireIcon className="w-5 h-5 text-[#CFCFCF] absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#0A0F24]/30 border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] focus:outline-none focus:border-[#00FFE0]/40 focus:ring-2 focus:ring-[#00FFE0]/20 appearance-none cursor-pointer transition-all duration-200 hover:border-[#00FFE0]/30"
                >
                  <option value="latest">Latest</option>
                  <option value="popular">Most Popular</option>
                  <option value="trending">Trending</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Blog Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-[#0A0F24]/50 rounded-2xl overflow-hidden">
                    <div className="aspect-video bg-[#0A0F24]/30"></div>
                    <div className="p-6 space-y-4">
                      <div className="flex gap-2">
                        <div className="w-16 h-6 bg-[#0A0F24]/30 rounded-full"></div>
                        <div className="w-20 h-6 bg-[#0A0F24]/30 rounded-full"></div>
                      </div>
                      <div className="w-full h-6 bg-[#0A0F24]/30 rounded"></div>
                      <div className="w-3/4 h-6 bg-[#0A0F24]/30 rounded"></div>
                      <div className="space-y-2">
                        <div className="w-full h-4 bg-[#0A0F24]/30 rounded"></div>
                        <div className="w-5/6 h-4 bg-[#0A0F24]/30 rounded"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8"
              >
                {posts.map((post, index) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <BlogCard post={post} />
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-center items-center gap-4 mt-8"
                >
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrev}
                    className={`flex items-center gap-2 px-4 py-2 bg-[#0A0F24]/50 border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl transition-all duration-200 ${
                      !pagination.hasPrev 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:border-[#00FFE0]/40 cursor-pointer hover:scale-105'
                    }`}
                    title={!pagination.hasPrev ? "No previous page" : "Previous page"}
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="text-[#CFCFCF] cursor-default select-none">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                    className={`flex items-center gap-2 px-4 py-2 bg-[#0A0F24]/50 border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl transition-all duration-200 ${
                      !pagination.hasNext 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:border-[#00FFE0]/40 cursor-pointer hover:scale-105'
                    }`}
                    title={!pagination.hasNext ? "No next page" : "Next page"}
                  >
                    Next
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center py-16"
            >
              <div className="w-24 h-24 bg-[#0A0F24]/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <SparklesIcon className="w-12 h-12 text-[#00FFE0]" />
              </div>
              <h3 className="text-2xl font-bold text-[#F5F5F5] mb-4">No Articles Found</h3>
              <p className="text-[#CFCFCF] mb-8 max-w-md mx-auto">
                {searchTerm || selectedCategory 
                  ? "No articles match your current filters. Try adjusting your search criteria." 
                  : "No published articles are available at the moment. Check back soon for new content!"
                }
              </p>
              {(searchTerm || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setFilters(prev => ({ ...prev, page: 1 }));
                  }}
                  className="px-6 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-all duration-200 font-semibold cursor-pointer hover:scale-105"
                >
                  Clear Filters
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
} 
