const Order = require('../models/Order');
const Quote = require('../models/Quote');
const Product = require('../models/Product');
const ProductUnit = require('../models/ProductUnit');
const Invoice = require('../models/Invoice');
const Warranty = require('../models/Warranty');
const RetailerInventory = require('../models/RetailerInventory');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendEmail } = require('../utils/mailer');
const { generateAndUploadInvoice } = require('../utils/invoiceGenerator');
const { generateAndUploadWarranty } = require('../utils/warrantyGenerator');
const { recalculateProductInventory } = require('../utils/inventory');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const MAX_DIRECT_PURCHASE = parseInt(process.env.MAX_DIRECT_PURCHASE_ITEMS) || 3;
const PRICE_TOLERANCE = 0.01; // Tolerance for floating point price comparisons

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  const { products, totalAmount, shippingAddress, quoteId, isRetailerDirectPurchase } = req.body;

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

    // Enforce TELECOM-only direct purchase rule for regular users (not retailers with retailer price)
    if (!quoteId && req.user.role !== 'retailer') {
      const productIds = products.map(p => p.product);
      const dbProducts = await Product.find({ _id: { $in: productIds } });

      const nonTelecomProducts = dbProducts.filter(p =>
        !p.category || p.category.toLowerCase() !== 'telecom'
      );

      if (nonTelecomProducts.length > 0) {
        return res.status(400).json({
          message: 'Only TELECOM products can be purchased directly. Please request a quote for other items.',
          products: nonTelecomProducts.map(p => p.name)
        });
      }
    }

    // Get product details for validation
    const productIds = products.map(p => p.product);
    const dbProducts = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(dbProducts.map(p => [p._id.toString(), p]));

    // Calculate total with warranty costs and validate pricing
    let calculatedTotal = 0;
    const processedProducts = [];

    for (const item of products) {
      const dbProduct = productMap.get(item.product);
      if (!dbProduct) {
        return res.status(400).json({ message: `Product not found: ${item.product}` });
      }

      let itemPrice = item.price;
      let warrantyPrice = 0;
      let warrantyMonths = dbProduct.warrantyPeriodMonths || 12;

      // For retailer direct purchases, validate retailer pricing
      if (isRetailerDirectPurchase && req.user.role === 'retailer' && item.useRetailerPrice) {
        if (!dbProduct.retailerPrice) {
          return res.status(400).json({
            message: `Product "${dbProduct.name}" does not have a retailer price set. Please request a quote.`,
            product: dbProduct.name
          });
        }
        if (Math.abs(item.price - dbProduct.retailerPrice) > PRICE_TOLERANCE) {
          return res.status(400).json({
            message: `Invalid price for product "${dbProduct.name}". Expected retailer price: ₹${dbProduct.retailerPrice}`,
            product: dbProduct.name
          });
        }
      }

      // Handle warranty option
      if (item.warrantyOption === 'extended') {
        if (!dbProduct.extendedWarrantyAvailable) {
          return res.status(400).json({
            message: `Extended warranty is not available for product "${dbProduct.name}"`,
            product: dbProduct.name
          });
        }
        warrantyPrice = dbProduct.extendedWarrantyPrice || 0;
        warrantyMonths = dbProduct.extendedWarrantyMonths || 24;
      }

      calculatedTotal += (itemPrice * item.quantity) + (warrantyPrice * item.quantity);

      processedProducts.push({
        ...item,
        warrantyMonths,
        warrantyPrice
      });
    }

    // Validate total amount (allow small tolerance for floating point)
    if (!quoteId && Math.abs(calculatedTotal - totalAmount) > PRICE_TOLERANCE) {
      return res.status(400).json({
        message: `Price mismatch. Expected: ₹${calculatedTotal}, Received: ₹${totalAmount}`,
        calculatedTotal,
        receivedTotal: totalAmount
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

    // Ensure stock availability before creating payment order
    const userStockPreference = req.user.role === 'retailer' ? 'offline' : 'online';
    for (const item of products) {
      const availabilityFilter = {
        product: item.product,
        status: 'available',
        stockType: userStockPreference === 'offline'
          ? { $in: ['offline', 'both'] }
          : { $in: ['online', 'both'] }
      };

      const availableUnits = await ProductUnit.countDocuments(availabilityFilter);
      if (availableUnits < item.quantity) {
        return res.status(400).json({
          message: 'Insufficient stock available for this product',
          product: item.product,
          available: availableUnits,
          required: item.quantity
        });
      }
    }

    // Create Razorpay Order
    const options = {
      amount: Math.round(finalAmount * 100), // amount in smallest currency unit (paise), ensure integer
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`
    };

    console.log('Creating Razorpay order with options:', options);

    const razorpayOrder = await razorpay.orders.create(options);

    // Generate custom order number
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ORD-${year}${month}${day}-${random}`;

    const order = new Order({
      user: req.user._id,
      products: quoteId ? products : processedProducts,
      totalAmount: finalAmount,
      shippingAddress,
      razorpayOrderId: razorpayOrder.id,
      orderNumber,
      quoteId: quoteId || null,
      isQuoteBased,
      discountApplied
    });

    const createdOrder = await order.save();

    // Update quote with order reference
    if (quoteId) {
      await Quote.findByIdAndUpdate(quoteId, { orderId: createdOrder._id });
    }

    // Send order confirmation email (Async - don't await)
    sendEmail(
      req.user.email,
      'Order Created - Telogica',
      `Your order has been created successfully. Order ID: ${createdOrder._id}. Total Amount: ₹${finalAmount}. Please complete the payment.`,
      'order_confirmation',
      { entityType: 'order', entityId: createdOrder._id }
    ).catch(emailError => console.error('Error sending email:', emailError));

    res.status(201).json({ order: createdOrder, razorpayOrder });
  } catch (error) {
    console.error('Error in createOrder:', error);
    res.status(500).json({ message: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined });
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

    console.log('--- Payment Verification Debug ---');
    console.log('Order ID:', orderId);
    console.log('Razorpay Order ID (DB):', order.razorpayOrderId);
    console.log('Razorpay Payment ID (Client):', razorpayPaymentId);
    console.log('Razorpay Signature (Client):', razorpaySignature);
    console.log('Generated Signature:', generated_signature);
    console.log('Match:', generated_signature === razorpaySignature);
    console.log('----------------------------------');

    if (generated_signature === razorpaySignature) {
      order.paymentStatus = 'completed';
      order.orderStatus = 'completed'; // Immediately complete order
      order.razorpayPaymentId = razorpayPaymentId;
      order.razorpaySignature = razorpaySignature;
      await order.save();

      // Update quote status if this order was from a quote
      if (order.quoteId) {
        await Quote.findByIdAndUpdate(order.quoteId, { status: 'completed' });
      }

      await order.populate('user products.product');

      if (!order.user) {
        console.error('Order user not found after populate:', order.user);
        throw new Error('User not found for this order');
      }

      console.log('Order user populated:', order.user._id, order.user.role);

      // Assign product units to the order
      const stockType = order.user.role === 'retailer' ? 'offline' : 'online';

      // Use a for loop to allow updating the order object in place
      for (let i = 0; i < order.products.length; i++) {
        const item = order.products[i];
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

          if (units.length < item.quantity) {
            throw new Error('Insufficient stock while finalizing order');
          }

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

          // Update order item with serial numbers
          order.products[i].serialNumbers = units.map(u => u.serialNumber);

          await recalculateProductInventory(item.product._id);

          // Note: RetailerInventory is created immediately for retailers
          if (order.user.role === 'retailer') {
            const inventoryEntries = units.map(unit => ({
              retailer: order.user._id,
              productUnit: unit._id,
              product: item.product._id,
              purchaseOrder: order._id,
              purchaseDate: new Date(),
              purchasePrice: item.price,
              status: 'in_stock'
            }));

            if (inventoryEntries.length > 0) {
              await RetailerInventory.insertMany(inventoryEntries);
              console.log(`Added ${inventoryEntries.length} items to retailer inventory`);
            }
          }
        } catch (error) {
          console.error('Error assigning units:', error);
        }
      }

      // Save the order again to persist serial numbers
      await order.save();

      // Generate Warranties
      const warrantyLinks = [];
      try {
        console.log('Generating warranties for order:', order._id);
        for (const item of order.products) {
          if (item.serialNumbers && item.serialNumbers.length > 0) {
            for (const serialNumber of item.serialNumbers) {
              // Find the unit to link it properly
              const productUnit = await ProductUnit.findOne({ serialNumber: serialNumber });
              const warrantyMonths = productUnit ? (productUnit.warrantyPeriodMonths || 12) : 12;

              const startDate = new Date();
              startDate.setDate(startDate.getDate() + 3); // Today + 3 days
              
              const endDate = new Date(startDate);
              endDate.setMonth(endDate.getMonth() + warrantyMonths); // + warranty months

              const warranty = new Warranty({
                user: order.user._id,
                product: item.product._id,
                productUnit: productUnit ? productUnit._id : null,
                productName: item.product.name,
                modelNumber: productUnit ? productUnit.modelNumber : (item.product.modelNumberPrefix || 'N/A'),
                serialNumber: serialNumber,
                purchaseDate: new Date(),
                purchaseType: order.user.role === 'retailer' ? 'retailer' : 'telogica_online',
                status: 'approved',
                warrantyStartDate: startDate,
                warrantyEndDate: endDate,
                warrantyPeriodMonths: warrantyMonths
              });

              // Generate PDF
              const pdfUrl = await generateAndUploadWarranty(warranty, order.user);
              warranty.warrantyCertificateUrl = pdfUrl;
              
              await warranty.save();
              console.log(`Warranty generated for ${serialNumber}: ${pdfUrl}`);
              
              warrantyLinks.push({
                name: item.product.name,
                serial: serialNumber,
                url: pdfUrl
              });
            }
          }
        }
      } catch (error) {
        console.error('Error generating warranties:', error);
      }

      // Generate invoice
      let invoice;
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

        invoice = await Invoice.create({
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

        // Generate and upload PDF
        try {
          const invoiceUrl = await generateAndUploadInvoice(order, invoice);
          if (invoiceUrl) {
            invoice.invoiceUrl = invoiceUrl;
            await invoice.save();
          }
        } catch (pdfError) {
          console.error('Error generating/uploading PDF:', pdfError);
        }
      } catch (error) {
        console.error('Error generating invoice:', error);
      }

      // Send payment confirmation email
      const invoiceLink = invoice && invoice.invoiceUrl ? `\n\nYou can download your invoice here: ${invoice.invoiceUrl}` : '';
      
      let warrantySection = '';
      if (warrantyLinks.length > 0) {
        warrantySection = '\n\nWarranty Certificates:\n' + warrantyLinks.map(w => `${w.name} (Serial: ${w.serial}): ${w.url}`).join('\n');
      }

      if (order.user && order.user.email) {
        sendEmail(
          order.user.email,
          'Payment Successful - Telogica',
          `Your payment has been completed successfully. Order ID: ${order._id}. Amount Paid: ₹${order.totalAmount}.${invoiceLink}${warrantySection}`,
          'payment_confirmation',
          { entityType: 'order', entityId: order._id }
        ).catch(err => console.error('Error sending payment confirmation email:', err));
      }

      // Notify admin (Async)
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@telogica.com';
      sendEmail(
        adminEmail,
        'New Order Placed',
        `New order from ${order.user ? order.user.name : 'Unknown User'} (${order.user ? order.user.role : 'unknown'}). Order ID: ${order._id}. Amount: ₹${order.totalAmount}`,
        'order_confirmation',
        { entityType: 'order', entityId: order._id }
      ).catch(err => console.error('Error sending admin notification email:', err));

      res.json({ message: 'Payment verified successfully' });
    } else {
      order.paymentStatus = 'failed';
      await order.save();
      res.status(400).json({ message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('Error in verifyPayment:', error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('products.product')
      .sort({ createdAt: -1 })
      .lean();
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
    const orders = await Order.find({})
      .populate('user', 'id name')
      .populate('products.product')
      .sort({ createdAt: -1 })
      .lean();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
      const previousStatus = order.orderStatus;

      if (status) {
        order.orderStatus = status;
      }

      if (paymentStatus) {
        order.paymentStatus = paymentStatus;
      }

      const updatedOrder = await order.save();

      // Populate user and products for further processing
      await updatedOrder.populate('user products.product');

      // Inventory update logic removed - handled in verifyPayment


      // Send email notification for status change (Async)
      if (updatedOrder.user && updatedOrder.user.email) {
        sendEmail(
          updatedOrder.user.email,
          `Order Status Updated - ${status.toUpperCase()}`,
          `Your order ${order.orderNumber || order._id} status has been updated to ${status}.`,
          'order_status_update',
          { entityType: 'order', entityId: order._id }
        ).catch(err => console.error('Error sending status update email:', err));
      }

      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download Order Invoice
const { generateOrderInvoicePdfBuffer } = require('../utils/invoiceGenerator');

const downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user')
      .populate('products.product');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify user owns this order
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Fetch product units for this order to get serials/models
    const productUnits = await ProductUnit.find({ order: order._id });

    const buffer = await generateOrderInvoicePdfBuffer(order, productUnits);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice-${order.orderNumber || order._id}.pdf`,
      'Content-Length': buffer.length
    });

    res.send(buffer);
  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createOrder, verifyPayment, getMyOrders, getOrders, updateOrderStatus, downloadInvoice };
