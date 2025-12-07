const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    originalPrice: { type: Number }, // Store original price for reference
    offeredPrice: { type: Number } // Price offered by admin per unit
  }],
  message: { type: String },
  status: {
    type: String,
    enum: ['pending', 'responded', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  },
  adminResponse: {
    totalPrice: { type: Number }, // Total discounted price for all products
    discountPercentage: { type: Number }, // Discount percentage offered
    message: { type: String },
    respondedAt: { type: Date }
  },
  acceptedAt: { type: Date }, // When user accepted the quote
  rejectionReason: { type: String }, // Reason for rejection (by admin or user)
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // Link to order if quote is converted
  
  // Delivery Tracking
  deliveryTrackingLink: { type: String } // Tracking link provided by admin for delivery status
}, { timestamps: true });

// Add indexes for performance
quoteSchema.index({ user: 1, createdAt: -1 });
quoteSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Quote', quoteSchema);
