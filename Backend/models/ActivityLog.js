const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'LOGIN',
      'LOGOUT',
      'REGISTER',
      'UPDATE_PROFILE',
      'CREATE_PRODUCT',
      'UPDATE_PRODUCT',
      'DELETE_PRODUCT',
      'CREATE_ORDER',
      'UPDATE_ORDER',
      'CANCEL_ORDER',
      'CREATE_QUOTE',
      'UPDATE_QUOTE',
      'ACCEPT_QUOTE',
      'REJECT_QUOTE',
      'CREATE_WARRANTY',
      'APPROVE_WARRANTY',
      'REJECT_WARRANTY',
      'CREATE_INVOICE',
      'RESEND_INVOICE',
      'APPROVE_USER',
      'REJECT_USER',
      'UPDATE_USER_ROLE',
      'CREATE_PRODUCT_UNIT',
      'UPDATE_PRODUCT_UNIT',
      'RETAILER_SALE',
      'EXPORT_DATA',
      'VIEW_REPORT',
      'SYSTEM_SETTINGS',
      'OTHER',
    ],
  },
  entity: {
    type: String,
    enum: ['User', 'Product', 'Order', 'Quote', 'Warranty', 'Invoice', 'ProductUnit', 'RetailerInventory', 'Other'],
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  details: {
    type: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'PENDING'],
    default: 'SUCCESS',
  },
  errorMessage: {
    type: String,
  },
}, {
  timestamps: true,
});

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });
activityLogSchema.index({ entity: 1, entityId: 1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
