import mongoose from 'mongoose';

// Import models to ensure they're registered before referencing them
import './Blog.js';
import './User.js';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['success', 'error', 'info', 'warning', 'review_reply', 'blog_approval', 'blog_rejection', 'blog_request', 'blog_reposted', 'blog_deleted_by_writer', 'blog_restored_by_writer'],
    default: 'info'
  },
  link: {
    type: String,
    trim: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  relatedBlog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Blog'
  },
  relatedTool: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tool'
  },
  actionBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for better query performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // Auto-delete after 30 days

// Static method to create blog approval notification
notificationSchema.statics.createBlogApprovalNotification = async function(blogId, writerId, adminId) {
  try {
    // Import models dynamically to avoid circular dependencies
    const { default: Blog } = await import('./Blog.js');
    const { default: User } = await import('./User.js');
    
    const [blog, admin] = await Promise.all([
      Blog.findById(blogId),
      User.findById(adminId)
    ]);
    
    if (!blog) throw new Error('Blog not found');
    if (!admin) throw new Error('Admin not found');
    
    const adminName = admin.name || 'Admin';
    
    return await this.create({
      recipient: writerId,
      title: 'Blog Post Approved 🎉',
      message: `Your blog post "${blog.title}" was approved and published by ${adminName}.`,
      type: 'success',
      link: `/blog/${blog.slug}`,
      relatedBlog: blogId,
      actionBy: adminId,
      metadata: {
        action: 'blog_approved',
        blogTitle: blog.title,
        blogSlug: blog.slug,
        adminName,
        approvedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error creating blog approval notification:', error);
    throw error;
  }
};

// Static method to create blog rejection notification
notificationSchema.statics.createBlogRejectionNotification = async function(blogId, writerId, adminId, rejectionReason = null) {
  try {
    // Import models dynamically to avoid circular dependencies
    const { default: Blog } = await import('./Blog.js');
    const { default: User } = await import('./User.js');
    
    const [blog, admin] = await Promise.all([
      Blog.findById(blogId),
      User.findById(adminId)
    ]);
    
    if (!blog) throw new Error('Blog not found');
    if (!admin) throw new Error('Admin not found');
    
    const adminName = admin.name || 'Admin';
    let message = `Your blog post "${blog.title}" was rejected by ${adminName}.`;
    
    if (rejectionReason) {
      message += ` Reason: ${rejectionReason}`;
    }
    
    return await this.create({
      recipient: writerId,
      title: 'Blog Post Rejected ❌',
      message,
      type: 'error',
      link: `/writer/posts/edit/${blogId}`,
      relatedBlog: blogId,
      actionBy: adminId,
      metadata: {
        action: 'blog_rejected',
        blogTitle: blog.title,
        blogSlug: blog.slug,
        adminName,
        rejectionReason,
        rejectedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error creating blog rejection notification:', error);
    throw error;
  }
};

// Static method to create blog approval request notification for admins/managers
notificationSchema.statics.createBlogApprovalRequestNotification = async function(blogId, writerId) {
  try {
    // Import models dynamically to avoid circular dependencies
    const { default: Blog } = await import('./Blog.js');
    const { default: User } = await import('./User.js');
    
    const [blog, writer, adminsAndManagers] = await Promise.all([
      Blog.findById(blogId),
      User.findById(writerId),
      User.find({ role: { $in: ['admin', 'manager'] } }).select('_id name email')
    ]);
    
    if (!blog) {
      console.error('❌ Blog not found:', blogId);
      throw new Error('Blog not found');
    }
    if (!writer) {
      console.error('❌ Writer not found:', writerId);
      throw new Error('Writer not found');
    }
    
    const writerName = writer.name || writer.email || 'Unknown Writer';
    
    // Create notifications for all admins and managers
    const notifications = adminsAndManagers.map(recipient => {
      const notification = {
        recipient: recipient._id,
        title: 'New Blog Awaiting Approval 📝',
        message: `"${blog.title}" was submitted by ${writerName} and needs your review.`,
        type: 'info',
        link: `/admin/blogs`,
        relatedBlog: blogId,
        actionBy: writerId,
        metadata: {
          action: 'blog_approval_request',
          blogTitle: blog.title,
          blogSlug: blog.slug,
          writerName,
          submittedAt: new Date()
        }
      };
      
      return notification;
    });
    
    if (notifications.length > 0) {
      const result = await this.insertMany(notifications);
      return result;
    } else {
      return [];
    }
  } catch (error) {
    console.error('💥 Error creating blog approval request notifications:', error);
    console.error('Stack trace:', error.stack);
    throw error;
  }
};

// Static method to create blog repost notification for writer
notificationSchema.statics.createBlogRepostNotification = async function(blogId, writerId, adminId) {
  try {
    // Import models dynamically to avoid circular dependencies
    const { default: Blog } = await import('./Blog.js');
    const { default: User } = await import('./User.js');
    
    const [blog, admin] = await Promise.all([
      Blog.findById(blogId),
      User.findById(adminId)
    ]);
    
    if (!blog) throw new Error('Blog not found');
    if (!admin) throw new Error('Admin not found');
    
    const adminName = admin.name || 'Admin';
    
    return await this.create({
      recipient: writerId,
      title: 'Blog Post Reposted 🔁',
      message: `Your blog post "${blog.title}" was reposted by ${adminName}.`,
      type: 'success',
      link: `/blog/${blog.slug}`,
      relatedBlog: blogId,
      actionBy: adminId,
      metadata: {
        action: 'blog_reposted',
        blogTitle: blog.title,
        blogSlug: blog.slug,
        adminName,
        repostedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error creating blog repost notification:', error);
    throw error;
  }
};

// Static method to create blog delete notification for admins/managers
notificationSchema.statics.createBlogDeleteNotification = async function(blogId, writerId, blogTitle) {
  try {
    // Import models dynamically to avoid circular dependencies
    const { default: User } = await import('./User.js');
    
    const [writer, adminsAndManagers] = await Promise.all([
      User.findById(writerId),
      User.find({ role: { $in: ['admin', 'manager'] } }).select('_id name email')
    ]);
    
    if (!writer) throw new Error('Writer not found');
    
    const writerName = writer.name || writer.email || 'Unknown Writer';
    
    // Create notifications for all admins and managers
    const notifications = adminsAndManagers.map(recipient => ({
      recipient: recipient._id,
      title: 'Blog Post Deleted by Writer 🗑️',
      message: `${writerName} deleted the blog post "${blogTitle}".`,
      type: 'warning',
      link: `/admin/blogs`,
      relatedBlog: blogId,
      actionBy: writerId,
      metadata: {
        action: 'blog_deleted_by_writer',
        blogTitle,
        writerName,
        deletedAt: new Date()
      }
    }));
    
    if (notifications.length > 0) {
      return await this.insertMany(notifications);
    }
    
    return [];
  } catch (error) {
    console.error('Error creating blog delete notifications:', error);
    throw error;
  }
};

// Static method to create blog restore notification for admins/managers
notificationSchema.statics.createBlogRestoreNotification = async function(blogId, writerId, blogTitle) {
  try {
    // Import models dynamically to avoid circular dependencies
    const { default: User } = await import('./User.js');
    
    const [writer, adminsAndManagers] = await Promise.all([
      User.findById(writerId),
      User.find({ role: { $in: ['admin', 'manager'] } }).select('_id name email')
    ]);
    
    if (!writer) throw new Error('Writer not found');
    
    const writerName = writer.name || writer.email || 'Unknown Writer';
    
    // Create notifications for all admins and managers
    const notifications = adminsAndManagers.map(recipient => ({
      recipient: recipient._id,
      title: 'Blog Post Restored by Writer 🔄',
      message: `${writerName} restored the blog post "${blogTitle}" from trash.`,
      type: 'info',
      link: `/admin/blogs`,
      relatedBlog: blogId,
      actionBy: writerId,
      metadata: {
        action: 'blog_restored_by_writer',
        blogTitle,
        writerName,
        restoredAt: new Date()
      }
    }));
    
    if (notifications.length > 0) {
      return await this.insertMany(notifications);
    }
    
    return [];
  } catch (error) {
    console.error('Error creating blog restore notifications:', error);
    throw error;
  }
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  return this.save();
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ recipient: userId, read: false });
};

// Static method to get notifications for user with pagination
notificationSchema.statics.getForUser = async function(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    type = null
  } = options;
  
  const query = { recipient: userId };
  if (unreadOnly) query.read = false;
  if (type) query.type = type;
  
  const skip = (page - 1) * limit;
  
  try {
    const [notifications, total] = await Promise.all([
      this.find(query)
        .populate('actionBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.countDocuments(query)
    ]);
    
    return {
      notifications,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Static method to mark all as read for user
notificationSchema.statics.markAllAsReadForUser = async function(userId) {
  return await this.updateMany(
    { recipient: userId, read: false },
    { read: true }
  );
};

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema); 
