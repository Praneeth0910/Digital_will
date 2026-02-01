import mongoose from 'mongoose';

const NomineeSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  nominee_email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  nominee_name: {
    type: String,
    required: true
  },
  relation: {
    type: String,
    enum: ['Family', 'Legal Representative', 'Friend', 'Other'],
    required: true
  },
  beneficiary_reference_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['INACTIVE', 'PENDING_VERIFICATION', 'ACTIVE', 'REJECTED'],
    default: 'INACTIVE',
    required: true
  },
  death_document_url: {
    type: String,
    default: null
  },
  death_document_name: {
    type: String,
    default: null
  },
  verified_at: {
    type: Date,
    default: null
  },
  rejected_at: {
    type: Date,
    default: null
  },
  rejection_reason: {
    type: String,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'nominees'
});

// Compound index for efficient queries
NomineeSchema.index({ user_id: 1, status: 1 });
NomineeSchema.index({ nominee_email: 1, beneficiary_reference_id: 1 });

// Method to activate nominee (after death verification)
NomineeSchema.methods.activate = function() {
  this.status = 'ACTIVE';
  this.verified_at = new Date();
  return this.save();
};

// Method to reject nominee
NomineeSchema.methods.reject = function(reason) {
  this.status = 'REJECTED';
  this.rejected_at = new Date();
  this.rejection_reason = reason || 'Document verification failed';
  return this.save();
};

// Method to mark as pending verification
NomineeSchema.methods.setPendingVerification = function(documentUrl, documentName) {
  this.status = 'PENDING_VERIFICATION';
  this.death_document_url = documentUrl;
  this.death_document_name = documentName;
  return this.save();
};

// Check if nominee can access dashboard
NomineeSchema.methods.canAccessDashboard = async function() {
  if (this.status !== 'ACTIVE') {
    return { allowed: false, reason: `Nominee status is ${this.status}. Only ACTIVE nominees can access.` };
  }

  // Get linked user (handle both populated and non-populated cases)
  let user = this.user_id;
  
  // If user_id is just an ID (not populated), fetch it
  if (!user || !user._id) {
    const User = mongoose.model('User');
    user = await User.findById(this.user_id);
  }

  if (!user) {
    return { allowed: false, reason: 'Associated user account not found.' };
  }

  if (!user.continuity_triggered) {
    return { allowed: false, reason: 'Continuity access has not been triggered by the account owner.' };
  }

  return { allowed: true, reason: 'Access granted' };
};

const Nominee = mongoose.model('Nominee', NomineeSchema);

export default Nominee;
