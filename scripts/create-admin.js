const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/toolnest')
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

async function createAdmin(name, email, password) {
  try {
    // Check if user already exists
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      console.log('User with this email already exists');
      return;
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const adminUser = new UserModel({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      auditLog: [{
        action: 'profile_updated',
        performedByName: 'System',
        performedByRole: 'system',
        timestamp: new Date(),
        reason: 'Admin account created',
        changes: [{
          field: 'role',
          oldValue: null,
          newValue: 'admin'
        }],
        metadata: {
          ipAddress: 'system',
          userAgent: 'system-admin-creation',
          sessionId: 'admin-creation'
        }
      }]
    });

    await adminUser.save();
    console.log('Admin user created successfully:');
    console.log(`Name: ${name}`);
    console.log(`Email: ${email}`);
    console.log(`Role: ${adminUser.role}`);
    console.log(`ID: ${adminUser._id}`);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const adminName = args[0] || 'Admin User';
const adminEmail = args[1] || 'admin@toolnest.com';
const adminPassword = args[2] || 'admin123';

createAdmin(adminName, adminEmail, adminPassword).finally(() => {
  mongoose.disconnect();
}); 