const express = require('express');
const router = express.Router();
const { createQuote, getQuotes, respondToQuote, acceptQuote, rejectQuote, updateQuoteTrackingLink } = require('../controllers/quoteController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createQuote)
  .get(protect, getQuotes);

router.route('/:id/respond')
  .put(protect, admin, respondToQuote);

router.route('/:id/accept')
  .put(protect, acceptQuote);

router.route('/:id/reject')
  .put(protect, rejectQuote);

router.route('/:id/tracking')
  .put(protect, admin, updateQuoteTrackingLink);

module.exports = router;
