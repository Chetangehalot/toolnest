"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudArrowUpIcon, 
  PhotoIcon, 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

export default function FileUpload({ 
  label, 
  value, 
  onChange, 
  onUpload, 
  type = 'image', // 'image' or 'logo'
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB
  className = ''
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(value);
  const [urlInput, setUrlInput] = useState(value || '');
  const fileInputRef = useRef(null);

  const aspectRatio = type === 'logo' ? '1:1' : '16:9';
  const maxWidth = type === 'logo' ? 200 : 400;
  const maxHeight = type === 'logo' ? 200 : 225;

  // Check if the current value is a placeholder
  const isPlaceholder = (url) => {
    if (!url) return true;
    return url.includes('/images/placeholder-logo') || 
           url.includes('/images/placeholder-image') ||
           url === '/images/placeholder-logo.png' || 
           url === '/images/placeholder-logo.svg' ||
           url === '/images/placeholder-logo.jpeg' ||
           url === '/images/placeholder-image.jpeg';
  };

  // Check if the current value is an uploaded file (from our system)
  const isUploadedFile = (url) => {
    if (!url) return false;
    // Files uploaded through our system are stored in /uploads/ directory
    return url.startsWith('/uploads/') || url.includes('/uploads/');
  };

  // Determine initial upload mode based on current value
  const getInitialUploadMode = (value) => {
    // If value is empty or is a placeholder, default to 'upload' mode
    if (!value || isPlaceholder(value)) {
      return 'upload';
    }
    
    // If value is an uploaded file from our system, use 'upload' mode
    if (isUploadedFile(value)) {
      return 'upload';
    }
    
    // If value is an external URL (starts with http/https), use 'url' mode
    if (value.startsWith('http://') || value.startsWith('https://')) {
      return 'url';
    }
    
    // Default to 'upload' mode for any other case
    return 'upload';
  };

  const [uploadMode, setUploadMode] = useState(() => getInitialUploadMode(value));

  // Update preview and urlInput when value changes
  useEffect(() => {
    setPreview(value);
    setUrlInput(value || '');
    
    // Always update upload mode based on the new value
    const newMode = getInitialUploadMode(value);
    setUploadMode(newMode);
  }, [value]);

  const validateFile = (file) => {
    setError('');
    
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return false;
    }
    
    if (file.size > maxSize) {
      setError(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
      return false;
    }
    
    return true;
  };

  const handleFileSelect = useCallback(async (file) => {
    if (!validateFile(file)) return;

    setIsUploading(true);
    setError('');

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);

      // Upload file
      if (onUpload) {
        const uploadedUrl = await onUpload(file);
        onChange(uploadedUrl);
        setUrlInput(uploadedUrl);
      } else {
        // If no upload function, just use the file name as a placeholder
        onChange(file.name);
        setUrlInput(file.name);
      }
    } catch (err) {
      setError('Failed to upload file. Please try again.');
      console.error('Upload error:', err);
      setPreview('');
    } finally {
      setIsUploading(false);
    }
  }, [onUpload, onChange, maxSize]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setUploadMode('upload');
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = () => {
    setUploadMode('upload');
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    setUrlInput(url);
    onChange(url);
    setPreview(url);
    setError('');
  };

  const removeFile = () => {
    setPreview('');
    setUrlInput('');
    onChange('');
    setError('');
    setUploadMode('upload'); // Switch to upload mode when removing
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const switchMode = (mode) => {
    setUploadMode(mode);
    setError('');
    if (mode === 'upload' && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Show preview only if we have a valid non-placeholder image
  const shouldShowPreview = preview && !isPlaceholder(preview);

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-[#F5F5F5] mb-3">
        {label}
        {type === 'logo' ? (
          <span className="block text-xs text-[#CFCFCF] mt-1 font-normal">
            Square format recommended (1:1 ratio)
          </span>
        ) : (
          <span className="block text-xs text-[#CFCFCF] mt-1 font-normal">
            Landscape format recommended (16:9 ratio)
          </span>
        )}
      </label>
      
      {/* Mode Toggle */}
      <div className="flex bg-[#0A0F24]/50 rounded-lg p-1 border border-[#00FFE0]/20">
        <button
          type="button"
          onClick={() => switchMode('url')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
            uploadMode === 'url'
              ? 'bg-[#00FFE0] text-[#0A0F24]'
              : 'text-[#CFCFCF] hover:text-[#F5F5F5]'
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          URL
        </button>
        <button
          type="button"
          onClick={() => switchMode('upload')}
          className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
            uploadMode === 'upload'
              ? 'bg-[#00FFE0] text-[#0A0F24]'
              : 'text-[#CFCFCF] hover:text-[#F5F5F5]'
          }`}
        >
          <CloudArrowUpIcon className="w-4 h-4" />
          Upload
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* URL Input Mode */}
      {uploadMode === 'url' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <input
            type="url"
            value={isPlaceholder(urlInput) || isUploadedFile(urlInput) ? '' : urlInput}
            onChange={handleUrlChange}
            placeholder={`https://example.com/${type === 'logo' ? 'logo.png' : 'image.jpg'}`}
            className="w-full px-4 py-3 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] placeholder-[#CFCFCF] focus:border-[#00FFE0] focus:outline-none"
          />
        </motion.div>
      )}

      {/* Upload Mode */}
      {uploadMode === 'upload' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer ${
            isDragOver 
              ? 'border-[#00FFE0] bg-[#00FFE0]/10' 
              : 'border-[#00FFE0]/30 hover:border-[#00FFE0]/50'
          } ${
            type === 'logo' 
              ? 'w-full max-w-xs mx-auto h-64' 
              : 'w-full min-h-[12rem] aspect-video max-w-2xl mx-auto'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            {isUploading ? (
              <div className="space-y-3">
                <div className="w-10 h-10 border-2 border-[#00FFE0] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-[#00FFE0] font-medium">Uploading...</p>
                <p className="text-xs text-[#CFCFCF]">Please wait</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`${type === 'logo' ? 'space-y-3' : 'space-y-3'}`}>
                  <CloudArrowUpIcon className={`${type === 'logo' ? 'w-12 h-12' : 'w-10 h-10'} text-[#00FFE0] mx-auto`} />
                  <div className="space-y-2">
                    <p className={`${type === 'logo' ? 'text-base' : 'text-base'} text-[#F5F5F5] font-medium`}>
                      {isDragOver ? 'Drop image here' : 'Upload your image'}
                    </p>
                    <p className={`${type === 'logo' ? 'text-sm' : 'text-sm'} text-[#CFCFCF]`}>
                      {type === 'logo' ? 'Square format recommended' : 'Landscape format recommended'}
                    </p>
                    {type === 'logo' ? (
                      <p className="text-xs text-[#CFCFCF]/80">
                        JPG, PNG or SVG • Max 5MB
                      </p>
                    ) : (
                      <p className="text-xs text-[#CFCFCF]/80">
                        JPG, PNG or WebP • Max 5MB • 16:9 ratio preferred
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="pt-2">
                  <button
                    type="button"
                    className={`${
                      type === 'logo' 
                        ? 'px-6 py-2.5 text-sm' 
                        : 'px-6 py-2.5 text-sm'
                    } bg-[#00FFE0]/20 text-[#00FFE0] rounded-lg hover:bg-[#00FFE0]/30 transition-colors font-medium border border-[#00FFE0]/30`}
                  >
                    Browse Files
                  </button>
                </div>
                
                <div className="text-xs text-[#CFCFCF]/60 pt-2">
                  Drag and drop or click to browse
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Preview */}
      <AnimatePresence>
        {shouldShowPreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative"
          >
            <div 
              className={`relative bg-[#0A0F24] border-2 border-[#00FFE0]/30 rounded-xl overflow-hidden ${
                type === 'logo' 
                  ? 'w-40 h-40 mx-auto' 
                  : 'w-full aspect-video max-w-lg mx-auto'
              }`}
            >
              <img
                src={preview}
                alt="Preview"
                className={`w-full h-full ${
                  type === 'logo' ? 'object-contain p-2' : 'object-cover'
                }`}
                onError={() => {
                  setError('Failed to load image');
                  setPreview('');
                }}
              />
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadMode('upload')}
                    className="p-2 bg-[#00FFE0]/20 text-[#00FFE0] rounded-lg hover:bg-[#00FFE0]/30 transition-colors border border-[#00FFE0]/30"
                    title="Change image"
                  >
                    <PhotoIcon className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30"
                    title="Remove image"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Upload status */}
              {isUploading && (
                <div className="absolute top-2 right-2">
                  <div className="w-6 h-6 border-2 border-[#00FFE0] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            {/* Preview label */}
            {type === 'image' && (
              <p className="text-center text-xs text-[#CFCFCF] mt-2">
                Tool Image Preview
              </p>
            )}
            {type === 'logo' && (
              <p className="text-center text-xs text-[#CFCFCF] mt-2">
                Logo Preview
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3"
        >
          <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Success message */}
      {shouldShowPreview && !isUploading && !error && uploadMode === 'upload' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-lg p-3"
        >
          <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
          Image uploaded successfully
        </motion.div>
      )}
    </div>
  );
} 
