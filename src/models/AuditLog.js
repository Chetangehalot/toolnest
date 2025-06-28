import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  // Basic audit information
  type: {
    type: String,
    enum: ['tool_management', 'review_management', 'user_management', 'blog_moderation', 'blog_creation'],
    required: true
  },
  action: {
    type: String,
    enum: ['created', 'updated', 'deleted', 'approved', 'rejected', 'reposted', 'moved_to_trash', 'hidden', 'restored', 'replied', 'role_changed', 'blocked', 'unblocked', 'profile_updated', 'data_modified', 'account_created', 'account_deleted', 'soft_deleted', 'permanently_deleted'],
    required: true
  },
  
  // Who performed the action
  performedBy: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true
    }
  },
  
  // Target information (what was acted upon)
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  targetType: {
    type: String,
    enum: ['Tool', 'Review', 'User', 'Blog'],
    required: true
  },
  targetName: {
    type: String,
    required: true
  },
  
  // Change details
  changes: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  }],
  
  // Additional context
  reason: String,
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    sessionId: String
  },
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Create indexes for efficient querying
auditLogSchema.index({ type: 1, timestamp: -1 });
auditLogSchema.index({ 'performedBy._id': 1, timestamp: -1 });
auditLogSchema.index({ targetId: 1, targetType: 1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

// Create the model if it doesn't exist, or use the existing one
const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);

export default AuditLog; 