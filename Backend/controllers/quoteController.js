const Quote = require('../models/Quote');
const Product = require('../models/Product');
const RetailerQuotedProduct = require('../models/RetailerQuotedProduct');
const { sendEmail } = require('../utils/mailer');
const { getQuoteRequestAdminEmail, getQuoteResponseEmail, getDeliveryTrackingEmail } = require('../utils/emailTemplates');

// @desc    Create a new quote
// @route   POST /api/quotes
// @access  Private
const createQuote = async (req, res) => {
  const { products, message } = req.body;

  if (products && products.length === 0) {
    return res.status(400).json({ message: 'No products in quote' });
  }

  try {
    // Fetch product details to store original prices
    const enrichedProducts = await Promise.all(
      products.map(async (item) => {
        const product = await Product.findById(item.product);
        return {
          product: item.product,
          quantity: item.quantity,
          originalPrice: product.price || 0
        };
      })
    );

    const quote = new Quote({
      user: req.user._id,
      products: enrichedProducts,
      message
    });

    const createdQuote = await quote.save();

    // Notify Admin (Non-blocking)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@telogica.com';
    const quoteRequestEmailHtml = getQuoteRequestAdminEmail(
      req.user.name,
      req.user.email,
      products.length
    );
    
    sendEmail(
      adminEmail,
      'New Quote Request - Telogica',
      `User ${req.user.name} (${req.user.email}) requested a quote with ${products.length} products.`,
      'quote_request',
      { entityType: 'quote', entityId: createdQuote._id },
      quoteRequestEmailHtml
    ).catch(err => console.error('Failed to send admin notification email:', err));

    res.status(201).json(createdQuote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all quotes (Admin) or My Quotes (User)
// @route   GET /api/quotes
// @access  Private
const getQuotes = async (req, res) => {
  try {
    console.log('getQuotes called by user:', req.user ? req.user._id : 'unknown');

    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { userId } = req.query;
    let quotes;
    
    if (req.user.role === 'admin') {
      const filter = {};
      if (userId) {
        filter.user = userId;
      }
      
      quotes = await Quote.find(filter)
        .populate('user', 'name email role')
        .populate('products.product')
        .sort({ createdAt: -1 })
        .lean();
    } else {
      quotes = await Quote.find({ user: req.user._id })
        .populate('products.product')
        .sort({ createdAt: -1 })
        .lean();
    }

    console.log(`Found ${quotes.length} quotes`);
    res.json(quotes);
  } catch (error) {
    console.error('Error in getQuotes:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Respond to quote (Admin)
// @route   PUT /api/quotes/:id/respond
// @access  Private/Admin
const respondToQuote = async (req, res) => {
  const { products, message } = req.body;

  try {
    const quote = await Quote.findById(req.params.id).populate('user', 'email name').populate('products.product');

    if (quote) {
      let calculatedTotal = 0;
      let originalTotal = 0;

      // Update each product's offered price
      if (products && Array.isArray(products)) {
        products.forEach(pItem => {
          // Safely find the product, checking if product exists (it might be null if deleted)
          const quoteProduct = quote.products.find(qp =>
            qp.product && qp.product._id.toString() === pItem.product.toString()
          );

          if (quoteProduct) {
            quoteProduct.offeredPrice = Number(pItem.offeredPrice);
            calculatedTotal += quoteProduct.offeredPrice * quoteProduct.quantity;
            originalTotal += (quoteProduct.originalPrice || 0) * quoteProduct.quantity;
          }
        });
      }

      // Calculate discount percentage
      let discountPercentage = 0;
      if (originalTotal > 0 && calculatedTotal < originalTotal) {
        discountPercentage = ((originalTotal - calculatedTotal) / originalTotal) * 100;
        discountPercentage = Math.round(discountPercentage * 100) / 100;
      }

      quote.adminResponse = {
        totalPrice: calculatedTotal,
        discountPercentage,
        message,
        respondedAt: new Date()
      };
      quote.status = 'responded';

      const updatedQuote = await quote.save();

      // Notify User with email
      const emailText = `Your quote request has been reviewed. Discount: ${discountPercentage}%, Total Price: ₹${calculatedTotal}. Message: ${message}`;
      
      const quoteResponseEmailHtml = getQuoteResponseEmail(
        quote.user.name,
        calculatedTotal,
        message
      );
      
      sendEmail(
        quote.user.email,
        'Your Quote Response is Ready! - Telogica',
        emailText,
        'quote_approval',
        { entityType: 'quote', entityId: quote._id },
        quoteResponseEmailHtml
      ).catch(err => console.error('Failed to send quote response email:', err));

      res.json(updatedQuote);
    } else {
      res.status(404).json({ message: 'Quote not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept quote (User/Retailer)
// @route   PUT /api/quotes/:id/accept
// @access  Private
const acceptQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('products.product');

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Verify the quote belongs to the user
    if (quote.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept this quote' });
    }

    if (quote.status !== 'responded') {
      return res.status(400).json({ message: 'Quote has not been responded to yet' });
    }

    quote.status = 'accepted';
    quote.acceptedAt = new Date();

    const updatedQuote = await quote.save();

    // Save quoted products for retailer
    if (req.user.role === 'retailer') {
      for (const item of quote.products) {
        if (item.product && item.offeredPrice) {
          try {
            await RetailerQuotedProduct.findOneAndUpdate(
              { retailer: req.user._id, product: item.product._id || item.product },
              {
                retailer: req.user._id,
                product: item.product._id || item.product,
                quotedPrice: item.offeredPrice,
                originalPrice: item.originalPrice,
                quoteId: quote._id,
                isActive: true,
                lastUpdatedBy: req.user._id
              },
              { upsert: true, new: true }
            );
          } catch (err) {
            console.error('Error saving quoted product:', err);
          }
        }
      }
    }

    res.json(updatedQuote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject quote (User/Retailer/Admin)
// @route   PUT /api/quotes/:id/reject
// @access  Private
const rejectQuote = async (req, res) => {
  const { reason } = req.body;

  try {
    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    const isAdmin = req.user.role === 'admin' ||
      (req.user.role && req.user.role.toLowerCase() === 'admin') ||
      req.user.email === (process.env.ADMIN_EMAIL || 'admin@telogica.com');
    const isOwner = quote.user.toString() === req.user._id.toString();

    console.log(`Reject Quote Debug: UserID=${req.user._id}, Role=${req.user.role}, QuoteOwner=${quote.user}, IsAdmin=${isAdmin}, IsOwner=${isOwner}`);

    // Allow Admin or Owner to reject
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        message: 'Not authorized to reject this quote',
        debug: {
          userRole: req.user.role,
          isOwner: isOwner,
          userId: req.user._id,
          quoteOwner: quote.user
        }
      });
    }

    // If user is owner (and not admin), they can only reject if status is 'responded'
    if (!isAdmin && quote.status !== 'responded') {
      return res.status(400).json({ message: 'Quote has not been responded to yet' });
    }

    // Prevent rejecting if already processed
    if (['accepted', 'rejected', 'completed'].includes(quote.status)) {
      return res.status(400).json({ message: `Quote is already ${quote.status}` });
    }

    quote.status = 'rejected';
    if (reason) {
      quote.rejectionReason = reason;
    }

    const updatedQuote = await quote.save();
    res.json(updatedQuote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update quote delivery tracking link
// @route   PUT /api/quotes/:id/tracking
// @access  Private/Admin
const updateQuoteTrackingLink = async (req, res) => {
  try {
    const { deliveryTrackingLink } = req.body;
    const quote = await Quote.findById(req.params.id).populate('user', 'name email');

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    quote.deliveryTrackingLink = deliveryTrackingLink;
    const updatedQuote = await quote.save();

    // Send email notification to user
    if (deliveryTrackingLink && quote.user && quote.user.email) {
      const trackingEmailHtml = getDeliveryTrackingEmail(
        quote.user.name,
        `Quote-${quote._id.toString().slice(-8)}`,
        deliveryTrackingLink
      );

      sendEmail(
        quote.user.email,
        'Your Order is On Its Way! - Telogica',
        `Your quote order tracking link is now available. Track it here: ${deliveryTrackingLink}`,
        'quote_tracking',
        { entityType: 'quote', entityId: quote._id },
        trackingEmailHtml
      ).catch(err => console.error('Failed to send tracking link email:', err));
    }

    res.json(updatedQuote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createQuote, getQuotes, respondToQuote, acceptQuote, rejectQuote, updateQuoteTrackingLink };
