import mongoose from 'mongoose';

const recentViewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  toolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tool',
    required: true
  },
  viewedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
recentViewSchema.index({ userId: 1, viewedAt: -1 });
recentViewSchema.index({ userId: 1, toolId: 1 }, { unique: true });

// Prevent mongoose from creating a new model if it already exists
const RecentView = mongoose.models.RecentView || mongoose.model('RecentView', recentViewSchema);

export default RecentView; 
