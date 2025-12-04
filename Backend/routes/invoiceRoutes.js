const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  generateInvoice,
  getInvoice,
  getInvoiceByOrder,
  getUserInvoices,
  getAllInvoices,
  resendInvoice
} = require('../controllers/invoiceController');

// User routes
router.get('/my-invoices', protect, getUserInvoices);
router.get('/:id', protect, getInvoice);
router.get('/order/:orderId', protect, getInvoiceByOrder);

// Admin routes
router.post('/generate', protect, admin, generateInvoice);
router.get('/', protect, admin, getAllInvoices);
router.post('/:id/resend', protect, admin, resendInvoice);

module.exports = router;
