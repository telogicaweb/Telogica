const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  recipient: {
    type: String,
    required: true
  },
  recipientType: {
    type: String,
    enum: ['user', 'admin', 'retailer', 'system'],
    default: 'user'
  },
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  emailType: {
    type: String,
    required: true,
    enum: [
      'welcome', 'password_reset', 'order_confirmation', 'order_shipped',
      'quote_request', 'quote_response', 'warranty_registration',
      'contact_confirmation', 'contact_notification', 'invoice',
      'delivery_tracking', 'retailer_welcome', 'payment_confirmation',
      'payment-success', 'general'
    ]
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed', 'bounced'],
    default: 'pending'
  },
  sentAt: {
    type: Date
  },
  errorMessage: {
    type: String
  },
  relatedEntity: {
    type: {
      type: String,
      enum: ['order', 'quote', 'user', 'warranty', 'contact', 'invoice', 'general']
    },
    id: String
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
emailLogSchema.index({ recipient: 1, createdAt: -1 });
emailLogSchema.index({ status: 1, createdAt: -1 });
emailLogSchema.index({ emailType: 1, createdAt: -1 });
emailLogSchema.index({ 'relatedEntity.type': 1, 'relatedEntity.id': 1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
