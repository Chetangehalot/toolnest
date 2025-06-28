import mongoose from 'mongoose';

const blogCommentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog',
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Allow guest comments
  },
  // Guest comment fields
  guestName: {
    type: String,
    trim: true,
    maxlength: [50, 'Guest name cannot exceed 50 characters']
  },
  guestEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['approved', 'pending', 'rejected', 'spam'],
    default: 'pending'
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogComment',
    default: null // For nested replies
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderatedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    maxlength: [200, 'Rejection reason cannot exceed 200 characters']
  },
  likes: {
    type: Number,
    default: 0
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
blogCommentSchema.index({ postId: 1, status: 1 });
blogCommentSchema.index({ authorId: 1 });
blogCommentSchema.index({ status: 1, createdAt: -1 });
blogCommentSchema.index({ parentId: 1 });

// Virtual for author name (handles both registered users and guests)
blogCommentSchema.virtual('authorName').get(function() {
  if (this.authorId && this.authorId.name) {
    return this.authorId.name;
  }
  return this.guestName || 'Anonymous';
});

// Virtual for author email
blogCommentSchema.virtual('authorEmail').get(function() {
  if (this.authorId && this.authorId.email) {
    return this.authorId.email;
  }
  return this.guestEmail || '';
});

// Virtual for reply count
blogCommentSchema.virtual('replyCount', {
  ref: 'BlogComment',
  localField: '_id',
  foreignField: 'parentId',
  count: true,
  match: { status: 'approved' }
});

// Pre-save middleware
blogCommentSchema.pre('save', function(next) {
  // Set moderated timestamp when status changes
  if (this.isModified('status') && this.status !== 'pending') {
    this.moderatedAt = new Date();
  }
  
  // Set edited timestamp
  if (this.isModified('content') && !this.isNew) {
    this.isEdited = true;
    this.editedAt = new Date();
  }
  
  next();
});

// Static method to get approved comments for a post
blogCommentSchema.statics.getApprovedForPost = function(postId, options = {}) {
  const { page = 1, limit = 20, includeReplies = true } = options;
  const skip = (page - 1) * limit;
  
  const query = { 
    postId: postId, 
    status: 'approved',
    parentId: includeReplies ? { $exists: true } : null
  };
  
  return this.find(query)
    .populate('authorId', 'name email image')
    .populate('parentId')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Static method to get pending comments for moderation
blogCommentSchema.statics.getPendingForModeration = function(options = {}) {
  const { page = 1, limit = 50, postId } = options;
  const skip = (page - 1) * limit;
  
  const query = { status: 'pending' };
  if (postId) query.postId = postId;
  
  return this.find(query)
    .populate('postId', 'title slug')
    .populate('authorId', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Method to approve comment
blogCommentSchema.methods.approve = function(moderatorId) {
  this.status = 'approved';
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  return this.save();
};

// Method to reject comment
blogCommentSchema.methods.reject = function(moderatorId, reason) {
  this.status = 'rejected';
  this.moderatedBy = moderatorId;
  this.moderatedAt = new Date();
  this.rejectionReason = reason;
  return this.save();
};

const BlogComment = mongoose.models.BlogComment || mongoose.model('BlogComment', blogCommentSchema);

export default BlogComment; 
