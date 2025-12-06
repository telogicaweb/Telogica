const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');
const logger = require('./loggerService');

const validateCoupon = async (code, userId, cartItems, totalAmount) => {
  try {
    const now = new Date();
    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).populate('applicableProducts excludedProducts');

    if (!coupon) {
      return { valid: false, message: 'Invalid or expired coupon code' };
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return { valid: false, message: 'Coupon usage limit reached' };
    }

    if (totalAmount < coupon.minPurchaseAmount) {
      return {
        valid: false,
        message: `Minimum purchase amount of ₹${coupon.minPurchaseAmount} required`,
      };
    }

    if (coupon.specificUsers.length > 0) {
      const isSpecificUser = coupon.specificUsers.some(
        (user) => user.toString() === userId.toString()
      );
      if (!isSpecificUser) {
        return { valid: false, message: 'This coupon is not available for you' };
      }
    }

    const userUsageCount = await CouponUsage.countDocuments({
      coupon: coupon._id,
      user: userId,
    });

    if (userUsageCount >= coupon.usagePerUser) {
      return { valid: false, message: 'You have reached the usage limit for this coupon' };
    }

    if (coupon.applicableProducts.length > 0) {
      const hasApplicableProduct = cartItems.some((item) =>
        coupon.applicableProducts.some(
          (p) => p._id.toString() === item.product.toString()
        )
      );
      if (!hasApplicableProduct) {
        return { valid: false, message: 'Coupon not applicable to items in cart' };
      }
    }

    if (coupon.excludedProducts.length > 0) {
      const hasExcludedProduct = cartItems.some((item) =>
        coupon.excludedProducts.some(
          (p) => p._id.toString() === item.product.toString()
        )
      );
      if (hasExcludedProduct) {
        return { valid: false, message: 'Cart contains excluded products' };
      }
    }

    let discountAmount = 0;
    if (coupon.type === 'PERCENTAGE') {
      discountAmount = (totalAmount * coupon.value) / 100;
      if (coupon.maxDiscountAmount) {
        discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
      }
    } else if (coupon.type === 'FIXED_AMOUNT') {
      discountAmount = coupon.value;
    }

    return {
      valid: true,
      coupon,
      discountAmount: Math.min(discountAmount, totalAmount),
      message: 'Coupon applied successfully',
    };
  } catch (error) {
    logger.error('Error validating coupon', { error: error.message });
    return { valid: false, message: 'Error validating coupon' };
  }
};

const applyCoupon = async (couponId, userId, orderId, discountAmount, orderAmount) => {
  try {
    const usage = await CouponUsage.create({
      coupon: couponId,
      user: userId,
      order: orderId,
      discountAmount,
      orderAmount,
    });

    await Coupon.findByIdAndUpdate(couponId, {
      $inc: { usedCount: 1 },
    });

    logger.info('Coupon applied', {
      couponId,
      userId,
      orderId,
      discountAmount,
    });

    return usage;
  } catch (error) {
    logger.error('Error applying coupon', { error: error.message });
    throw error;
  }
};

const getCouponStats = async (couponId) => {
  try {
    const coupon = await Coupon.findById(couponId);
    const totalUsage = await CouponUsage.countDocuments({ coupon: couponId });
    const totalDiscount = await CouponUsage.aggregate([
      { $match: { coupon: coupon._id } },
      { $group: { _id: null, total: { $sum: '$discountAmount' } } },
    ]);

    return {
      coupon,
      totalUsage,
      totalDiscount: totalDiscount[0]?.total || 0,
      remainingUsage: coupon.usageLimit ? coupon.usageLimit - totalUsage : null,
    };
  } catch (error) {
    logger.error('Error getting coupon stats', { error: error.message });
    throw error;
  }
};

module.exports = {
  validateCoupon,
  applyCoupon,
  getCouponStats,
};
