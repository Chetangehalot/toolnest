const mongoose = require('mongoose');
const User = require('../models/User');
const Review = require('../models/Review');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/toolnest')
  .then(() => {
    // MongoDB connected
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: String,
  image: String,
  bio: String,
  profession: String,
  role: { 
    type: String, 
    enum: ['user', 'admin', 'manager', 'writer'],
    default: 'user'
  },
  isBlocked: { type: Boolean, default: false },
  lastLogin: Date,
  auditLog: [{
    action: {
      type: String,
      enum: ['profile_updated', 'role_changed', 'blocked', 'unblocked', 'data_modified']
    },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performedByName: String,
    performedByRole: String,
    timestamp: { type: Date, default: Date.now },
    reason: String,
    changes: [{
      field: String,
      oldValue: String,
      newValue: String
    }],
    metadata: {
      ipAddress: String,
      userAgent: String,
      sessionId: String
    }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const UserModel = mongoose.model('User', userSchema);

async function checkUser(identifier) {
  try {
    let user;
    
    // Check if identifier is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      user = await UserModel.findById(identifier);
    }
    
    // If not found by ID or not a valid ObjectId, try email
    if (!user) {
      user = await UserModel.findOne({ email: identifier });
    }
    
    if (!user) {
      console.log('User not found');
      return;
    }
    
    console.log('User found:');
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`ID: ${user._id}`);
    console.log(`Role: ${user.role || 'NOT SET'}`);
    console.log(`Full user object:`);
    console.log(JSON.stringify(user.toObject(), null, 2));
    
  } catch (error) {
    console.error('Error checking user:', error);
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node scripts/check-user.js <email_or_id>');
  console.log('Example: node scripts/check-user.js socloudy2022@gmail.com');
  console.log('Example: node scripts/check-user.js 68543532e0897fea5a52621e');
  process.exit(1);
}

const identifier = args[0];
checkUser(identifier).finally(() => {
  mongoose.disconnect();
}); 