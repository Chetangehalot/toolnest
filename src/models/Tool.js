import mongoose from 'mongoose';

const toolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  subcategory: {
    type: String,
    index: true
  },
  tags: [{
    type: String,
    index: true
  }],
  pros: [{
    type: String
  }],
  cons: [{
    type: String
  }],
  platform: [{
    type: String
  }],
  url: {
    type: String,
    required: true
  },
  website: {
    type: String,
    default: ''
  },
  logo: {
    type: String,
    default: '/images/placeholder-logo.jpeg'
  },
  image: {
    type: String,
    default: '/images/placeholder-image.jpeg'
  },
  featured: {
    type: Boolean,
    default: false
  },
  trending: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  price: {
    type: String,
    default: 'Free'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  specifications: {
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner'
    },
    features: [String],
    integrations: [String],
    API: {
      type: Boolean,
      default: false
    },
    languagesSupported: [String],
    platform: [String],
    pricing: {
      free: Boolean,
      paid: Boolean,
      freemium: Boolean
    }
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

// Create indexes
toolSchema.index({ name: 'text', description: 'text' });
toolSchema.index({ category: 1, subcategory: 1 });
toolSchema.index({ trending: 1 });
toolSchema.index({ featured: 1 });

// Create the model if it doesn't exist, or use the existing one
const Tool = mongoose.models.Tool || mongoose.model('Tool', toolSchema);

export default Tool; 
