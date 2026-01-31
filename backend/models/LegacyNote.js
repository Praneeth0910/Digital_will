import mongoose from 'mongoose';

const legacyNoteSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  visibility: {
    type: String,
    enum: ['PRIVATE', 'NOMINEE', 'PUBLIC'],
    default: 'PRIVATE'
  },
  release_condition: {
    type: String,
    enum: ['IMMEDIATE', 'ON_DEATH', 'ON_INCAPACITY', 'CUSTOM'],
    default: 'ON_DEATH'
  },
  category: {
    type: String,
    enum: ['Personal', 'Family', 'Professional', 'Financial', 'Medical', 'Other'],
    default: 'Personal'
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  written_date: {
    type: Date,
    default: Date.now
  },
  last_modified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
legacyNoteSchema.index({ user_id: 1, visibility: 1 });

const LegacyNote = mongoose.model('LegacyNote', legacyNoteSchema);

export default LegacyNote;
