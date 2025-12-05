const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getMyOrders, getOrders, updateOrderStatus } = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createOrder)
  .get(protect, admin, getOrders);

router.route('/myorders').get(protect, getMyOrders);
router.route('/verify').post(protect, verifyPayment);
router.route('/:id').put(protect, admin, updateOrderStatus);

module.exports = router;
