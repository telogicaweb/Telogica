const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  addProductUnits,
  getProductUnits,
  getAvailableUnits,
  updateProductUnit,
  assignUnitsToOrder,
  getUnitBySerial
} = require('../controllers/productUnitController');

// Admin routes
router.post('/add', protect, admin, addProductUnits);
router.get('/product/:productId', protect, admin, getProductUnits);
router.get('/available/:productId', protect, getAvailableUnits);
router.put('/:id', protect, admin, updateProductUnit);
router.post('/assign', protect, admin, assignUnitsToOrder);
router.get('/serial/:serialNumber', protect, getUnitBySerial);

module.exports = router;
