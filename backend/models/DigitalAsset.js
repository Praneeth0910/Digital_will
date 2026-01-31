import mongoose from 'mongoose';

const digitalAssetSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  asset_name: {
    type: String,
    required: true
  },
  asset_type: {
    type: String,
    required: true,
    enum: ['Legal', 'Financial', 'Personal', 'Media', 'Other']
  },
  description: {
    type: String,
    required: false
  },
  file_path: {
    type: String,
    required: false
  },
  file_url: {
    type: String,
    required: false
  },
  file_size: {
    type: Number,
    required: false
  },
  mime_type: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['LOCKED', 'PENDING', 'RELEASED'],
    default: 'LOCKED'
  },
  release_condition: {
    type: String,
    enum: ['ON_DEATH', 'ON_INCAPACITY', 'ON_REQUEST', 'MANUAL'],
    default: 'ON_DEATH'
  },
  version_count: {
    type: Number,
    default: 1
  },
  encrypted: {
    type: Boolean,
    default: false
  },
  encryption_key_id: {
    type: String,
    required: false
  },
  last_modified: {
    type: Date,
    default: Date.now
  },
  released_at: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
digitalAssetSchema.index({ user_id: 1, status: 1 });

const DigitalAsset = mongoose.model('DigitalAsset', digitalAssetSchema);

export default DigitalAsset;
