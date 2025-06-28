import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  content: {
    type: String,
    required: [true, 'Content is required']
  },
  excerpt: {
    type: String,
    maxlength: [500, 'Excerpt cannot exceed 500 characters']
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'published', 'rejected', 'unpublished'],
    default: 'draft'
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogCategory'
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  featuredImage: {
    type: String,
    default: ''
  },
  seoTitle: {
    type: String,
    maxlength: [60, 'SEO title cannot exceed 60 characters']
  },
  seoDescription: {
    type: String,
    maxlength: [160, 'SEO description cannot exceed 160 characters']
  },
  readTime: {
    type: Number,
    default: 0 // in minutes
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  },
  viewedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: {
    type: Number,
    default: 0
  },
  // Daily engagement tracking for analytics
  dailyEngagement: [{
    date: {
      type: String, // YYYY-MM-DD format
      required: true
    },
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    }
  }],
  publishedAt: {
    type: Date
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectedAt: {
    type: Date
  },
  unpublishedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  unpublishedAt: {
    type: Date
  },
  // Soft delete fields
  trashedByWriter: {
    type: Boolean,
    default: false,
    index: true
  },
  permanentlyHiddenFromWriter: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date,
    index: true
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  repostedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  repostedAt: {
    type: Date
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['draft', 'pending_approval', 'published', 'rejected', 'unpublished']
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  lastEditedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastEditedAt: {
    type: Date
  },
  isSticky: {
    type: Boolean,
    default: false
  },
  allowComments: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance (removed duplicate slug index)
blogSchema.index({ authorId: 1 });
blogSchema.index({ status: 1 });
blogSchema.index({ categories: 1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ publishedAt: -1 });
blogSchema.index({ createdAt: -1 });

// Virtual for comment count
blogSchema.virtual('commentCount', {
  ref: 'BlogComment',
  localField: '_id',
  foreignField: 'postId',
  count: true,
  match: { status: 'approved' }
});

// Auto-generate slug from title if not provided
blogSchema.pre('validate', async function(next) {
  if (!this.slug && this.title) {
    let baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Ensure slug is unique
    let slug = baseSlug;
    let counter = 1;
    
    while (await this.constructor.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

blogSchema.pre('save', function(next) {
  // Calculate read time (average 200 words per minute)
  if (this.content) {
    const wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.ceil(wordCount / 200);
  }
  
  // Set publishedAt when status changes to published
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Clear publishedAt if status is not published
  if (this.status !== 'published') {
    this.publishedAt = undefined;
  }
  
  next();
});

// Static method to get published posts
blogSchema.statics.getPublished = function(options = {}) {
  const { page = 1, limit = 10, category, tags, author } = options;
  const skip = (page - 1) * limit;
  
  const query = { status: 'published' };
  
  if (category) query.categories = category;
  if (tags) query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
  if (author) query.authorId = author;
  
  return this.find(query)
    .populate('authorId', 'name email image')
    .populate('categories', 'name slug')
    .sort({ isSticky: -1, publishedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

// Method to increment views
blogSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Helper method to update daily engagement stats
blogSchema.methods.updateDailyEngagement = function(type, date = null) {
  const targetDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  
  // Find existing entry for the date
  let dayEntry = this.dailyEngagement.find(entry => entry.date === targetDate);
  
  if (!dayEntry) {
    // Create new entry for the date
    dayEntry = {
      date: targetDate,
      views: 0,
      likes: 0,
      comments: 0
    };
    this.dailyEngagement.push(dayEntry);
  }
  
  // Increment the appropriate counter
  if (type === 'view') {
    dayEntry.views += 1;
  } else if (type === 'like') {
    dayEntry.likes += 1;
  } else if (type === 'comment') {
    dayEntry.comments += 1;
  }
  
  // Mark as modified to ensure save
  this.markModified('dailyEngagement');
  
  return this.save();
};

// Helper method to remove daily engagement (for unlikes, comment deletions)
blogSchema.methods.decrementDailyEngagement = function(type, date = null) {
  const targetDate = date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  
  // Find existing entry for the date
  let dayEntry = this.dailyEngagement.find(entry => entry.date === targetDate);
  
  if (dayEntry) {
    // Decrement the appropriate counter
    if (type === 'like' && dayEntry.likes > 0) {
      dayEntry.likes -= 1;
    } else if (type === 'comment' && dayEntry.comments > 0) {
      dayEntry.comments -= 1;
    }
    
    // Mark as modified to ensure save
    this.markModified('dailyEngagement');
  }
  
  return this.save();
};

// Static method to ensure today's engagement entries exist for all posts
blogSchema.statics.ensureTodaysEngagement = async function() {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Find all published posts that don't have today's engagement entry
    const postsWithoutToday = await this.find({
      status: 'published',
      'dailyEngagement.date': { $ne: today }
    });
    
    const updatePromises = postsWithoutToday.map(async (post) => {
      // Check if today's entry already exists (double-check)
      const hasToday = post.dailyEngagement.some(entry => entry.date === today);
      
      if (!hasToday) {
        post.dailyEngagement.push({
          date: today,
          views: 0,
          likes: 0,
          comments: 0
        });
        return post.save();
      }
    });
    
    await Promise.all(updatePromises);
    
    return {
      success: true,
      updated: postsWithoutToday.length,
      date: today
    };
  } catch (error) {
    console.error('Error ensuring today\'s engagement:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

const Blog = mongoose.models.Blog || mongoose.model('Blog', blogSchema);

export default Blog; 
