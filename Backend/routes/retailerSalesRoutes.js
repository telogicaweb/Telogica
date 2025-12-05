const express = require('express');
const router = express.Router();
const { protect, admin, retailer } = require('../middleware/authMiddleware');
const {
  getRetailerDashboard,
  getRetailerSales,
  getSaleDetails,
  getAllRetailers,
  getRetailerDetails,
  getAllRetailerSales,
  getRetailerAnalytics
} = require('../controllers/retailerSalesController');

// Retailer routes
router.get('/dashboard', protect, retailer, getRetailerDashboard);
router.get('/sales', protect, retailer, getRetailerSales);
router.get('/sales/:id', protect, getSaleDetails);

// Admin routes
router.get('/admin/retailers', protect, admin, getAllRetailers);
router.get('/admin/retailers/:id', protect, admin, getRetailerDetails);
router.get('/admin/sales', protect, admin, getAllRetailerSales);
router.get('/admin/analytics', protect, admin, getRetailerAnalytics);

module.exports = router;
