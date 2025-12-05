const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  generateInvoice,
  getInvoice,
  getInvoiceByOrder,
  getUserInvoices,
  getAllInvoices,
  resendInvoice,
  downloadInvoice
} = require('../controllers/invoiceController');

// User routes
router.get('/my-invoices', protect, getUserInvoices);
router.get('/order/:orderId', protect, getInvoiceByOrder);
router.get('/:id/download', protect, downloadInvoice);
router.get('/:id', protect, getInvoice);

// Admin routes
router.post('/generate', protect, admin, generateInvoice);
router.get('/', protect, admin, getAllInvoices);
router.post('/:id/resend', protect, admin, resendInvoice);

module.exports = router;
