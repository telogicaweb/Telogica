const express = require('express');
const router = express.Router();
const { protect, admin, retailer } = require('../middleware/authMiddleware');
const {
  getRetailerInventory,
  addToInventory,
  markAsSold,
  getInventoryItem,
  getAllInventories,
  updateInventoryStatus
} = require('../controllers/retailerInventoryController');

// Retailer routes
router.get('/my-inventory', protect, retailer, getRetailerInventory);
router.post('/add', protect, retailer, addToInventory);
router.post('/:inventoryId/sell', protect, retailer, markAsSold);
router.get('/:id', protect, getInventoryItem);
router.put('/:id/status', protect, updateInventoryStatus);

// Admin routes
router.get('/', protect, admin, getAllInventories);

module.exports = router;
