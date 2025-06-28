'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  EyeIcon,
  PhotoIcon,
  TagIcon,
  FolderIcon,
  GlobeAltIcon,
  ClockIcon,
  DocumentTextIcon,
  PlusIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import RichTextEditor from './RichTextEditor';
import ConfirmModal from '../ui/ConfirmModal';

export default function BlogEditor({ 
  postId = null, 
  initialData = null,
  onBack,
  mode = 'create'
}) {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    categories: [],
    tags: [],
    featuredImage: '',
    seoTitle: '',
    seoDescription: '',
    allowComments: true,
    status: 'draft'
  });
  
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [draftToRestore, setDraftToRestore] = useState(null);
  const [lastAutoSave, setLastAutoSave] = useState(null);
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'Confirm',
    onConfirm: null
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        slug: initialData.slug || '',
        content: initialData.content || '',
        excerpt: initialData.excerpt || '',
        categories: initialData.categories?.map(cat => cat._id || cat) || [],
        tags: initialData.tags || [],
        featuredImage: initialData.featuredImage || '',
        seoTitle: initialData.seoTitle || '',
        seoDescription: initialData.seoDescription || '',
        allowComments: initialData.allowComments !== false,
        status: initialData.status || 'draft'
      });
    } else {
      // Check for saved draft in localStorage
      checkForSavedDraft();
    }
    fetchCategories();
  }, [initialData]);

  // Auto-save effect
  useEffect(() => {
    if (!formData.title && !formData.content) return; // Don't auto-save empty content
    
    const autoSaveTimer = setTimeout(() => {
      autoSaveDraft();
    }, 10000); // Auto-save every 10 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [formData.title, formData.content, formData.excerpt]);

  const getDraftKey = () => {
    const userId = session?.user?.id || 'anonymous';
    const postSlug = formData.slug || formData.title?.toLowerCase().replace(/\s+/g, '-') || 'new';
    return `draft-${userId}-${postSlug}`;
  };

  const checkForSavedDraft = () => {
    try {
      const draftKey = getDraftKey();
      const savedDraft = localStorage.getItem(draftKey);
      
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        // Check if draft is recent (within 24 hours)
        const draftAge = Date.now() - parsedDraft.timestamp;
        const isRecent = draftAge < 24 * 60 * 60 * 1000; // 24 hours
        
        if (isRecent && (parsedDraft.title || parsedDraft.content)) {
          setDraftToRestore(parsedDraft);
          setShowRestorePrompt(true);
        }
      }
    } catch (error) {
      console.error('Error checking for saved draft:', error);
    }
  };

  const autoSaveDraft = async () => {
    if (!formData.title && !formData.content) return;
    
    try {
      setAutoSaveStatus('saving');
      
      const draftData = {
        ...formData,
        timestamp: Date.now(),
        autoSaved: true
      };
      
      const draftKey = getDraftKey();
      localStorage.setItem(draftKey, JSON.stringify(draftData));
      
      setAutoSaveStatus('saved');
      setLastAutoSave(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('error');
    }
  };

  const clearDraft = () => {
    try {
      const draftKey = getDraftKey();
      localStorage.removeItem(draftKey);
    } catch (error) {
      console.error('Error clearing draft:', error);
    }
  };

  const restoreDraft = () => {
    if (draftToRestore) {
      setFormData({
        title: draftToRestore.title || '',
        slug: draftToRestore.slug || '',
        content: draftToRestore.content || '',
        excerpt: draftToRestore.excerpt || '',
        categories: draftToRestore.categories || [],
        tags: draftToRestore.tags || [],
        featuredImage: draftToRestore.featuredImage || '',
        seoTitle: draftToRestore.seoTitle || '',
        seoDescription: draftToRestore.seoDescription || '',
        allowComments: draftToRestore.allowComments !== false,
        status: draftToRestore.status || 'draft'
      });
    }
    setShowRestorePrompt(false);
    setDraftToRestore(null);
  };

  const discardDraft = () => {
    clearDraft();
    setShowRestorePrompt(false);
    setDraftToRestore(null);
  };

  // Confirmation modal helpers
  const openConfirmModal = (config) => {
    setConfirmModal({
      isOpen: true,
      ...config
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      isOpen: false,
      type: 'info',
      title: '',
      message: '',
      confirmText: 'Confirm',
      onConfirm: null
    });
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'title' && !formData.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');
      setFormData(prev => ({
        ...prev,
        slug
      }));
    }
    
    if (field === 'title' && !formData.seoTitle) {
      setFormData(prev => ({
        ...prev,
        seoTitle: value.slice(0, 60)
      }));
    }
    
    if (field === 'excerpt' && !formData.seoDescription) {
      setFormData(prev => ({
        ...prev,
        seoDescription: value.slice(0, 160)
      }));
    }
  };

  const handleSave = async (status = 'draft') => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const saveData = { ...formData, status };
      let response;

      if (mode === 'edit' && postId) {
        response = await fetch(`/api/blog/posts/${postId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saveData)
        });
      } else {
        response = await fetch('/api/blog/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saveData)
        });
      }

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('❌ Server error:', responseData);
        throw new Error(responseData.error || responseData.details || 'Failed to save post');
      }

      // Clear auto-saved draft on successful save
      clearDraft();

      let message = 'Post saved successfully!';
      if (status === 'pending_approval') {
        message = 'Post submitted for approval!';
      } else if (status === 'published') {
        message = 'Post published successfully!';
      }
      
      // Show success message via console (toast system will handle UI feedback)
      if (onBack) {
        onBack();
      } else {
        const dashboardPath = ['manager', 'admin'].includes(session?.user?.role) 
          ? '/admin/blogs' 
          : '/writer/dashboard';
        router.push(dashboardPath);
      }
      
    } catch (error) {
      console.error('💥 Blog save failed:', error);
      setError(error.message || 'Failed to save post. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      if (!response.ok) throw new Error('Failed to upload image');

      const data = await response.json();
      handleInputChange('featuredImage', data.url);
    } catch (error) {
      console.error('Failed to upload image:', error);
      setError('Failed to upload image');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    
    try {
      const response = await fetch('/api/blog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.trim() })
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('❌ Category creation error:', responseData);
        throw new Error(responseData.error || responseData.details || 'Failed to create category');
      }
      
      setCategories(prev => [...prev, responseData.category]);
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, responseData.category._id]
      }));
      setNewCategory('');
      setShowCategoryForm(false);
      
      } catch (error) {
      console.error('💥 Category creation failed:', error);
      }
  };

  const handleAddTag = () => {
    if (!newTag.trim() || formData.tags.includes(newTag.trim().toLowerCase())) return;
    
    const tag = newTag.trim().toLowerCase();
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tag]
    }));
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const canPublishDirectly = ['manager', 'admin'].includes(session?.user?.role);
  const isWriter = session?.user?.role === 'writer';

  return (
    <div className="min-h-screen bg-[#0A0F24] pt-20 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold text-[#F5F5F5]">
                  {mode === 'edit' ? 'Edit Post' : 'Create New Post'}
                </h1>
                <p className="text-[#CFCFCF]">
                  {canPublishDirectly 
                    ? 'Write and publish your blog post' 
                    : 'Write your blog post and submit for approval'
                  }
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#B936F4]/20 text-[#B936F4] border border-[#B936F4]/30 rounded-xl hover:bg-[#B936F4]/30 transition-colors cursor-pointer hover:scale-105 duration-200"
                >
                  <EyeIcon className="w-5 h-5" />
                  {previewMode ? 'Edit' : 'Preview'}
                </button>
                
                {/* Auto-save Status */}
                <div className="flex items-center gap-2 text-sm">
                  {autoSaveStatus === 'saving' && (
                    <div className="flex items-center gap-2 text-yellow-400">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      <span>Auto-saving...</span>
                    </div>
                  )}
                  {autoSaveStatus === 'saved' && lastAutoSave && (
                    <div className="flex items-center gap-2 text-green-400">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Saved {lastAutoSave.toLocaleTimeString()}</span>
                    </div>
                  )}
                  {autoSaveStatus === 'error' && (
                    <div className="flex items-center gap-2 text-red-400">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span>Auto-save failed</span>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={onBack || (() => router.back())}
                  className="flex items-center gap-2 px-6 py-3 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 transition-all duration-200 cursor-pointer hover:scale-105"
                >
                  <ArrowLeftIcon className="w-5 h-5" />
                  Back
                </button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
              >
                <div className="flex items-center gap-2 text-red-400">
                  <ExclamationTriangleIcon className="w-5 h-5" />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-red-300/80 text-sm mt-1">{error}</p>
              </motion.div>
            )}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-2">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8"
              >
                {!previewMode ? (
                  <div className="space-y-8">
                    {/* Title Section */}
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-[#F5F5F5] flex items-center gap-2">
                        <DocumentTextIcon className="w-6 h-6" />
                        Post Details
                      </h2>
                      
                      <div>
                        <label className="block text-[#F5F5F5] text-sm font-medium mb-2">
                          Title *
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          placeholder="Enter your post title..."
                          className="w-full px-4 py-3 bg-white/95 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#00FFE0] focus:ring-2 focus:ring-[#00FFE0]/20 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-[#F5F5F5] text-sm font-medium mb-2">
                          URL Slug
                        </label>
                        <input
                          type="text"
                          value={formData.slug}
                          onChange={(e) => handleInputChange('slug', e.target.value)}
                          placeholder="url-friendly-slug"
                          className="w-full px-4 py-3 bg-white/95 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#00FFE0] focus:ring-2 focus:ring-[#00FFE0]/20 transition-colors"
                        />
                        <p className="text-[#CFCFCF] text-xs mt-1">
                          This will be auto-generated from the title if left empty
                        </p>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold text-[#F5F5F5] flex items-center gap-2">
                        <PencilIcon className="w-6 h-6" />
                        Content
                      </h2>
                      
                      <div>
                        <label className="block text-[#F5F5F5] text-sm font-medium mb-2">
                          Content *
                        </label>
                        <div className="bg-white/95 border border-gray-300 rounded-xl overflow-hidden">
                          <RichTextEditor
                            value={formData.content}
                            onChange={(value) => handleInputChange('content', value)}
                            placeholder="Start writing your amazing post..."
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[#F5F5F5] text-sm font-medium mb-2">
                          Excerpt
                        </label>
                        <textarea
                          value={formData.excerpt}
                          onChange={(e) => handleInputChange('excerpt', e.target.value)}
                          placeholder="Brief description of your post..."
                          rows={3}
                          className="w-full px-4 py-3 bg-white/95 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#00FFE0] focus:ring-2 focus:ring-[#00FFE0]/20 resize-none transition-colors"
                        />
                        <p className="text-[#CFCFCF] text-xs mt-1">
                          A short summary that appears in post previews
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none">
                    <h1 className="text-3xl font-bold text-[#F5F5F5] mb-4">{formData.title}</h1>
                    {formData.excerpt && (
                      <p className="text-[#CFCFCF] text-lg mb-6">{formData.excerpt}</p>
                    )}
                    <div 
                      className="text-[#F5F5F5] prose prose-invert prose-lg max-w-none
                        prose-headings:text-[#F5F5F5] prose-headings:font-bold
                        prose-p:text-[#CFCFCF] prose-p:leading-relaxed
                        prose-a:text-[#00FFE0] prose-a:no-underline hover:prose-a:underline
                        prose-strong:text-[#F5F5F5] prose-em:text-[#CFCFCF]
                        prose-blockquote:border-l-[#00FFE0] prose-blockquote:bg-[#0A0F24]/30 prose-blockquote:p-4 prose-blockquote:rounded-r-xl
                        prose-code:text-[#00FFE0] prose-code:bg-[#0A0F24]/50 prose-code:px-2 prose-code:py-1 prose-code:rounded
                        prose-pre:bg-[#0A0F24]/50 prose-pre:border prose-pre:border-[#00FFE0]/20
                        prose-ul:text-[#CFCFCF] prose-ol:text-[#CFCFCF]
                        prose-li:text-[#CFCFCF]"
                      dangerouslySetInnerHTML={{ __html: formData.content }}
                    />
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Featured Image */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4 flex items-center gap-2">
                  <PhotoIcon className="w-5 h-5" />
                  Featured Image
                </h3>
                
                {formData.featuredImage ? (
                  <div className="space-y-3">
                    <img
                      src={formData.featuredImage}
                      alt="Featured"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleInputChange('featuredImage', '')}
                      className="w-full px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="featured-image"
                    />
                    <label
                      htmlFor="featured-image"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#00FFE0]/30 rounded-lg cursor-pointer hover:border-[#00FFE0]/50 transition-colors"
                    >
                      <PhotoIcon className="w-8 h-8 text-[#00FFE0]/50 mb-2" />
                      <span className="text-[#CFCFCF] text-sm">Click to upload image</span>
                    </label>
                  </div>
                )}
              </motion.div>

              {/* Categories */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-[#F5F5F5] flex items-center gap-2">
                    <FolderIcon className="w-5 h-5" />
                    Categories
                  </h3>
                  {(['manager', 'admin'].includes(session?.user?.role)) && (
                    <button
                      onClick={() => setShowCategoryForm(!showCategoryForm)}
                      className="text-[#00FFE0] hover:text-[#00FFE0]/80 transition-colors"
                    >
                      <PlusIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                {showCategoryForm && (
                  <div className="mb-4 p-3 bg-[#0A0F24]/30 rounded-lg">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Category name"
                        className="flex-1 px-3 py-2 bg-white/95 border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:border-[#00FFE0]"
                      />
                      <button
                        onClick={handleAddCategory}
                        className="px-3 py-2 bg-[#00FFE0] text-[#0A0F24] rounded-lg text-sm font-medium hover:bg-[#00FFE0]/90 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {categories.map((category) => (
                    <label key={category._id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              categories: [...prev.categories, category._id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              categories: prev.categories.filter(id => id !== category._id)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-[#00FFE0] focus:ring-[#00FFE0] focus:ring-offset-0"
                      />
                      <span className="text-[#CFCFCF] text-sm">{category.name}</span>
                    </label>
                  ))}
                </div>
              </motion.div>

              {/* Tags */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4 flex items-center gap-2">
                  <TagIcon className="w-5 h-5" />
                  Tags
                </h3>
                
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      placeholder="Add a tag..."
                      className="flex-1 px-3 py-2 bg-white/95 border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:border-[#00FFE0]"
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-3 py-2 bg-[#B936F4] text-white rounded-lg text-sm font-medium hover:bg-[#B936F4]/90 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-[#B936F4]/20 text-[#B936F4] rounded-full text-sm border border-[#B936F4]/30"
                        >
                          #{tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-red-400 transition-colors"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>

              {/* SEO Settings */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4 flex items-center gap-2">
                  <GlobeAltIcon className="w-5 h-5" />
                  SEO Settings
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[#F5F5F5] text-sm font-medium mb-2">
                      SEO Title ({formData.seoTitle.length}/60)
                    </label>
                    <input
                      type="text"
                      value={formData.seoTitle}
                      onChange={(e) => handleInputChange('seoTitle', e.target.value.slice(0, 60))}
                      placeholder="SEO optimized title..."
                      className="w-full px-3 py-2 bg-white/95 border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:border-[#00FFE0]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[#F5F5F5] text-sm font-medium mb-2">
                      SEO Description ({formData.seoDescription.length}/160)
                    </label>
                    <textarea
                      value={formData.seoDescription}
                      onChange={(e) => handleInputChange('seoDescription', e.target.value.slice(0, 160))}
                      placeholder="SEO meta description..."
                      rows={3}
                      className="w-full px-3 py-2 bg-white/95 border border-gray-300 rounded-lg text-gray-900 text-sm placeholder-gray-500 focus:outline-none focus:border-[#00FFE0] resize-none"
                    />
                  </div>
                </div>
              </motion.div>

              {/* Publishing Actions */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold text-[#F5F5F5] mb-4 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5" />
                  Publishing
                </h3>
                
                <div className="space-y-3">
                  <button
                    onClick={() => openConfirmModal({
                      type: 'info',
                      title: 'Save as Draft',
                      message: 'This will save your post as a draft. You can continue editing it later.',
                      confirmText: 'Save Draft',
                      onConfirm: () => {
                        closeConfirmModal();
                        handleSave('draft');
                      }
                    })}
                    disabled={saving}
                    className="w-full px-4 py-3 bg-[#0A0F24]/30 text-[#CFCFCF] border border-[#00FFE0]/20 rounded-xl hover:border-[#00FFE0]/40 transition-colors disabled:opacity-50 font-medium"
                  >
                    {saving ? 'Saving...' : 'Save as Draft'}
                  </button>
                  
                  {isWriter ? (
                    <button
                      onClick={() => openConfirmModal({
                        type: 'info',
                        title: 'Submit for Approval',
                        message: 'This will submit your post for review by the editorial team. Do you want to submit this post?',
                        confirmText: 'Submit for Approval',
                        onConfirm: () => {
                          closeConfirmModal();
                          handleSave('pending_approval');
                        }
                      })}
                      disabled={saving}
                      className="w-full px-4 py-3 bg-[#B936F4] text-white rounded-xl hover:bg-[#B936F4]/90 transition-colors disabled:opacity-50 font-medium"
                    >
                      {saving ? 'Submitting...' : 'Submit for Approval'}
                    </button>
                  ) : (
                    <button
                      onClick={() => openConfirmModal({
                        type: 'success',
                        title: 'Publish Post',
                        message: 'This will publish your post immediately and make it visible to all users. Are you sure you want to publish?',
                        confirmText: 'Publish Now',
                        onConfirm: () => {
                          closeConfirmModal();
                          handleSave('published');
                        }
                      })}
                      disabled={saving}
                      className="w-full px-4 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-colors disabled:opacity-50 font-medium"
                    >
                      {saving ? 'Publishing...' : 'Publish Now'}
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Draft Restore Modal */}
      {showRestorePrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0A0F24] border border-[#00FFE0]/20 rounded-2xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-bold text-[#F5F5F5] mb-4">Restore Unsaved Draft?</h3>
            <p className="text-[#CFCFCF] mb-6">
              We found an unsaved draft from {draftToRestore?.timestamp ? 
                new Date(draftToRestore.timestamp).toLocaleString() : 'recently'}. 
              Would you like to restore it?
            </p>
            
            {draftToRestore && (
              <div className="bg-[#0A0F24]/30 border border-[#00FFE0]/10 rounded-xl p-4 mb-6">
                <h4 className="text-[#F5F5F5] font-medium mb-2">Draft Preview:</h4>
                <p className="text-[#CFCFCF] text-sm mb-2">
                  <strong>Title:</strong> {draftToRestore.title || 'Untitled'}
                </p>
                <p className="text-[#CFCFCF] text-sm">
                  <strong>Content:</strong> {draftToRestore.content ? 
                    `${draftToRestore.content.substring(0, 100)}...` : 'No content'}
                </p>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <button
                onClick={discardDraft}
                className="flex-1 px-4 py-2 bg-[#0A0F24]/30 border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 transition-colors"
              >
                Start Fresh
              </button>
              <button
                onClick={restoreDraft}
                className="flex-1 px-4 py-2 bg-[#00FFE0] text-[#0A0F24] rounded-xl hover:bg-[#00FFE0]/90 transition-colors font-semibold"
              >
                Restore Draft
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        type={confirmModal.type}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
      />
    </div>
  );
} 
