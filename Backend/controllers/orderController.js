const Order = require('../models/Order');
const Quote = require('../models/Quote');
const Product = require('../models/Product');
const ProductUnit = require('../models/ProductUnit');
const Invoice = require('../models/Invoice');
const Warranty = require('../models/Warranty');
const RetailerInventory = require('../models/RetailerInventory');
const RetailerQuotedProduct = require('../models/RetailerQuotedProduct');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendEmail } = require('../utils/mailer');
const { logAdminAction } = require('../utils/logger');
const { generateAndUploadInvoice, generateAndUploadDropshipInvoice, generateCustomerInvoicePdfBuffer } = require('../utils/invoiceGenerator');
const { getOrderConfirmationEmail, getDeliveryTrackingEmail, getInvoiceEmail } = require('../utils/emailTemplates');
const { generateAndUploadWarranty } = require('../utils/warrantyGenerator');
const { recalculateProductInventory } = require('../utils/inventory');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

const MAX_DIRECT_PURCHASE = parseInt(process.env.MAX_DIRECT_PURCHASE_ITEMS) || 3;
const PRICE_TOLERANCE = 0.01; // Tolerance for floating point price comparisons

// @desc    Update order delivery tracking link
// @route   PUT /api/orders/:id/tracking
// @access  Private/Admin
const updateOrderTrackingLink = async (req, res) => {
  try {
    const { deliveryTrackingLink, trackingId } = req.body;
    const order = await Order.findById(req.params.id).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.deliveryTrackingLink = deliveryTrackingLink;
    if (trackingId) {
      order.trackingId = trackingId;
    }
    const updatedOrder = await order.save();

    // Log admin action for tracking update
    await logAdminAction(req, 'UPDATE', 'Order', updatedOrder._id, {
      action: 'tracking_update',
      trackingLink: deliveryTrackingLink,
      trackingId: trackingId
    });

    // Determine email recipient
    let emailRecipient = order.user ? order.user.email : null;
    let nameRecipient = order.user ? order.user.name : 'Customer';

    // If dropship, send to the customer email instead (or additionally)
    // The requirement says "send link to customer email entered by retailer"
    if (order.isDropship && order.customerDetails && order.customerDetails.email) {
      emailRecipient = order.customerDetails.email;
      nameRecipient = order.customerDetails.name;
    }

    // Send email notification
    if (deliveryTrackingLink && emailRecipient) {
      const trackingEmailHtml = getDeliveryTrackingEmail(
        nameRecipient,
        order.orderNumber || order._id.toString().slice(-8),
        deliveryTrackingLink,
        trackingId
      );

      sendEmail(
        emailRecipient,
        'Your Order is On Its Way! - Telogica',
        `Your order ${order.orderNumber || order._id} has been shipped. Track it here: ${deliveryTrackingLink}${trackingId ? ` (Tracking ID: ${trackingId})` : ''}`,
        'order_tracking',
        { entityType: 'order', entityId: order._id },
        trackingEmailHtml
      ).catch(err => console.error('Failed to send tracking link email:', err));
    }

    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
// @access  Private
const createOrder = async (req, res) => {
  let { products, totalAmount, shippingAddress, quoteId, isRetailerDirectPurchase, isDropship, customerDetails, customerInvoiceUrl, dropshipShipments } = req.body;

  // ROBUSTNESS: If dropshipShipments is provided, treat as dropship regardless of flag
  const hasMultipleShipments = Array.isArray(dropshipShipments) && dropshipShipments.length > 0;
  if (hasMultipleShipments) {
    isDropship = true;
    console.log('[DEBUG] Auto-detected Dropship Mode from payload data.');
  }

  // -------------------------------------------------------------------------
  // MULTI-SHIPMENT DROPSHIP LOGIC
  // -------------------------------------------------------------------------
  if (hasMultipleShipments) {
    console.log('[DEBUG] Entering MULTI-SHIPMENT Block (Shipments:', dropshipShipments.length, ')');
    try {
      // 1. Validation & Calculation
      let grandTotal = 0;
      const allOrdersData = [];

      // Fetch all involved products once to minimize DB calls
      const allProductIds = new Set();
      const allQuoteIds = new Set();
      dropshipShipments.forEach(s => s.items.forEach(i => {
        allProductIds.add(i.productId);
        if (i.quotedProductId) allQuoteIds.add(i.quotedProductId);
      }));

      const dbProducts = await Product.find({ _id: { $in: [...allProductIds] } });
      const productMap = new Map(dbProducts.map(p => [p._id.toString(), p]));

      // Fetch Quoted Products if any
      let quoteMap = new Map();
      if (allQuoteIds.size > 0) {
        const quotes = await RetailerQuotedProduct.find({ _id: { $in: [...allQuoteIds] } });
        quoteMap = new Map(quotes.map(q => [q._id.toString(), q]));
      }

      for (const shipment of dropshipShipments) {
        let shipmentTotal = 0;
        const shipmentProcessedProducts = [];

        for (const item of shipment.items) {
          const dbProduct = productMap.get(item.productId);
          if (!dbProduct) return res.status(400).json({ message: `Product not found: ${item.productName}` });

          // Price Calculation Priority:
          // 1. Quoted Price (if provided and valid)
          // 2. Retailer Price (if user is retailer)
          // 3. Standard Price
          let itemPrice = 0;
          let usedQuoteId = undefined;

          if (item.quotedProductId && quoteMap.has(item.quotedProductId)) {
            const quote = quoteMap.get(item.quotedProductId);
            // Verify quote belongs to this product and retailer
            // FIXED: Model uses 'retailer' field, not 'user'
            if (quote.product.toString() === item.productId && quote.retailer.toString() === req.user._id.toString()) {
              itemPrice = quote.quotedPrice;
              usedQuoteId = item.quotedProductId;
            } else {
              // Fallback if quote is invalid/mismatched (shouldn't happen with valid frontend)
              itemPrice = (req.user.role === 'retailer' && dbProduct.retailerPrice) ? dbProduct.retailerPrice : dbProduct.price;
            }
          } else if (req.user.role === 'retailer' && dbProduct.retailerPrice) {
            itemPrice = dbProduct.retailerPrice;
          } else {
            itemPrice = dbProduct.price;
          }

          shipmentTotal += itemPrice * item.quantity;
          shipmentProcessedProducts.push({
            product: item.productId,
            quantity: item.quantity,
            price: itemPrice,
            useRetailerPrice: req.user.role === 'retailer',
            quotedProductId: usedQuoteId, // Store this linkage
            warrantyOption: 'standard',
            warrantyPrice: 0
          });
        }
        grandTotal += shipmentTotal;
        allOrdersData.push({
          shipment,
          total: shipmentTotal,
          products: shipmentProcessedProducts
        });
      }

      // Stock Check (Accumulated)
      const demandMap = {};
      dropshipShipments.forEach(s => s.items.forEach(i => {
        demandMap[i.productId] = (demandMap[i.productId] || 0) + i.quantity;
      }));

      for (const [pid, qty] of Object.entries(demandMap)) {
        const avail = await ProductUnit.countDocuments({
          product: pid,
          status: 'available',
          stockType: { $in: ['offline', 'both'] }
        });
        if (avail < qty) {
          return res.status(400).json({ message: `Insufficient stock for product ID ${pid}. Required: ${qty}, Available: ${avail}` });
        }
      }

      // 2. Create Razorpay Order (One for Grand Total)
      const options = {
        amount: Math.round(grandTotal * 100),
        currency: "INR",
        receipt: `receipt_ds_batch_${Date.now()}`
      };
      const razorpayOrder = await razorpay.orders.create(options);

      // 3. Create Order Documents
      const createdOrders = [];
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      let index = 0;
      for (const data of allOrdersData) {
        index++;
        const random = Math.floor(1000 + Math.random() * 9000);
        // Ensure uniqueness by adding index and extra random digits
        const orderNumber = `ORD-${year}${month}${day}-${Date.now().toString().slice(-4)}-${index}-${random}`;

        const order = new Order({
          user: req.user._id,
          products: data.products,
          totalAmount: data.total,
          shippingAddress: data.shipment.customerDetails.address,
          razorpayOrderId: razorpayOrder.id, // Shared ID
          orderNumber,
          isDropship: true,
          customerDetails: data.shipment.customerDetails,
          customerInvoiceUrl: data.shipment.invoiceUrl
        });
        const saved = await order.save();
        console.log(`[DEBUG] Created Dropship Order: ${saved._id}, OrderNum: ${saved.orderNumber} for RazorpayID: ${razorpayOrder.id}`);
        createdOrders.push(saved);
      }

      // 4. Return Response
      res.status(201).json({ order: createdOrders[0], razorpayOrder, allOrders: createdOrders });

    } catch (error) {
      console.error('Error in createOrder (Dropship):', error);
      res.status(500).json({ message: error.message });
    }
    return;
  }

  // STANDARD FLOW (Only reached if hasMultipleShipments is false)
  console.log('[DEBUG] Executing STANDARD SINGLE ORDER Flow');

  // CRITICAL FAIL-SAFE:
  // If we are here, but the request IS marked as dropship, something is wrong with the data processing.
  // We must abort to prevent creating a single aggregated order.
  if (isDropship) {
    console.error('[CRITICAL] isDropship is TRUE but fell back to Standard Flow. Shipments Array:', typeof dropshipShipments, dropshipShipments ? dropshipShipments.length : 'null');
    return res.status(400).json({
      message: 'Dropship Error: Request marked as dropship but multiple shipments were not processed. Please contact support.',
      debug: { type: typeof dropshipShipments, length: dropshipShipments?.length }
    });
  }

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

      const nonTelecomProducts = dbProducts.filter(p => {
        // Check both isTelecom field and category field (case-insensitive)
        const isTelecomByFlag = p.isTelecom === true;
        const isTelecomByCategory = p.category && p.category.toLowerCase() === 'telecommunication';
        return !isTelecomByFlag && !isTelecomByCategory;
      });

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

    // Calculate total with warranty costs, tax and validate pricing
    let calculatedSubtotal = 0;
    let calculatedTax = 0;
    const processedProducts = [];

    for (const item of products) {
      const dbProduct = productMap.get(item.product);
      if (!dbProduct) {
        return res.status(400).json({ message: `Product not found: ${item.product}` });
      }

      let itemPrice = item.price;
      let warrantyPrice = 0;
      let warrantyMonths = dbProduct.warrantyPeriodMonths || 12;

      // Check for Quote-based line item (from RetailerQuotedProduct)
      if (item.quotedProductId) {
        const quotedProduct = await RetailerQuotedProduct.findById(item.quotedProductId);

        if (!quotedProduct) {
          return res.status(400).json({ message: `Quoted product record not found for "${dbProduct.name}"` });
        }

        // Ensure this quoted product belongs to the user
        if (quotedProduct.retailer.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: `Unauthorized access to quoted product "${dbProduct.name}"` });
        }

        // Ensure product matches
        if (quotedProduct.product.toString() !== item.product) {
          return res.status(400).json({ message: `Product mismatch in quoted record for "${dbProduct.name}"` });
        }

        // Validate price matches quoted price
        if (Math.abs(item.price - quotedProduct.quotedPrice) > PRICE_TOLERANCE) {
          return res.status(400).json({
            message: `Price mismatch for quoted product "${dbProduct.name}". Expected: ₹${quotedProduct.quotedPrice}, Received: ₹${item.price}`,
            expected: quotedProduct.quotedPrice,
            received: item.price
          });
        }
      }
      // For retailer direct purchases, validate retailer pricing (only if not a quoted line item)
      else if (isRetailerDirectPurchase && req.user.role === 'retailer' && item.useRetailerPrice) {
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

      // Calculate item subtotal (price + warranty)
      const itemSubtotal = (itemPrice * item.quantity) + (warrantyPrice * item.quantity);
      calculatedSubtotal += itemSubtotal;

      // Calculate tax for this item
      const taxPercentage = dbProduct.taxPercentage || 18;
      const itemTax = (itemSubtotal * taxPercentage) / 100;
      calculatedTax += itemTax;

      processedProducts.push({
        ...item,
        warrantyMonths,
        warrantyPrice
      });
    }

    // Calculate total including GST
    const calculatedTotal = calculatedSubtotal + calculatedTax;

    // Validate total amount (allow small tolerance for floating point)
    if (!quoteId && Math.abs(calculatedTotal - totalAmount) > PRICE_TOLERANCE) {
      return res.status(400).json({
        message: `Price mismatch. Expected: ₹${calculatedTotal.toFixed(2)} (Subtotal: ₹${calculatedSubtotal.toFixed(2)} + GST: ₹${calculatedTax.toFixed(2)}), Received: ₹${totalAmount}`,
        calculatedTotal,
        calculatedSubtotal,
        calculatedTax,
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

    // Generate persistent dropship invoice if applicable
    let finalCustomerInvoiceUrl = customerInvoiceUrl;
    if (isDropship) {
      try {
        const invoiceItems = products.map(p => ({
          quantity: p.quantity,
          product: productMap.get(p.product)
        }));

        finalCustomerInvoiceUrl = await generateAndUploadDropshipInvoice({
          retailer: req.user,
          customerDetails,
          items: invoiceItems,
          invoiceNumber: `DS-${Date.now()}`,
          date: new Date()
        });
      } catch (err) {
        console.error('Error generating persistent dropship invoice:', err);
        // Continue without invoice if generation fails, or handle error
      }
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
      orderNumber,
      quoteId: quoteId || null,
      isQuoteBased,
      discountApplied,
      isDropship: !!isDropship,
      customerDetails: isDropship ? customerDetails : undefined,
      customerInvoiceUrl: isDropship ? finalCustomerInvoiceUrl : undefined
    });

    const createdOrder = await order.save();

    // Update quote with order reference
    if (quoteId) {
      await Quote.findByIdAndUpdate(quoteId, { orderId: createdOrder._id });
    }

    // Send order confirmation email (Async - don't await)
    const orderDetailsHtml = createdOrder.products.map(item =>
      `<p style="margin: 5px 0;">• ${item.product?.name || 'Product'} - Qty: ${item.quantity} - ₹${item.price.toLocaleString('en-IN')}</p>`
    ).join('');

    const confirmationEmailHtml = getOrderConfirmationEmail(
      req.user.name,
      createdOrder.orderNumber || createdOrder._id.toString().slice(-8),
      finalAmount,
      orderDetailsHtml
    );

    sendEmail(
      req.user.email,
      'Order Confirmation - Telogica',
      `Your order has been created successfully. Order Number: ${createdOrder.orderNumber || createdOrder._id}. Total Amount: ₹${finalAmount}`,
      'order_confirmation',
      { entityType: 'order', entityId: createdOrder._id },
      confirmationEmailHtml
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

    console.log('[DEBUG] --- Payment Verification ---');
    console.log(`[DEBUG] Received Order ID: ${orderId}`);
    console.log(`[DEBUG] Razorpay Order ID (DB): ${order.razorpayOrderId}`);
    console.log(`[DEBUG] Razorpay Payment ID: ${razorpayPaymentId}`);
    console.log(`[DEBUG] Signature Matched: ${generated_signature === razorpaySignature}`);

    if (generated_signature === razorpaySignature) {
      const ordersToFinalize = await Order.find({ razorpayOrderId: order.razorpayOrderId });
      console.log(`[DEBUG] Payment Verified. Finalizing ${ordersToFinalize.length} orders for RazorpayID: ${order.razorpayOrderId}`);

      if (ordersToFinalize.length === 0) {
        console.error(`[CRITICAL] No orders found for RazorpayID: ${order.razorpayOrderId} despite verification success.`);
      }

      // Define processing function for parallel execution
      const processOrderForVerification = async (order) => {
        try {
          console.log(`[DEBUG] Processing Order Verification: ${order._id} (${order.orderNumber})`);
          order.paymentStatus = 'completed';
          order.orderStatus = 'completed';
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
            return;
          }

          // Assign product units
          const stockType = order.user.role === 'retailer' ? 'offline' : 'online';

          for (let i = 0; i < order.products.length; i++) {
            const item = order.products[i];
            try {
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
                console.error(`Insufficient stock for product ${item.product.name} in order ${order._id}`);
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

              order.products[i].serialNumbers = units.map(u => u.serialNumber);
              await recalculateProductInventory(item.product._id);

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

          await order.save(); // Persist serial numbers

          // Generate Warranties
          try {
            console.log('Generating warranties for order:', order._id);
            for (const item of order.products) {
              if (item.serialNumbers && item.serialNumbers.length > 0) {
                const warrantyPromises = item.serialNumbers.map(async (serialNumber) => {
                  const productUnit = await ProductUnit.findOne({ serialNumber: serialNumber });
                  let warrantyMonths = productUnit ? (productUnit.warrantyPeriodMonths || 12) : 12;

                  if (item.product.category && item.product.category.toLowerCase().includes('premium extra')) {
                    warrantyMonths = 24;
                  }

                  const startDate = new Date();
                  startDate.setDate(startDate.getDate() + 3);

                  const endDate = new Date(startDate);
                  endDate.setMonth(endDate.getMonth() + warrantyMonths);

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

                  const pdfUrl = await generateAndUploadWarranty(warranty, order.user);
                  warranty.warrantyCertificateUrl = pdfUrl;
                  await warranty.save();
                });
                await Promise.all(warrantyPromises);
              }
            }
          } catch (error) {
            console.error('Error generating warranties:', error);
          }

          // Generate Invoice
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

            // Email (Async)
            if (order.user && order.user.email) {
              // Email logic here if needed
            }

          } catch (error) {
            console.error('Error generating invoice/email:', error);
          }

        } catch (error) {
          console.error(`Error processing order ${order._id}:`, error);
        }
      };

      // EXECUTE IN PARALLEL
      await Promise.all(ordersToFinalize.map(order => processOrderForVerification(order)));

      res.json({ message: 'Payment verified successfully' });
    } else {
      console.log('[DEBUG] Signature Mismatch');
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
    const { userId, startDate, endDate } = req.query;
    const filter = {};

    if (userId) {
      filter.user = userId;
    }

    // Date filtering
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set end date to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .populate('products.product')
      .sort({ createdAt: -1 })
      .lean();

    // Fetch invoices for all orders
    const orderIds = orders.map(order => order._id);
    const invoices = await Invoice.find({ order: { $in: orderIds } }).select('order invoiceUrl').lean();

    // Create a map of order ID to invoice URL
    const invoiceMap = {};
    invoices.forEach(invoice => {
      if (invoice.invoiceUrl) {
        invoiceMap[invoice.order.toString()] = invoice.invoiceUrl;
      }
    });

    // Add invoice URL to each order
    const ordersWithInvoices = orders.map(order => ({
      ...order,
      invoiceUrl: invoiceMap[order._id.toString()] || order.customerInvoiceUrl || null
    }));

    res.json(ordersWithInvoices);
  } catch (error) {
    console.error('Error in getOrders:', error);
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

      // Log admin action for order status update
      await logAdminAction(req, 'UPDATE', 'Order', updatedOrder._id, {
        previousStatus,
        newStatus: status,
        paymentStatus: paymentStatus
      });

      // Populate user and products for further processing
      await updatedOrder.populate('user products.product');

      // Inventory update logic removed - handled in verifyPayment


      // Send email notification for status change (Async)
      if (updatedOrder.user && updatedOrder.user.email) {
        const statusChanged = status && previousStatus !== status;
        const paymentStatusChanged = paymentStatus && order.paymentStatus !== paymentStatus;

        if (statusChanged || paymentStatusChanged) {
          let subject, message;

          if (statusChanged) {
            subject = `Order Status Updated - ${status.toUpperCase()}`;
            message = `Your order ${order.orderNumber || order._id} status has been updated to ${status}.`;
          } else if (paymentStatusChanged) {
            subject = `Payment Status Updated - ${paymentStatus.toUpperCase()}`;
            message = `Your order ${order.orderNumber || order._id} payment status has been updated to ${paymentStatus}.`;
          }

          if (subject && message) {
            sendEmail(
              updatedOrder.user.email,
              subject,
              message,
              'order_status_update',
              { entityType: 'order', entityId: order._id }
            ).catch(err => console.error('Error sending status update email:', err));
          }
        }
      }

      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate Dropship Invoice (Delivery Note)
const { generateDropshipInvoicePdfBuffer } = require('../utils/invoiceGenerator');

// @desc    Generate dropship invoice PDF
// @route   POST /api/orders/dropship-invoice
// @access  Private (Retailer)
const generateDropshipInvoice = async (req, res) => {
  try {
    const { customerDetails, items } = req.body;

    // Validate inputs
    if (!customerDetails || !items || items.length === 0) {
      return res.status(400).json({ message: 'Missing customer details or items' });
    }

    // Generate a temporary invoice number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const invoiceNumber = `DS-${dateStr}-${randomStr}`;

    // Generate AND Upload to Cloudinary
    const url = await generateAndUploadDropshipInvoice({
      retailer: req.user,
      customerDetails,
      items,
      invoiceNumber,
      date: new Date()
    });

    // Return the persistent Cloudinary URL
    res.json({ url });

  } catch (error) {
    console.error('Error generating dropship invoice:', error);
    res.status(500).json({ message: 'Failed to generate invoice' });
  }
};

// @desc    Get all dropship orders (Admin)
// @route   GET /api/orders/dropship-shipments
// @access  Private/Admin
const getDropshipOrders = async (req, res) => {
  try {
    const orders = await Order.find({ isDropship: true })
      .populate('user', 'id name email') // Retailer info
      .populate('products.product', 'name price modelNumberPrefix')
      .sort({ createdAt: -1 });

    console.log(`[DEBUG] getDropshipOrders returning ${orders.length} orders.`);

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download Invoice
// @route   GET /api/orders/:id/invoice
// @access  Private
const downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email address phone')
      .populate('products.product');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Authorization check
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Check for dropship invoice first if it's a dropship order
    // REMOVED: Prioritize standard Tax Invoice for retailers over the customer delivery note
    /*
    if (order.isDropship && order.customerInvoiceUrl) {
      return res.redirect(order.customerInvoiceUrl);
    }
    */

    // Find standard invoice
    const invoice = await Invoice.findOne({ order: req.params.id });

    if (invoice && invoice.invoiceUrl) {
      return res.redirect(invoice.invoiceUrl);
    }

    // Fallback: Generate it dynamically if not found
    const { generateOrderInvoicePdfBuffer } = require('../utils/invoiceGenerator');
    const ProductUnit = require('../models/ProductUnit');

    // Fetch product units to get serial numbers
    const productUnits = await ProductUnit.find({
      _id: { $in: order.products.flatMap(p => p.productUnit || []) }
    }).populate('product');

    const pdfBuffer = await generateOrderInvoicePdfBuffer(order, productUnits);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=tax-invoice-${order.orderNumber || order._id}.pdf`,
      'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error('Error downloading invoice:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Generate Customer Invoice (Retailer to Customer)
const generateCustomerInvoice = async (req, res) => {
  try {
    const { sellingPrice, invoiceNumber } = req.body;
    const order = await Order.findById(req.params.id).populate('products.product');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const pdfBuffer = await generateCustomerInvoicePdfBuffer(order, req.user, sellingPrice, invoiceNumber);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=invoice-${invoiceNumber || order.orderNumber || order._id}.pdf`,
      'Content-Length': pdfBuffer.length
    });

    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating customer invoice:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getMyOrders,
  getOrders,
  updateOrderStatus,
  downloadInvoice,
  generateDropshipInvoice,
  getDropshipOrders,
  generateCustomerInvoice,
  updateOrderTrackingLink
};
