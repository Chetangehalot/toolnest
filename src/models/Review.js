import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  toolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tool',
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  },
  reply: {
    type: String,
    maxlength: 1000
  },
  replyAuthor: {
    type: String,
    maxlength: 100
  },
  replyRole: {
    type: String,
    enum: ['admin', 'manager', 'writer'],
    default: 'admin'
  },
  status: {
    type: String,
    enum: ['visible', 'hidden', 'flagged'],
    default: 'visible'
  },
  pros: [String],
  cons: [String],
  verified: {
    type: Boolean,
    default: false
  },
  isRatingActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Remove the unique compound index since users can now have multiple reviews
// Create regular indexes for efficient querying
reviewSchema.index({ userId: 1, toolId: 1 });
reviewSchema.index({ toolId: 1, isRatingActive: 1 });

// Prevent mongoose from creating a new model if it already exists
const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);

export default Review; 
