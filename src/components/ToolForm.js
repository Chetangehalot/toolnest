'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  PhotoIcon,
  TagIcon,
  Cog6ToothIcon as CogIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import FileUpload from '@/components/FileUpload';
import ChipInput from '@/components/ChipInput';

export default function ToolForm({ 
  initialData = null, 
  onSubmit, 
  isLoading = false, 
  error = null, 
  success = false,
  mode = 'add' // 'add' or 'edit'
}) {
  const [activeTab, setActiveTab] = useState('basic');
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    media: true,
    tags: true,
    specs: true
  });
  
  // Complete form data structure
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: '',
    subcategory: '',
    website: '',
    price: 'Free',
    image: '',
    logo: '',
    tags: [],
    pros: [],
    cons: [],
    specifications: {
      difficulty: 'Beginner',
      features: [],
      integrations: [],
      API: false,
      languagesSupported: [],
      platform: [],
      pricing: {
        free: false,
        paid: false,
        freemium: false
      }
    },
    rating: 0,
    featured: false,
    trending: false
  });

  // Form options
  const categories = ['Text', 'Image', 'Audio', 'Video', 'Code', 'Data', 'Other'];
  const priceOptions = ['Free', 'Freemium', 'Paid', 'Subscription'];
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || '',
        description: initialData.description || '',
        category: initialData.category || '',
        subcategory: initialData.subcategory || '',
        website: initialData.website || initialData.url || '',
        price: initialData.price || 'Free',
        image: initialData.image || '',
        logo: initialData.logo || '',
        tags: initialData.tags || [],
        pros: initialData.pros || [],
        cons: initialData.cons || [],
        specifications: {
          difficulty: initialData.specifications?.difficulty || 'Beginner',
          features: initialData.specifications?.features || [],
          integrations: initialData.specifications?.integrations || [],
          API: initialData.specifications?.API || false,
          languagesSupported: initialData.specifications?.languagesSupported || [],
          platform: initialData.specifications?.platform || [],
          pricing: {
            free: initialData.specifications?.pricing?.free || false,
            paid: initialData.specifications?.pricing?.paid || false,
            freemium: initialData.specifications?.pricing?.freemium || false
          }
        },
        rating: initialData.rating || 0,
        featured: initialData.featured || false,
        trending: initialData.trending || false
      });
    }
  }, [initialData]);

  // File upload handler
  const uploadFile = async (file) => {
    try {
      // Validate file before upload
      if (!file) {
        throw new Error('No file selected');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.');
      }

      // Validate file size (5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('File size too large. Maximum size is 5MB.');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.url) {
        throw new Error(data.error || 'Upload failed - no URL returned');
      }

      return data.url;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error(error.message || 'Failed to upload file. Please try again.');
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Generate slug from name if in add mode
    let slug = formData.slug;
    if (mode === 'add' && formData.name) {
      slug = formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    // Create clean payload
    const payload = {
      ...formData,
      slug,
      url: formData.website, // Ensure URL field is set
      // Trim all string values
      name: formData.name.trim(),
      description: formData.description.trim(),
      website: formData.website.trim(),
      subcategory: formData.subcategory.trim()
    };

    onSubmit(payload);
  };

  // Input change handlers
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const parts = name.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: type === 'checkbox' ? checked : value
          }
        }));
      } else if (parts.length === 3) {
        const [parent, child, grandchild] = parts;
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [grandchild]: type === 'checkbox' ? checked : value
            }
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // These functions are no longer needed as we're using ChipInput component
  // const handleArrayInput = (field, value) => { ... }
  // const handleSpecificationArrayInput = (field, value) => { ... }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const tabs = [
    { id: 'basic', name: 'Basic Info', icon: SparklesIcon },
    { id: 'media', name: 'Media', icon: PhotoIcon },
    { id: 'tags', name: 'Tags & Categories', icon: TagIcon },
    { id: 'specs', name: 'Specifications', icon: CogIcon }
  ];

  return (
    <div className="space-y-8">
      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400"
          >
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="w-5 h-5" />
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-2"
      >
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#00FFE0] text-[#0A0F24]'
                  : 'text-[#CFCFCF] hover:text-[#F5F5F5] hover:bg-[#0A0F24]/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Form */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info Section */}
          {activeTab === 'basic' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              {/* Basic Information */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-[#F5F5F5] flex items-center gap-2">
                    <SparklesIcon className="w-5 h-5 text-[#00FFE0]" />
                    Basic Information
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggleSection('basic')}
                    className="text-[#CFCFCF] hover:text-[#F5F5F5] transition-colors cursor-pointer"
                    title={expandedSections.basic ? "Collapse section" : "Expand section"}
                  >
                    {expandedSections.basic ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                  </button>
                </div>

                <AnimatePresence>
                  {expandedSections.basic && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-[#F5F5F5] mb-2">
                            Tool Name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] placeholder-[#CFCFCF] focus:border-[#00FFE0] focus:outline-none transition-all duration-200 cursor-text"
                            placeholder="Enter tool name"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Category</label>
                          <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] focus:border-[#00FFE0] focus:outline-none cursor-pointer transition-all duration-200"
                          >
                            <option value="">Select category</option>
                            {categories.map(category => (
                              <option key={category} value={category}>{category}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Subcategory</label>
                        <input
                          type="text"
                          name="subcategory"
                          value={formData.subcategory}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] placeholder-[#CFCFCF] focus:border-[#00FFE0] focus:outline-none transition-all duration-200 cursor-text"
                          placeholder="Enter subcategory (optional)"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#F5F5F5] mb-2">
                          Description <span className="text-red-400">*</span>
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full px-4 py-3 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] placeholder-[#CFCFCF] focus:border-[#00FFE0] focus:outline-none transition-all duration-200 cursor-text resize-y"
                          placeholder="Describe the tool and its features"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Website URL</label>
                          <input
                            type="url"
                            name="website"
                            value={formData.website}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] placeholder-[#CFCFCF] focus:border-[#00FFE0] focus:outline-none transition-all duration-200 cursor-text"
                            placeholder="https://example.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Price</label>
                          <select
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] focus:border-[#00FFE0] focus:outline-none cursor-pointer transition-all duration-200"
                          >
                            {priceOptions.map(price => (
                              <option key={price} value={price}>{price}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Pros and Cons */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ChipInput
                          label="Pros"
                          value={formData.pros}
                          onChange={(value) => setFormData(prev => ({ ...prev, pros: value }))}
                          placeholder="Easy to use, Fast processing, Great results"
                          helperText="Type advantages and press Enter or comma to add"
                        />
                        <ChipInput
                          label="Cons"
                          value={formData.cons}
                          onChange={(value) => setFormData(prev => ({ ...prev, cons: value }))}
                          placeholder="Limited free tier, Complex setup, Expensive"
                          helperText="Type disadvantages and press Enter or comma to add"
                        />
                      </div>

                      {/* Settings */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="featured"
                            checked={formData.featured}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-[#00FFE0] bg-[#0A0F24] border-[#00FFE0]/20 rounded focus:ring-[#00FFE0] focus:ring-2 cursor-pointer"
                          />
                          <label className="text-sm font-medium text-[#F5F5F5] cursor-pointer" title="Mark as featured tool">Featured Tool</label>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="trending"
                            checked={formData.trending}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-[#00FFE0] bg-[#0A0F24] border-[#00FFE0]/20 rounded focus:ring-[#00FFE0] focus:ring-2 cursor-pointer"
                          />
                          <label className="text-sm font-medium text-[#F5F5F5] cursor-pointer" title="Mark as trending tool">Trending</label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Rating</label>
                          <input
                            type="number"
                            name="rating"
                            value={formData.rating}
                            onChange={handleInputChange}
                            min="0"
                            max="5"
                            step="0.1"
                            className="w-full px-4 py-3 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] placeholder-[#CFCFCF] focus:border-[#00FFE0] focus:outline-none"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <PhotoIcon className="w-5 h-5 text-[#00FFE0]" />
                <h3 className="text-xl font-semibold text-[#F5F5F5]">Media Assets</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FileUpload
                  label="Tool Image"
                  value={formData.image}
                  onChange={(value) => setFormData(prev => ({ ...prev, image: value }))}
                  onUpload={uploadFile}
                  type="image"
                />
                <FileUpload
                  label="Tool Logo"
                  value={formData.logo}
                  onChange={(value) => setFormData(prev => ({ ...prev, logo: value }))}
                  onUpload={uploadFile}
                  type="logo"
                />
              </div>
            </motion.div>
          )}

          {/* Tags & Categories Tab */}
          {activeTab === 'tags' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <TagIcon className="w-5 h-5 text-[#00FFE0]" />
                <h3 className="text-xl font-semibold text-[#F5F5F5]">Tags & Categorization</h3>
              </div>

              <ChipInput
                label="Tags"
                value={formData.tags}
                onChange={(value) => setFormData(prev => ({ ...prev, tags: value }))}
                placeholder="AI, text generation, writing, productivity"
                helperText="Add relevant tags to help users discover this tool"
              />
            </motion.div>
          )}

          {/* Specifications Tab */}
          {activeTab === 'specs' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 mb-6">
                <CogIcon className="w-5 h-5 text-[#00FFE0]" />
                <h3 className="text-xl font-semibold text-[#F5F5F5]">Technical Specifications</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#F5F5F5] mb-2">Difficulty Level</label>
                  <select
                    name="specifications.difficulty"
                    value={formData.specifications.difficulty}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] focus:border-[#00FFE0] focus:outline-none"
                  >
                    {difficulties.map(difficulty => (
                      <option key={difficulty} value={difficulty}>{difficulty}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="specifications.API"
                    checked={formData.specifications.API}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-[#00FFE0] bg-[#0A0F24] border-[#00FFE0]/20 rounded focus:ring-[#00FFE0] focus:ring-2"
                  />
                  <label className="text-sm font-medium text-[#F5F5F5]">API Available</label>
                </div>
              </div>

              <ChipInput
                label="Features"
                value={formData.specifications.features}
                onChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  specifications: { ...prev.specifications, features: value }
                }))}
                placeholder="Real-time collaboration, Export options, Templates"
                helperText="Add key features and capabilities"
              />

              <ChipInput
                label="Integrations"
                value={formData.specifications.integrations}
                onChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  specifications: { ...prev.specifications, integrations: value }
                }))}
                placeholder="Slack, Discord, Zapier, Google Drive"
                helperText="Add supported integrations and APIs"
              />

              <ChipInput
                label="Supported Languages"
                value={formData.specifications.languagesSupported}
                onChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  specifications: { ...prev.specifications, languagesSupported: value }
                }))}
                placeholder="English, Spanish, French, German, Chinese"
                helperText="Add languages supported by the tool"
              />

              <ChipInput
                label="Supported Platforms"
                value={formData.specifications.platform}
                onChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  specifications: { ...prev.specifications, platform: value }
                }))}
                placeholder="Web, iOS, Android, Desktop, API"
                helperText="Add platforms where the tool is available"
              />

              <div>
                <label className="block text-sm font-medium text-[#F5F5F5] mb-4">Pricing Model</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="specifications.pricing.free"
                      checked={formData.specifications.pricing.free}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#00FFE0] bg-[#0A0F24] border-[#00FFE0]/20 rounded focus:ring-[#00FFE0] focus:ring-2"
                    />
                    <label className="text-sm font-medium text-[#F5F5F5]">Free Tier</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="specifications.pricing.freemium"
                      checked={formData.specifications.pricing.freemium}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#00FFE0] bg-[#0A0F24] border-[#00FFE0]/20 rounded focus:ring-[#00FFE0] focus:ring-2"
                    />
                    <label className="text-sm font-medium text-[#F5F5F5]">Freemium</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="specifications.pricing.paid"
                      checked={formData.specifications.pricing.paid}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#00FFE0] bg-[#0A0F24] border-[#00FFE0]/20 rounded focus:ring-[#00FFE0] focus:ring-2"
                    />
                    <label className="text-sm font-medium text-[#F5F5F5]">Paid Only</label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-8 border-t border-[#00FFE0]/10">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#00FFE0] to-[#B936F4] text-[#0A0F24] rounded-xl font-semibold transition-all duration-200 relative overflow-hidden ${
                isLoading 
                  ? 'cursor-wait opacity-70' 
                  : 'cursor-pointer hover:from-[#00FFE0]/90 hover:to-[#B936F4]/90 hover:scale-105'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#0A0F24] border-t-transparent rounded-full animate-spin"></div>
                  <span className="relative">
                    {mode === 'add' ? 'Creating Tool...' : 'Saving Changes...'}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00FFE0]/80 to-[#B936F4]/80 animate-pulse"></div>
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  <span>{mode === 'add' ? 'Create Tool' : 'Save Changes'}</span>
                </>
              )}
            </button>
            
            {isLoading && (
              <div className="flex items-center gap-2 px-4 py-3 bg-[#0A0F24]/50 border border-[#00FFE0]/20 rounded-xl text-[#CFCFCF] text-sm cursor-wait">
                <div className="w-4 h-4 border-2 border-[#00FFE0] border-t-transparent rounded-full animate-spin"></div>
                Please wait, processing your request...
              </div>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
} 
