import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  nominee_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Nominee',
    required: true,
    index: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'SESSION_START',
      'SESSION_END',
      'VIEWED_ASSET',
      'DOWNLOADED_ASSET',
      'VIEWED_NOTE',
      'DOWNLOADED_NOTE',
      'VIEWED_DASHBOARD',
      'FAILED_ACCESS_ATTEMPT'
    ]
  },
  action_details: {
    type: String,
    required: false
  },
  asset_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DigitalAsset',
    required: false
  },
  note_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LegacyNote',
    required: false
  },
  ip_address: {
    type: String,
    required: true
  },
  user_agent: {
    type: String,
    required: true
  },
  device_type: {
    type: String,
    enum: ['Desktop', 'Mobile', 'Tablet', 'Unknown'],
    default: 'Unknown'
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILED', 'BLOCKED'],
    default: 'SUCCESS'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
auditLogSchema.index({ nominee_id: 1, timestamp: -1 });
auditLogSchema.index({ user_id: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
