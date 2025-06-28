'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  DocumentTextIcon, 
  EyeIcon, 
  CloudArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    ['blockquote', 'code-block'],
    ['link', 'image', 'video'],
    [{ 'align': [] }],
    ['clean']
  ],
  clipboard: {
    matchVisual: false,
  }
};

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'list', 'bullet', 'indent',
  'blockquote', 'code-block', 'link', 'image', 'video', 'align'
];

export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Start writing your post...",
  onAutoSave,
  autoSaveInterval = 30000 // 30 seconds
}) {
  const [wordCount, setWordCount] = useState(0);
  const [readTime, setReadTime] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'error'
  const autoSaveRef = useRef(null);

  // Calculate word count and read time
  useEffect(() => {
    if (value) {
      // Remove HTML tags for accurate word count
      const textContent = value.replace(/<[^>]*>/g, '').trim();
      const words = textContent ? textContent.split(/\s+/).length : 0;
      const estimatedReadTime = Math.ceil(words / 200); // Average reading speed: 200 words/minute
      
      setWordCount(words);
      setReadTime(estimatedReadTime);
    } else {
      setWordCount(0);
      setReadTime(0);
    }
  }, [value]);

  // Auto-save functionality
  useEffect(() => {
    if (onAutoSave && value) {
      // Clear existing timeout
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }

      // Set new timeout for auto-save
      autoSaveRef.current = setTimeout(async () => {
        try {
          setSaveStatus('saving');
          await onAutoSave(value);
          setSaveStatus('saved');
          setLastSaved(new Date());
        } catch (error) {
          setSaveStatus('error');
          console.error('Auto-save failed:', error);
        }
      }, autoSaveInterval);
    }

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [value, onAutoSave, autoSaveInterval]);

  const handleChange = (content) => {
    onChange(content);
    if (saveStatus === 'saved') {
      setSaveStatus('unsaved');
    }
  };

  const SaveStatusIndicator = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-yellow-400">
            <CloudArrowUpIcon className="w-4 h-4 animate-pulse" />
            <span className="text-sm">Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircleIcon className="w-4 h-4" />
            <span className="text-sm">
              Saved {lastSaved && `at ${lastSaved.toLocaleTimeString()}`}
            </span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-400">
            <ExclamationTriangleIcon className="w-4 h-4" />
            <span className="text-sm">Save failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Editor Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[#CFCFCF]">
            <DocumentTextIcon className="w-4 h-4" />
            <span className="text-sm">{wordCount} words</span>
          </div>
          <div className="flex items-center gap-2 text-[#CFCFCF]">
            <EyeIcon className="w-4 h-4" />
            <span className="text-sm">{readTime} min read</span>
          </div>
        </div>
        
        {onAutoSave && <SaveStatusIndicator />}
      </div>

      {/* Rich Text Editor */}
      <div className="bg-white rounded-xl overflow-hidden border border-gray-300 focus-within:border-[#00FFE0] transition-colors">
        <style jsx global>{`
          .ql-container {
            font-family: inherit;
          }
          .ql-editor {
            background-color: #ffffff !important;
            color: #1f2937 !important;
            min-height: 400px;
            font-size: 16px;
            line-height: 1.6;
          }
          .ql-editor.ql-blank::before {
            color: #6b7280 !important;
            font-style: italic;
          }
          .ql-toolbar {
            background-color: #f9fafb !important;
            border-bottom: 1px solid #e5e7eb !important;
          }
          .ql-toolbar .ql-stroke {
            stroke: #374151 !important;
          }
          .ql-toolbar .ql-fill {
            fill: #374151 !important;
          }
          .ql-toolbar .ql-picker-label {
            color: #374151 !important;
          }
          .ql-toolbar button:hover {
            background-color: #e5e7eb !important;
          }
          .ql-toolbar button.ql-active {
            background-color: #00FFE0 !important;
            color: #0A0F24 !important;
          }
          .ql-toolbar .ql-picker-options {
            background-color: #ffffff !important;
            border: 1px solid #e5e7eb !important;
          }
          .ql-toolbar .ql-picker-item {
            color: #374151 !important;
          }
          .ql-toolbar .ql-picker-item:hover {
            background-color: #f3f4f6 !important;
          }
          .ql-editor h1, .ql-editor h2, .ql-editor h3, .ql-editor h4, .ql-editor h5, .ql-editor h6 {
            color: #111827 !important;
            font-weight: 600;
          }
          .ql-editor p {
            color: #374151 !important;
          }
          .ql-editor strong {
            color: #111827 !important;
          }
          .ql-editor a {
            color: #00FFE0 !important;
          }
          .ql-editor blockquote {
            border-left: 4px solid #00FFE0 !important;
            background-color: #f9fafb !important;
            color: #374151 !important;
            padding: 16px;
            margin: 16px 0;
          }
          .ql-editor code {
            background-color: #f3f4f6 !important;
            color: #1f2937 !important;
            padding: 2px 4px;
            border-radius: 4px;
          }
          .ql-editor pre {
            background-color: #1f2937 !important;
            color: #f9fafb !important;
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
          }
          .ql-editor ul, .ql-editor ol {
            color: #374151 !important;
          }
          .ql-editor li {
            color: #374151 !important;
          }
        `}</style>
        <ReactQuill
          value={value}
          onChange={handleChange}
          modules={quillModules}
          formats={quillFormats}
          placeholder={placeholder}
          style={{ 
            minHeight: '400px'
          }}
          theme="snow"
        />
      </div>
    </div>
  );
} 
