const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { protect, admin } = require('../middleware/authMiddleware');

/**
 * Export Routes
 * All routes are protected and require admin access
 * Supports PDF, CSV, and Excel formats via query parameter: ?format=pdf|csv|excel
 */

// Product exports
router.get('/products', protect, admin, exportController.exportProducts);

// Order exports
router.get('/orders', protect, admin, exportController.exportOrders);

// User exports
router.get('/users', protect, admin, exportController.exportUsers);

// Warranty exports
router.get('/warranties', protect, admin, exportController.exportWarranties);

// Quote exports
router.get('/quotes', protect, admin, exportController.exportQuotes);

// Invoice exports
router.get('/invoices', protect, admin, exportController.exportInvoices);

// Product units exports
router.get('/product-units', protect, admin, exportController.exportProductUnits);

// Retailer inventory exports
router.get('/retailer-inventory', protect, admin, exportController.exportRetailerInventory);

// Sales report exports
router.get('/sales-report', protect, admin, exportController.exportSalesReport);

module.exports = router;
