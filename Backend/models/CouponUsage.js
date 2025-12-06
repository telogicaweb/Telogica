const mongoose = require('mongoose');

const couponUsageSchema = new mongoose.Schema({
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  discountAmount: {
    type: Number,
    required: true,
  },
  orderAmount: {
    type: Number,
    required: true,
  },
  usedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

couponUsageSchema.index({ coupon: 1, user: 1 });
couponUsageSchema.index({ user: 1, usedAt: -1 });
couponUsageSchema.index({ order: 1 });

module.exports = mongoose.model('CouponUsage', couponUsageSchema);
