const express = require('express');
const router = express.Router();
const { createQuote, getQuotes, respondToQuote } = require('../controllers/quoteController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createQuote)
  .get(protect, getQuotes);

router.route('/:id/respond')
  .put(protect, admin, respondToQuote);

module.exports = router;
