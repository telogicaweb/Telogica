const express = require('express');
const router = express.Router();
const { protect, admin, retailer } = require('../middleware/authMiddleware');
const {
  getMyQuotedProducts,
  saveQuotedProducts,
  getAllRetailersQuotedProducts,
  getRetailerQuotedProducts,
  updateQuotedPrice,
  addQuotedProduct,
  deleteQuotedProduct
} = require('../controllers/retailerQuotedProductController');

// Retailer routes
router.get('/my-products', protect, retailer, getMyQuotedProducts);
router.post('/save', protect, retailer, saveQuotedProducts);

// Admin routes
router.get('/admin/all', protect, admin, getAllRetailersQuotedProducts);
router.get('/admin/retailer/:retailerId', protect, admin, getRetailerQuotedProducts);
router.post('/admin/add', protect, admin, addQuotedProduct);
router.put('/admin/:id', protect, admin, updateQuotedPrice);
router.delete('/admin/:id', protect, admin, deleteQuotedProduct);

module.exports = router;
