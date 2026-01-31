import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  fullName: {
    type: String,
    required: true
  },
  password_hash: {
    type: String,
    required: true
  },
  continuity_triggered: {
    type: Boolean,
    default: false
  },
  date_of_death_verified_at: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'users'
});

// Index for faster queries
UserSchema.index({ continuity_triggered: 1 });

// Method to check if continuity access is active
UserSchema.methods.isContinuityActive = function() {
  return this.continuity_triggered === true;
};

// Method to trigger continuity access
UserSchema.methods.triggerContinuity = function() {
  this.continuity_triggered = true;
  this.date_of_death_verified_at = new Date();
  return this.save();
};

const User = mongoose.model('User', UserSchema);

export default User;
