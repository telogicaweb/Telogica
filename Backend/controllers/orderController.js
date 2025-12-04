const Order = require('../models/Order');
const Quote = require('../models/Quote');
const ProductUnit = require('../models/ProductUnit');
const Invoice = require('../models/Invoice');
const RetailerInventory = require('../models/RetailerInventory');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendEmail } = require('../utils/mailer');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const MAX_DIRECT_PURCHASE = parseInt(process.env.MAX_DIRECT_PURCHASE_ITEMS) || 3;

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  const { products, totalAmount, shippingAddress, quoteId } = req.body;

  if (products && products.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }

  try {
    // Check if user is a regular user and has more than allowed items without a quote
    if (req.user.role === 'user' && !quoteId && products.length > MAX_DIRECT_PURCHASE) {
      return res.status(400).json({ 
        message: `Regular users can only purchase up to ${MAX_DIRECT_PURCHASE} items directly. Please request a quote for larger orders.`,
        requiresQuote: true
      });
    }

    let isQuoteBased = false;
    let discountApplied = 0;
    let finalAmount = totalAmount;

    // If order is based on a quote, verify and use quote price
    if (quoteId) {
      const quote = await Quote.findById(quoteId);
      
      if (!quote) {
        return res.status(404).json({ message: 'Quote not found' });
      }

      if (quote.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized to use this quote' });
      }

      if (quote.status !== 'accepted') {
        return res.status(400).json({ message: 'Quote must be accepted before creating an order' });
      }

      if (quote.orderId) {
        return res.status(400).json({ message: 'Quote has already been used for an order' });
      }

      isQuoteBased = true;
      finalAmount = quote.adminResponse.totalPrice;
      discountApplied = quote.adminResponse.discountPercentage || 0;
    }

    // Create Razorpay Order
    const options = {
      amount: finalAmount * 100, // amount in smallest currency unit
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`
    };

    const razorpayOrder = await razorpay.orders.create(options);

    const order = new Order({
      user: req.user._id,
      products,
      totalAmount: finalAmount,
      shippingAddress,
      razorpayOrderId: razorpayOrder.id,
      quoteId: quoteId || null,
      isQuoteBased,
      discountApplied
    });

    const createdOrder = await order.save();

    // Update quote with order reference
    if (quoteId) {
      await Quote.findByIdAndUpdate(quoteId, { orderId: createdOrder._id });
    }

    // Send order confirmation email
    const user = await req.user.populate('_id name email');
    await sendEmail(
      req.user.email,
      'Order Created - Telogica',
      `Your order has been created successfully. Order ID: ${createdOrder._id}. Total Amount: ₹${finalAmount}. Please complete the payment.`,
      'order_confirmation',
      { entityType: 'order', entityId: createdOrder._id }
    );

    res.status(201).json({ order: createdOrder, razorpayOrder });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify Payment
// @route   POST /api/orders/verify
// @access  Private
const verifyPayment = async (req, res) => {
  const { orderId, razorpayPaymentId, razorpaySignature } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }

    const generated_signature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(order.razorpayOrderId + "|" + razorpayPaymentId)
      .digest('hex');

    if (generated_signature === razorpaySignature) {
      order.paymentStatus = 'completed';
      order.razorpayPaymentId = razorpayPaymentId;
      order.razorpaySignature = razorpaySignature;
      await order.save();

      await order.populate('user products.product');

      // Assign product units to the order
      const stockType = order.user.role === 'retailer' ? 'offline' : 'online';
      for (const item of order.products) {
        try {
          // Assign units to order
          const filter = { 
            product: item.product._id, 
            status: 'available' 
          };

          if (stockType === 'offline') {
            filter.stockType = { $in: ['offline', 'both'] };
          } else {
            filter.stockType = { $in: ['online', 'both'] };
          }

          const units = await ProductUnit.find(filter).limit(item.quantity);

          await Promise.all(
            units.map(unit => 
              ProductUnit.findByIdAndUpdate(
                unit._id,
                {
                  status: 'sold',
                  currentOwner: order.user._id,
                  order: order._id,
                  soldDate: new Date(),
                  retailer: order.user.role === 'retailer' ? order.user._id : null,
                  retailerPurchaseDate: order.user.role === 'retailer' ? new Date() : null
                }
              )
            )
          );

          // If retailer purchase, add to retailer inventory
          if (order.user.role === 'retailer') {
            await Promise.all(
              units.map(unit => 
                RetailerInventory.create({
                  retailer: order.user._id,
                  productUnit: unit._id,
                  product: item.product._id,
                  purchaseOrder: order._id,
                  purchaseDate: new Date(),
                  purchasePrice: item.price,
                  status: 'in_stock'
                })
              )
            );
          }
        } catch (error) {
          console.error('Error assigning units:', error);
        }
      }

      // Generate invoice
      try {
        const productsWithSerials = await Promise.all(
          order.products.map(async (item) => {
            const units = await ProductUnit.find({
              order: order._id,
              product: item.product._id
            }).limit(item.quantity);

            return {
              product: item.product._id,
              productName: item.product.name,
              quantity: item.quantity,
              price: item.price,
              serialNumbers: units.map(u => u.serialNumber)
            };
          })
        );

        const subtotal = order.products.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        await Invoice.create({
          user: order.user._id,
          order: order._id,
          products: productsWithSerials,
          subtotal,
          discount: order.discountApplied || 0,
          tax: 0,
          totalAmount: order.totalAmount,
          shippingAddress: order.shippingAddress,
          billingAddress: order.shippingAddress,
          paymentMethod: 'Razorpay',
          paymentStatus: 'completed',
          invoiceDate: new Date(),
          paidDate: new Date()
        });
      } catch (error) {
        console.error('Error generating invoice:', error);
      }

      // Send payment confirmation email
      await sendEmail(
        order.user.email,
        'Payment Successful - Telogica',
        `Your payment has been completed successfully. Order ID: ${order._id}. Amount Paid: ₹${order.totalAmount}. Your invoice has been generated.`,
        'payment_confirmation',
        { entityType: 'order', entityId: order._id }
      );

      // Notify admin
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@telogica.com';
      await sendEmail(
        adminEmail,
        'New Order Placed',
        `New order from ${order.user.name} (${order.user.role}). Order ID: ${order._id}. Amount: ₹${order.totalAmount}`,
        'order_confirmation',
        { entityType: 'order', entityId: order._id }
      );

      res.json({ message: 'Payment verified successfully' });
    } else {
      order.paymentStatus = 'failed';
      await order.save();
      res.status(400).json({ message: 'Payment verification failed' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate('products.product');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'id name').populate('products.product');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createOrder, verifyPayment, getMyOrders, getOrders };
