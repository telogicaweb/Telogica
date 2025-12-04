const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true } // Price at time of purchase
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
    enum: ['processing', 'shipped', 'delivered', 'cancelled'], 
    default: 'processing' 
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' }, // Reference to quote if order is from quote
  isQuoteBased: { type: Boolean, default: false }, // Flag to indicate if order is based on a quote
  discountApplied: { type: Number, default: 0 } // Discount amount/percentage applied
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
