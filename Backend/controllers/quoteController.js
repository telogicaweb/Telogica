const Quote = require('../models/Quote');
const sendEmail = require('../utils/mailer');

// @desc    Create a new quote
// @route   POST /api/quotes
// @access  Private
const createQuote = async (req, res) => {
  const { products, message } = req.body;

  if (products && products.length === 0) {
    return res.status(400).json({ message: 'No products in quote' });
  }

  try {
    const quote = new Quote({
      user: req.user._id,
      products,
      message
    });

    const createdQuote = await quote.save();
    
    // Notify Admin
    // await sendEmail(process.env.ADMIN_EMAIL, 'New Quote Request', `User ${req.user.name} requested a quote.`);

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
      quotes = await Quote.find({}).populate('user', 'name email').populate('products.product');
    } else {
      quotes = await Quote.find({ user: req.user._id }).populate('products.product');
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
  const { price, message } = req.body;

  try {
    const quote = await Quote.findById(req.params.id).populate('user', 'email name');

    if (quote) {
      quote.adminResponse = { price, message };
      quote.status = 'responded';
      
      const updatedQuote = await quote.save();

      // Notify User
      await sendEmail(quote.user.email, 'Quote Response', `Admin has responded to your quote. Price: ${price}. Message: ${message}`);

      res.json(updatedQuote);
    } else {
      res.status(404).json({ message: 'Quote not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createQuote, getQuotes, respondToQuote };
