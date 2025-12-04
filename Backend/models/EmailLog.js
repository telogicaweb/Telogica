const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  recipient: { type: String, required: true },
  recipientType: { 
    type: String, 
    enum: ['user', 'admin', 'retailer'], 
    required: true 
  },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  emailType: { 
    type: String, 
    enum: [
      'quote_request',
      'quote_approval',
      'quote_rejection',
      'order_confirmation',
      'payment_confirmation',
      'warranty_submitted',
      'warranty_approved',
      'warranty_rejected',
      'user_registration',
      'retailer_approval',
      'retailer_sale_notification',
      'invoice_generated'
    ],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['sent', 'failed', 'pending'], 
    default: 'pending' 
  },
  errorMessage: { type: String },
  relatedEntity: {
    entityType: { type: String }, // 'quote', 'order', 'warranty', 'user'
    entityId: { type: mongoose.Schema.Types.ObjectId }
  },
  sentAt: { type: Date }
}, { timestamps: true });

// Index for queries
emailLogSchema.index({ recipient: 1, emailType: 1 });
emailLogSchema.index({ sentAt: -1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
