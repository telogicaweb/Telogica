const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }, // Price at time of purchase
    serialNumbers: [{ type: String }], // Assigned serial numbers
    extendedWarranty: { type: Boolean, default: false }, // Whether extended warranty was purchased
    warrantyMonths: { type: Number, default: 12 } // Warranty period for this product
  }],
  totalAmount: { type: Number, required: true },
  shippingAddress: { type: String, required: true },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'completed'],
    default: 'pending'
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  orderNumber: { type: String, unique: true }, // Custom order number (e.g., ORD-20251204-1234)
  quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' }, // Reference to quote if order is from quote
  isQuoteBased: { type: Boolean, default: false }, // Flag to indicate if order is based on a quote
  discountApplied: { type: Number, default: 0 } // Discount amount/percentage applied
}, { timestamps: true });

// Add indexes for performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
