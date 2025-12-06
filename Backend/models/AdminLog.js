const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  adminName: {
    type: String,
    required: true
  },
  adminEmail: String,
  adminRole: String,
  action: {
    type: String,
    required: true
  },
  actionCategory: {
    type: String,
    enum: [
      'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'IMPORT', 
      'LOGIN', 'LOGOUT', 'SECURITY', 'SYSTEM', 'INTEGRATION', 
      'NOTIFICATION', 'BATCH', 'WORKFLOW', 'AUDIT', 'BACKUP', 
      'RESTORE', 'CONFIG', 'PERMISSION'
    ],
    default: 'SYSTEM'
  },
  entity: {
    type: String,
    required: true
  },
  entityId: String,
  severity: {
    type: String,
    enum: ['DEBUG', 'INFO', 'NOTICE', 'WARNING', 'ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY'],
    default: 'INFO'
  },
  message: String,
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  statusCode: Number,
  responseTime: Number,
  location: {
    country: String,
    city: String,
    latitude: Number,
    longitude: Number
  },
  tags: [String],
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  metadata: mongoose.Schema.Types.Mixed,
  correlationId: String,
  sessionId: String,
  version: String,
  archived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster querying
adminLogSchema.index({ timestamp: -1 });
adminLogSchema.index({ adminId: 1 });
adminLogSchema.index({ action: 1 });
adminLogSchema.index({ entity: 1 });
adminLogSchema.index({ severity: 1 });
adminLogSchema.index({ '$**': 'text' }); // Text index for search

module.exports = mongoose.model('AdminLog', adminLogSchema);
