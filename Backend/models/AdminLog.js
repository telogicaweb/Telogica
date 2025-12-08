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
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT'],
    required: true
  },
  entity: {
    type: String,
    enum: ['Product', 'Order', 'Warranty', 'Payment', 'User', 'Invoice'],
    required: true
  },
  entityId: String,
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
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

module.exports = mongoose.model('AdminLog', adminLogSchema);
