const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/toolnest');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// User Schema (same as in models/User.js)
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
    enum: ['user', 'admin'],
    default: 'user',
  },
  image: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model('User', userSchema);

// Update user role
const updateUserRole = async (identifier, newRole) => {
  try {
    let user;
    
    // Try to find by email first
    user = await User.findOne({ email: identifier });
    
    // If not found by email, try by ID
    if (!user) {
      user = await User.findById(identifier);
    }
    
    if (!user) {
          return;
    }

    // Update the role
    user.role = newRole;
    user.updatedAt = new Date();
    await user.save();

    console.log('User role updated successfully:');
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`New Role: ${user.role}`);
    console.log(`ID: ${user._id}`);

  } catch (error) {
    console.error('Error updating user role:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();

  // Get arguments from command line - fix the argument parsing
  const args = process.argv.slice(2);
  const identifier = args[0]; // email or ID
  const newRole = args[1] || 'admin'; // default to admin

  if (!identifier) {
    console.log('Usage: npm run update-role <email_or_id> [role]');
    console.log('Example: npm run update-role socloudy2022@gmail.com admin');
    console.log('Example: npm run update-role 68543532e0897fea5a52621e admin');
    process.exit(1);
  }

  console.log('Updating user role...');
  console.log(`Identifier: ${identifier}`);
  console.log(`New Role: ${newRole}`);

  await updateUserRole(identifier, newRole);

  // Close connection
  await mongoose.connection.close();
  console.log('Database connection closed');
};

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { updateUserRole }; 