import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
  },
  role: {
    type: String,
    enum: ['user', 'writer', 'manager', 'admin'],
    default: 'user',
  },
  // Blog-specific fields
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  socialLinks: {
    twitter: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    website: { type: String, default: '' }
  },
  blogStats: {
    totalPosts: { type: Number, default: 0 },
    publishedPosts: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 }
  },
  image: {
    type: String,
    default: '',
  },
  profession: {
    type: String,
    trim: true,
    default: '',
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  bookmarks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tool'
  }],
  lastLogin: {
    type: Date,
    default: null,
  },
  // Audit Trail Fields
  auditLog: [{
    action: {
      type: String,
      enum: ['role_changed', 'blocked', 'unblocked', 'profile_updated', 'data_modified', 'account_deleted'],
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    performedByName: String, // Store name for reference even if user is deleted
    performedByRole: String, // Store role at time of action
    timestamp: {
      type: Date,
      default: Date.now
    },
    reason: String,
    changes: [{
      field: String,
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed
    }],
    metadata: {
      ipAddress: String,
      userAgent: String,
      sessionId: String
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Aggressively limit bookmarks array to prevent large payload issues
  if (this.bookmarks && this.bookmarks.length > 50) {
    this.bookmarks = this.bookmarks.slice(-50); // Keep only last 50 bookmarks
  }
  
  // Limit audit log to prevent excessive growth
  if (this.auditLog && this.auditLog.length > 100) {
    this.auditLog = this.auditLog.slice(-100); // Keep only last 100 audit entries
  }
  
  // Ensure other fields don't exceed reasonable limits
  if (this.name && this.name.length > 100) {
    this.name = this.name.substring(0, 100);
  }
  
  if (this.profession && this.profession.length > 200) {
    this.profession = this.profession.substring(0, 200);
  }
  
  if (this.image && this.image.length > 500) {
    this.image = this.image.substring(0, 500);
  }
  
  next();
});

// Also add a pre-update hook for findByIdAndUpdate operations
userSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  // If bookmarks are being updated, ensure they don't exceed limits
  if (update.bookmarks && Array.isArray(update.bookmarks) && update.bookmarks.length > 50) {
    update.bookmarks = update.bookmarks.slice(-50);
  }
  
  // Limit other fields
  if (update.name && update.name.length > 100) {
    update.name = update.name.substring(0, 100);
  }
  
  if (update.profession && update.profession.length > 200) {
    update.profession = update.profession.substring(0, 200);
  }
  
  if (update.image && update.image.length > 500) {
    update.image = update.image.substring(0, 500);
  }
  
  next();
});

// Create the model if it doesn't exist, otherwise use the existing one
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Static method to clean up user data
User.cleanupUserData = async function(userId) {
  try {
    const user = await this.findById(userId);
    if (!user) return false;
    
    let needsUpdate = false;
    
    // Check if bookmarks array is too large
    if (user.bookmarks && user.bookmarks.length > 1000) {
      user.bookmarks = user.bookmarks.slice(-1000);
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      await user.save();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error cleaning up user data:', error);
    return false;
  }
};

export default User; 
