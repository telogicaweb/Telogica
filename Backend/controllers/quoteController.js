const Quote = require('../models/Quote');
const Product = require('../models/Product');
const { sendEmail } = require('../utils/mailer');

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
    
    // Notify Admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@telogica.com';
    await sendEmail(
      adminEmail,
      'New Quote Request',
      `User ${req.user.name} (${req.user.email}) requested a quote with ${products.length} products.`,
      'quote_request',
      { entityType: 'quote', entityId: createdQuote._id }
    );

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
    let quotes;
    if (req.user.role === 'admin') {
      quotes = await Quote.find({})
        .populate('user', 'name email role')
        .populate('products.product')
        .sort({ createdAt: -1 });
    } else {
      quotes = await Quote.find({ user: req.user._id })
        .populate('products.product')
        .sort({ createdAt: -1 });
    }
    res.json(quotes);
  } catch (error) {
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

      // Notify User with detailed email
      const emailText = `Dear ${quote.user.name},\n\nYour quote request has been reviewed.\n\nDiscount offered: ${discountPercentage}%\nTotal Price: ₹${calculatedTotal}\nMessage: ${message}\n\nPlease login to accept or reject this quote.\n\nThank you!`;
      
      // HTML escape function to prevent XSS
      const escapeHtml = (text) => {
        const map = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
      };
      
      const emailHtml = `
        <h2>Quote Response</h2>
        <p>Dear ${escapeHtml(quote.user.name)},</p>
        <p>Your quote request has been reviewed.</p>
        <ul>
          <li><strong>Discount offered:</strong> ${escapeHtml(String(discountPercentage))}%</li>
          <li><strong>Total Price:</strong> ₹${escapeHtml(String(calculatedTotal))}</li>
          <li><strong>Message:</strong> ${escapeHtml(message)}</li>
        </ul>
        <p>Please login to your account to accept or reject this quote.</p>
        <p>Thank you!</p>
      `;
      await sendEmail(
        quote.user.email,
        'Quote Response - Action Required',
        emailText,
        'quote_approval',
        { entityType: 'quote', entityId: quote._id },
        emailHtml
      );

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
    const quote = await Quote.findById(req.params.id);

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
    res.json(updatedQuote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject quote (User/Retailer)
// @route   PUT /api/quotes/:id/reject
// @access  Private
const rejectQuote = async (req, res) => {
  try {
    const quote = await Quote.findById(req.params.id);

    if (!quote) {
      return res.status(404).json({ message: 'Quote not found' });
    }

    // Verify the quote belongs to the user
    if (quote.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to reject this quote' });
    }

    if (quote.status !== 'responded') {
      return res.status(400).json({ message: 'Quote has not been responded to yet' });
    }

    quote.status = 'rejected';
    
    const updatedQuote = await quote.save();
    res.json(updatedQuote);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createQuote, getQuotes, respondToQuote, acceptQuote, rejectQuote };
