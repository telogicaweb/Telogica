const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getDashboardAnalytics,
  getSalesReport,
  getTopProducts
} = require('../controllers/analyticsController');

// Admin routes
router.get('/dashboard', protect, admin, getDashboardAnalytics);
router.get('/sales-report', protect, admin, getSalesReport);
router.get('/top-products', protect, admin, getTopProducts);

module.exports = router;
