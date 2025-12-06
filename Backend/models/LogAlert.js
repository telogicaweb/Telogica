const mongoose = require('mongoose');

const logAlertSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  criteria: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  threshold: {
    type: Number,
    default: 1
  },
  timeWindow: {
    type: Number, // in minutes
    default: 60
  },
  channels: [{
    type: String,
    enum: ['email', 'sms', 'slack', 'webhook']
  }],
  recipients: [String],
  enabled: {
    type: Boolean,
    default: true
  },
  lastTriggered: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LogAlert', logAlertSchema);
