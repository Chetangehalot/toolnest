'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  SparklesIcon,
  TagIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  StarIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';
import { useToast } from '@/components/ui/Toast';

export default function ToolsManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [tools, setTools] = useState([]);
  const [filteredTools, setFilteredTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFiltering, setIsFiltering] = useState(false);

  const categories = ['Text', 'Image', 'Audio', 'Video', 'Code', 'Other'];

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    if (session.user.role !== 'admin' && session.user.role !== 'manager') {
      router.push('/dashboard');
      return;
    }

    fetchTools();
  }, [session, status, router]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (tools.length > 0) {
      setIsFiltering(true);
      const timer = setTimeout(() => {
        filterTools();
        // Add a small delay for smooth animation
        setTimeout(() => setIsFiltering(false), 150);
      }, 100);

      return () => clearTimeout(timer);
    } else {
      filterTools();
    }
  }, [tools, searchQuery, categoryFilter, statusFilter]);

  const filterTools = () => {
    let filtered = tools;

    if (searchQuery) {
      filtered = filtered.filter(tool =>
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(tool => tool.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(tool => {
        switch (statusFilter) {
          case 'active':
            return tool.status === 'active' || !tool.status;
          case 'trending':
            return tool.trending === true;
          default:
            return true;
        }
      });
    }

    setFilteredTools(filtered);
  };

  const fetchTools = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/tools');
      
      if (!response.ok) {
        throw new Error('Failed to fetch tools');
      }

      const data = await response.json();
      setTools(data.tools || []);
    } catch (error) {
      console.error('Error fetching tools:', error);
      setError('Failed to load tools');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTool = async () => {
    try {
      const response = await fetch(`/api/admin/tools/${selectedTool._id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setSelectedTool(null);
        fetchTools();
        toast.success('Tool deleted successfully!', {
          duration: 3000,
        });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete tool', {
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error deleting tool:', error);
      toast.error('Failed to delete tool', {
        duration: 3000,
      });
    }
  };

  const openDeleteModal = (tool) => {
    setSelectedTool(tool);
    setShowDeleteModal(true);
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0A0F24]">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
              {/* Header Skeleton */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <div className="w-64 h-10 bg-[#00FFE0]/10 rounded-lg animate-pulse mb-2"></div>
                  <div className="w-48 h-6 bg-[#00FFE0]/10 rounded-lg animate-pulse"></div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 h-12 bg-[#00FFE0]/10 rounded-xl animate-pulse"></div>
                  <div className="w-32 h-12 bg-[#00FFE0]/10 rounded-xl animate-pulse"></div>
                </div>
              </div>

              {/* Search and Filter Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="w-full h-12 bg-[#00FFE0]/10 rounded-xl animate-pulse"></div>
                <div className="w-full h-12 bg-[#00FFE0]/10 rounded-xl animate-pulse"></div>
                <div className="w-32 h-12 bg-[#00FFE0]/10 rounded-xl animate-pulse"></div>
              </div>

              {/* Tools Grid Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, index) => (
                  <div key={index} className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6 animate-pulse">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-[#00FFE0]/10 rounded-xl"></div>
                      <div className="flex gap-2">
                        <div className="w-8 h-8 bg-[#00FFE0]/10 rounded-lg"></div>
                        <div className="w-8 h-8 bg-[#00FFE0]/10 rounded-lg"></div>
                        <div className="w-8 h-8 bg-[#00FFE0]/10 rounded-lg"></div>
                      </div>
                    </div>
                    <div className="w-3/4 h-6 bg-[#00FFE0]/10 rounded-lg mb-2"></div>
                    <div className="w-full h-4 bg-[#00FFE0]/10 rounded-lg mb-2"></div>
                    <div className="w-2/3 h-4 bg-[#00FFE0]/10 rounded-lg mb-4"></div>
                    <div className="flex gap-2 mb-4">
                      <div className="w-16 h-6 bg-[#00FFE0]/10 rounded-full"></div>
                      <div className="w-20 h-6 bg-[#00FFE0]/10 rounded-full"></div>
                      <div className="w-14 h-6 bg-[#00FFE0]/10 rounded-full"></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="w-16 h-6 bg-[#00FFE0]/10 rounded-lg"></div>
                      <div className="w-20 h-6 bg-[#00FFE0]/10 rounded-lg"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#0A0F24] flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ExclamationTriangleIcon className="w-12 h-12 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-[#F5F5F5] mb-4">Error Loading Tools</h2>
            <p className="text-[#CFCFCF] mb-6">{error}</p>
            <button
              onClick={fetchTools}
              className="px-6 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-colors font-semibold"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-[#0A0F24]">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-between items-center mb-8"
            >
              <div>
                <h1 className="text-4xl font-bold text-[#F5F5F5]">Tools Management</h1>
                <p className="text-[#CFCFCF] text-lg">Manage AI tools in the directory</p>
              </div>
              <div className="flex items-center gap-4">
                <Link 
                  href="/admin"
                  className="flex items-center gap-2 px-6 py-3 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 transition-all duration-200 cursor-pointer"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  Back to Admin
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/admin/tools/new')}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00FFE0] to-[#B936F4] text-[#0A0F24] rounded-xl hover:from-[#00FFE0]/90 hover:to-[#B936F4]/90 transition-all duration-200 font-semibold shadow-lg cursor-pointer"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add New Tool
                </motion.button>
              </div>
            </motion.div>

            {/* Search and Filters */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 mb-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-[#F5F5F5] mb-2" title="Search tools by name, description, or tags">Search</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search tools..."
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className="w-full px-4 py-2 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] placeholder-[#CFCFCF] focus:border-[#00FFE0] focus:outline-none transition-all duration-200 cursor-text"
                    />
                    {searchInput !== searchQuery && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-[#00FFE0] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-[#F5F5F5] mb-2" title="Filter by tool category">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] focus:border-[#00FFE0] focus:outline-none transition-all duration-200 cursor-pointer"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter (placeholder for consistency) */}
                <div>
                  <label className="block text-sm font-medium text-[#F5F5F5] mb-2" title="Filter by tool status">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-4 py-2 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] focus:border-[#00FFE0] focus:outline-none transition-all duration-200 cursor-pointer"
                  >
                    <option value="all">All Tools</option>
                    <option value="active">Active</option>
                    <option value="trending">Trending</option>
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchInput('');
                      setSearchQuery('');
                      setCategoryFilter('all');
                      setStatusFilter('all');
                    }}
                    className="w-full px-4 py-2 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-all duration-200 font-semibold cursor-pointer hover:scale-105"
                    title="Clear all filters"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Tools Grid */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              {isFiltering && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-[#0A0F24]/60 backdrop-blur-sm rounded-2xl z-10 flex items-center justify-center"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-3 px-6 py-3 bg-[#0A0F24]/90 backdrop-blur-lg border border-[#00FFE0]/20 rounded-xl shadow-lg"
                  >
                    <div className="w-4 h-4 border-2 border-[#00FFE0] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-[#F5F5F5] text-sm font-medium">Filtering tools...</span>
                  </motion.div>
                </motion.div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredTools.map((tool, index) => (
                    <motion.div
                      key={tool._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      whileHover={{ y: -5 }}
                      className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6 hover:border-[#00FFE0]/40 transition-all duration-300 shadow-lg"
                    >
                      {/* Tool Image */}
                      <div className="relative aspect-video mb-4 rounded-xl overflow-hidden bg-[#0A0F24]">
                        <img 
                          src={tool.image || '/images/placeholder-image.jpeg'} 
                          alt={tool.name}
                          className="w-full h-full object-cover"
                        />
                        {tool.trending && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs border border-red-500/30 backdrop-blur-sm">
                            Trending
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/50 text-yellow-400 rounded-full text-xs backdrop-blur-sm">
                          <StarIcon className="w-3 h-3" />
                          {tool.rating?.toFixed(1) || '0.0'}
                        </div>
                      </div>

                      {/* Tool Info */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="text-lg font-bold text-[#F5F5F5] line-clamp-1">{tool.name}</h3>
                        </div>

                        <p className="text-[#CFCFCF] text-sm line-clamp-2">{tool.description}</p>

                        <div className="flex items-center gap-2 text-sm">
                          <span className="px-2 py-1 bg-[#00FFE0]/20 text-[#00FFE0] rounded-full border border-[#00FFE0]/30">
                            {tool.category || 'General'}
                          </span>
                          <span className="px-2 py-1 bg-[#B936F4]/20 text-[#B936F4] rounded-full border border-[#B936F4]/30">
                            {tool.price || 'Free'}
                          </span>
                        </div>

                        {tool.tags && tool.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {tool.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="px-2 py-1 bg-[#CFCFCF]/10 text-[#CFCFCF] rounded-full text-xs border border-[#CFCFCF]/20">
                                {tag}
                              </span>
                            ))}
                            {tool.tags.length > 2 && (
                              <span className="px-2 py-1 bg-[#CFCFCF]/10 text-[#CFCFCF] rounded-full text-xs border border-[#CFCFCF]/20">
                                +{tool.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-3 border-t border-[#00FFE0]/10">
                          <Link
                            href={`/tools/${tool.slug}`}
                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#B936F4]/20 text-[#B936F4] rounded-lg hover:bg-[#B936F4]/30 transition-all duration-200 text-sm cursor-pointer hover:scale-105"
                            title="View tool details"
                          >
                            <EyeIcon className="w-4 h-4" />
                            View
                          </Link>
                          <Link
                            href={`/admin/tools/edit/${tool._id}`}
                            className="flex items-center justify-center gap-1 px-3 py-2 bg-[#00FFE0]/20 text-[#00FFE0] rounded-lg hover:bg-[#00FFE0]/30 transition-all duration-200 text-sm cursor-pointer hover:scale-105"
                            title="Edit tool"
                          >
                            <PencilIcon className="w-4 h-4" />
                            Edit
                          </Link>
                          <button
                            onClick={() => openDeleteModal(tool)}
                            className="flex items-center justify-center gap-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all duration-200 text-sm cursor-pointer hover:scale-105"
                            title="Delete tool"
                          >
                            <TrashIcon className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            {filteredTools.length === 0 && tools.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 bg-[#0A0F24]/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MagnifyingGlassIcon className="w-12 h-12 text-[#00FFE0]" />
                </div>
                <h3 className="text-xl font-bold text-[#F5F5F5] mb-2">No Tools Found</h3>
                <p className="text-[#CFCFCF] mb-6">
                  Try adjusting your search or filter criteria.
                </p>
              </motion.div>
            )}

            {tools.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-24 h-24 bg-[#0A0F24]/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <SparklesIcon className="w-12 h-12 text-[#00FFE0]" />
                </div>
                <h3 className="text-xl font-bold text-[#F5F5F5] mb-2">No Tools Found</h3>
                <p className="text-[#CFCFCF] mb-6">
                  Start by adding your first AI tool to the directory.
                </p>
                <button
                  onClick={() => router.push('/admin/tools/new')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-colors font-semibold"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add Your First Tool
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedTool && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 cursor-default"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0A0F24] border border-red-500/30 rounded-2xl p-8 max-w-md w-full mx-4"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#F5F5F5]">Delete Tool</h3>
                  <p className="text-[#CFCFCF]">This action cannot be undone</p>
                </div>
              </div>

              <p className="text-[#CFCFCF] mb-6">
                Are you sure you want to delete &quot;{selectedTool.name}&quot;? This will permanently remove the tool from the directory.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 bg-[#0A0F24] border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 transition-all duration-200 font-medium cursor-pointer hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTool}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 font-medium cursor-pointer hover:scale-105"
                >
                  Delete Tool
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
} 
