import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password hash is required']
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  continuityTriggered: {
    type: Boolean,
    default: false
  },
  dateOfDeathVerifiedAt: {
    type: Date,
    default: null
  },
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'deactivated'],
    default: 'active'
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String,
    default: null
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt automatically
  collection: 'users'
});

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ continuityTriggered: 1 });
userSchema.index({ accountStatus: 1 });

// Instance methods
userSchema.methods.isContinuityActive = function() {
  return this.continuityTriggered && this.dateOfDeathVerifiedAt !== null;
};

userSchema.methods.triggerContinuity = async function() {
  this.continuityTriggered = true;
  this.dateOfDeathVerifiedAt = new Date();
  return await this.save();
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.twoFactorSecret;
  delete obj.__v;
  return obj;
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.getActiveUsers = function() {
  return this.find({ accountStatus: 'active' });
};

const User = mongoose.model('User', userSchema);

export default User;
