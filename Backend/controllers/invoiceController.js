const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const ProductUnit = require('../models/ProductUnit');
const { sendEmail } = require('../utils/mailer');

// Generate invoice for an order
exports.generateInvoice = async (req, res) => {
  try {
    const { orderId } = req.body;

    // Check if invoice already exists for this order
    const existingInvoice = await Invoice.findOne({ order: orderId });
    if (existingInvoice) {
      return res.status(400).json({ 
        message: 'Invoice already exists for this order',
        invoice: existingInvoice
      });
    }

    // Get order details
    const order = await Order.findById(orderId)
      .populate('user')
      .populate('products.product');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Get serial numbers for products in this order
    const productsWithSerials = await Promise.all(
      order.products.map(async (item) => {
        const units = await ProductUnit.find({
          order: orderId,
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

    // Calculate totals
    const subtotal = order.products.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = order.discountApplied || 0;
    const tax = 0; // Can be calculated based on region
    const totalAmount = order.totalAmount;

    // Create invoice
    const invoice = await Invoice.create({
      user: order.user._id,
      order: orderId,
      products: productsWithSerials,
      subtotal,
      discount,
      tax,
      totalAmount,
      shippingAddress: order.shippingAddress,
      billingAddress: order.shippingAddress, // Can be different if needed
      paymentMethod: 'Razorpay',
      paymentStatus: order.paymentStatus,
      invoiceDate: new Date(),
      paidDate: order.paymentStatus === 'completed' ? new Date() : null
    });

    await invoice.populate('user order');

    // Send invoice email to user
    await sendEmail(
      order.user.email,
      `Invoice ${invoice.invoiceNumber} - Telogica`,
      `Thank you for your purchase! Your invoice ${invoice.invoiceNumber} for order ${order._id} is ready. Total amount: ₹${totalAmount}`,
      'invoice_generated',
      { entityType: 'invoice', entityId: invoice._id }
    );

    res.status(201).json({
      message: 'Invoice generated successfully',
      invoice
    });
  } catch (error) {
    console.error('Error generating invoice:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get invoice by ID
exports.getInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id)
      .populate('user', 'name email phone')
      .populate('order')
      .populate('products.product');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check if user has access to this invoice
    if (req.user.role !== 'admin' && invoice.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get invoice by order ID
exports.getInvoiceByOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const invoice = await Invoice.findOne({ order: orderId })
      .populate('user', 'name email phone')
      .populate('order')
      .populate('products.product');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found for this order' });
    }

    // Check if user has access to this invoice
    if (req.user.role !== 'admin' && invoice.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user's invoices
exports.getUserInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user._id })
      .populate('order')
      .populate('products.product')
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all invoices (Admin)
exports.getAllInvoices = async (req, res) => {
  try {
    const { paymentStatus, startDate, endDate } = req.query;
    
    const filter = {};
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate);
      if (endDate) filter.invoiceDate.$lte = new Date(endDate);
    }

    const invoices = await Invoice.find(filter)
      .populate('user', 'name email phone')
      .populate('order')
      .populate('products.product')
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Resend invoice email
exports.resendInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id).populate('user order');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Send invoice email
    await sendEmail(
      invoice.user.email,
      `Invoice ${invoice.invoiceNumber} - Telogica`,
      `Your invoice ${invoice.invoiceNumber} for order ${invoice.order._id}. Total amount: ₹${invoice.totalAmount}`,
      'invoice_generated',
      { entityType: 'invoice', entityId: invoice._id }
    );

    res.json({ message: 'Invoice email sent successfully' });
  } catch (error) {
    console.error('Error resending invoice:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = exports;
