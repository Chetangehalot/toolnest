'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeftIcon, 
  UserIcon, 
  EyeIcon, 
  EyeSlashIcon,
  CameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/layout/Layout';
import { FormSkeleton } from '@/components/ui/SkeletonLoader';

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    profession: '',
    bio: '',
    image: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSuccess, setIsSuccess] = useState(false);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        return data.user;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
    return null;
  };

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    // Fetch the latest user data to ensure we have current bio information
    const loadUserData = async () => {
      const latestUserData = await fetchUserProfile();
      
      const userData = latestUserData || session.user;
      
      // Check for any unsaved changes in localStorage
      const storedFormData = loadFormFromStorage();
      
      // Initialize form with latest user data
      const initialFormData = {
        name: userData.name || '',
        email: userData.email || '',
        profession: userData.profession || '',
        bio: userData.bio || '',
        image: userData.image || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };

      // Merge with stored data if available (prioritize user changes)
      if (storedFormData) {
        Object.keys(storedFormData).forEach(key => {
          if (storedFormData[key] !== undefined && storedFormData[key] !== initialFormData[key]) {
            initialFormData[key] = storedFormData[key];
          }
        });
      }
      
      setFormData(initialFormData);
      setImagePreview(initialFormData.image || null);
      setLoading(false);
    };

    loadUserData();
  }, [session, status, router]);

  // Cleanup effect - clear storage when component unmounts unless there are unsaved changes
  useEffect(() => {
    return () => {
      // Only clear if user is navigating away (not refreshing)
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = window.performance.getEntriesByType('navigation')[0];
        if (navigation && navigation.type === 'navigate') {
          clearFormStorage();
        }
      }
    };
  }, []);

  // Save form data to localStorage
  const saveFormToStorage = (data) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('profileFormData', JSON.stringify(data));
    }
  };

  // Load form data from localStorage
  const loadFormFromStorage = () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('profileFormData');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  };

  // Clear stored form data
  const clearFormStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('profileFormData');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: value
    };
    
    setFormData(newFormData);
    
    // Save to localStorage for persistence across tab switches
    // Don't save password fields for security
    const dataToSave = { ...newFormData };
    delete dataToSave.currentPassword;
    delete dataToSave.newPassword;
    delete dataToSave.confirmPassword;
    saveFormToStorage(dataToSave);
    
    // Clear messages when user starts typing
    if (message.text) {
      setMessage({ text: '', type: '' });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ text: 'Please select a valid image file', type: 'error' });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: 'Image size must be less than 5MB', type: 'error' });
      return;
    }

    setUploading(true);
    setMessage({ text: '', type: '' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const imageUrl = data.url;
        setFormData(prev => ({ ...prev, image: imageUrl }));
        setImagePreview(imageUrl);
        setMessage({ text: 'Image uploaded successfully!', type: 'success' });
      } else {
        setMessage({ text: data.error || 'Failed to upload image', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'An error occurred while uploading image', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    // Validate password fields if attempting to change password
    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        setMessage({ text: 'Current password is required to change password', type: 'error' });
        setSaving(false);
        return;
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        setMessage({ text: 'New passwords do not match', type: 'error' });
        setSaving(false);
        return;
      }
      
      if (formData.newPassword.length < 6) {
        setMessage({ text: 'New password must be at least 6 characters long', type: 'error' });
        setSaving(false);
        return;
      }
    }

    try {
      const updateData = {
        name: formData.name,
        profession: formData.profession,
        bio: formData.bio,
        image: formData.image
      };

      // Only include password fields if user is changing password
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
        setIsSuccess(true);
        
        // Clear stored form data since changes are saved
        clearFormStorage();
        
        // Clear password fields
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        
        // Update the session with new data
        await update({
          ...session,
          user: {
            ...session.user,
            name: data.user.name,
            image: data.user.image,
            profession: data.user.profession,
            bio: data.user.bio
          }
        });
        
        // Redirect after successful update with animation
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      } else {
        setMessage({ text: data.error || 'Failed to update profile', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'An error occurred while updating profile', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Show skeleton while loading
  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <div className="h-8 bg-[#00FFE0]/10 rounded w-48 mb-2 animate-pulse"></div>
                <div className="h-5 bg-[#00FFE0]/10 rounded w-64 animate-pulse"></div>
              </div>
              <div className="h-12 bg-[#00FFE0]/10 rounded w-48 animate-pulse"></div>
            </div>

            <FormSkeleton />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-[#F5F5F5]">Profile Settings</h1>
              <p className="text-[#CFCFCF]">Manage your account information</p>
            </div>
            <Link 
              href="/dashboard"
              className="flex items-center gap-2 px-6 py-3 bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 text-[#F5F5F5] rounded-xl hover:border-[#00FFE0]/40 hover:scale-105 transition-all duration-200"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Dashboard
            </Link>
          </motion.div>

          {/* Success Animation */}
          <AnimatePresence>
            {isSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
              >
                <motion.div
                  initial={{ y: 50 }}
                  animate={{ y: 0 }}
                  className="bg-[#0A0F24] border border-[#00FFE0]/20 rounded-2xl p-8 text-center max-w-md mx-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircleIcon className="w-8 h-8 text-green-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-[#F5F5F5] mb-2">Profile Updated!</h3>
                  <p className="text-[#CFCFCF] mb-4">Your changes have been saved successfully.</p>
                  <div className="flex items-center justify-center gap-2 text-[#00FFE0]">
                    <div className="w-4 h-4 border-2 border-[#00FFE0] border-t-transparent rounded-full animate-spin"></div>
                    <span>Redirecting to dashboard...</span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Message Display */}
          <AnimatePresence>
            {message.text && !isSuccess && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
                  message.type === 'success' 
                    ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                    : message.type === 'info'
                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
              >
                {message.type === 'success' && <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />}
                {message.type === 'error' && <XCircleIcon className="w-5 h-5 flex-shrink-0" />}
                {message.type === 'info' && <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />}
                <span>{message.text}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Profile Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#0A0F24]/50 backdrop-blur-lg border border-[#00FFE0]/20 rounded-2xl p-8"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Image Section */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-[#F5F5F5] mb-6">Profile Picture</h3>
                
                <div className="relative inline-block">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="w-32 h-32 rounded-full bg-gradient-to-r from-[#00FFE0] to-[#B936F4] p-1 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-full h-full rounded-full bg-[#0A0F24] flex items-center justify-center overflow-hidden">
                      {imagePreview ? (
                        <img 
                          src={imagePreview} 
                          alt="Profile" 
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <UserIcon className="w-12 h-12 text-[#CFCFCF]" />
                      )}
                    </div>
                  </motion.div>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-2 right-2 w-10 h-10 bg-[#00FFE0] text-[#0A0F24] rounded-full flex items-center justify-center hover:bg-[#00FFE0]/90 transition-colors"
                    disabled={uploading}
                  >
                    {uploading ? (
                      <div className="w-4 h-4 border-2 border-[#0A0F24] border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CameraIcon className="w-5 h-5" />
                    )}
                  </motion.button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                <p className="text-[#CFCFCF] text-sm mt-4">
                  Click to upload a new profile picture (Max: 5MB)
                </p>
              </div>

              {/* Basic Information */}
              <div>
                <h3 className="text-xl font-bold text-[#F5F5F5] mb-6">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-sm font-medium text-[#F5F5F5] mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] placeholder-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-[#00FFE0]/50 focus:border-transparent hover:border-[#00FFE0]/40 transition-all duration-200"
                      placeholder="Enter your full name"
                    />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-sm font-medium text-[#F5F5F5] mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled
                      className="w-full px-4 py-3 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#CFCFCF] placeholder-[#CFCFCF] opacity-50 cursor-not-allowed"
                    />
                    <p className="text-xs text-[#CFCFCF] mt-1">
                      Email cannot be changed
                    </p>
                  </motion.div>
                </div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6"
                >
                  <label className="block text-sm font-medium text-[#F5F5F5] mb-2">
                    Profession
                  </label>
                  <input
                    type="text"
                    name="profession"
                    value={formData.profession}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] placeholder-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-[#00FFE0]/50 focus:border-transparent hover:border-[#00FFE0]/40 transition-all duration-200"
                    placeholder="e.g., Software Developer, Designer, Student"
                  />
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6"
                >
                  <label className="block text-sm font-medium text-[#F5F5F5] mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] placeholder-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-[#00FFE0]/50 focus:border-transparent hover:border-[#00FFE0]/40 transition-all duration-200 resize-none"
                    placeholder="Tell us a bit about yourself..."
                  />
                </motion.div>
              </div>

              {/* Password Change Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="border-t border-[#00FFE0]/10 pt-6"
              >
                <h3 className="text-xl font-bold text-[#F5F5F5] mb-6">Change Password</h3>
                <p className="text-[#CFCFCF] text-sm mb-6">
                  Leave these fields blank if you don&apos;t want to change your password
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[#F5F5F5] mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 pr-12 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] placeholder-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-[#00FFE0]/50 focus:border-transparent hover:border-[#00FFE0]/40 transition-all duration-200"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#CFCFCF] hover:text-[#00FFE0] transition-colors"
                      >
                        {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#F5F5F5] mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 pr-12 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] placeholder-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-[#00FFE0]/50 focus:border-transparent hover:border-[#00FFE0]/40 transition-all duration-200"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#CFCFCF] hover:text-[#00FFE0] transition-colors"
                        >
                          {showNewPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#F5F5F5] mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 pr-12 bg-[#0A0F24] border border-[#00FFE0]/20 rounded-xl text-[#F5F5F5] placeholder-[#CFCFCF] focus:outline-none focus:ring-2 focus:ring-[#00FFE0]/50 focus:border-transparent hover:border-[#00FFE0]/40 transition-all duration-200"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#CFCFCF] hover:text-[#00FFE0] transition-colors"
                        >
                          {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex justify-end pt-6"
              >
                <motion.button
                  whileHover={{ scale: saving ? 1 : 1.05 }}
                  whileTap={{ scale: saving ? 1 : 0.95 }}
                  type="submit"
                  disabled={saving || uploading}
                  className={`px-8 py-3 bg-[#00FFE0] text-[#0A0F24] rounded-xl font-semibold transition-all duration-200 ${
                    saving || uploading
                      ? 'cursor-wait opacity-70' 
                      : 'cursor-pointer hover:bg-[#00FFE0]/90'
                  }`}
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#0A0F24] border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </motion.button>
              </motion.div>
            </form>
          </motion.div>

          {/* Role Information */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-8 bg-[#0A0F24]/30 backdrop-blur-lg border border-[#00FFE0]/10 rounded-2xl p-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#B936F4]/20 rounded-xl flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-[#B936F4]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#F5F5F5]">Account Role</h3>
                <p className="text-[#CFCFCF]">
                  You are currently a <span className="text-[#00FFE0] font-medium">{session?.user?.role || 'user'}</span>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Layout>
  );
} 
