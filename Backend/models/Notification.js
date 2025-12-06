const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  type: {
    type: String,
    required: true,
    enum: [
      'ORDER_CREATED',
      'ORDER_UPDATED',
      'ORDER_SHIPPED',
      'ORDER_DELIVERED',
      'ORDER_CANCELLED',
      'PAYMENT_RECEIVED',
      'QUOTE_REQUESTED',
      'QUOTE_RESPONDED',
      'QUOTE_ACCEPTED',
      'QUOTE_REJECTED',
      'WARRANTY_SUBMITTED',
      'WARRANTY_APPROVED',
      'WARRANTY_REJECTED',
      'INVOICE_GENERATED',
      'USER_REGISTERED',
      'USER_APPROVED',
      'USER_REJECTED',
      'RETAILER_SALE',
      'INVENTORY_LOW',
      'PRODUCT_OUT_OF_STOCK',
      'SYSTEM_ALERT',
      'OTHER',
    ],
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  link: {
    type: String,
  },
  relatedEntity: {
    type: String,
    enum: ['Order', 'Quote', 'Warranty', 'Invoice', 'Product', 'User', 'Other'],
  },
  relatedEntityId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
