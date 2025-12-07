const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getMyOrders, getOrders, updateOrderStatus, downloadInvoice, generateCustomerInvoice } = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createOrder)
  .get(protect, admin, getOrders);

router.route('/myorders').get(protect, getMyOrders);
router.route('/verify').post(protect, verifyPayment);
router.route('/:id/invoice').get(protect, downloadInvoice);
router.route('/dropship-invoice').post(protect, require('../controllers/orderController').generateDropshipInvoice);
router.route('/:id/customer-invoice').post(protect, generateCustomerInvoice);
router.route('/dropship-shipments').get(protect, admin, require('../controllers/orderController').getDropshipOrders);
router.route('/:id').put(protect, admin, updateOrderStatus);

module.exports = router;
