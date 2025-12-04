const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  registerWarranty,
  getUserWarranties,
  getAllWarranties,
  approveWarranty,
  rejectWarranty,
  updateWarranty,
  checkSerialNumber
} = require('../controllers/warrantyController');

// User routes
router.post('/', protect, registerWarranty);
router.get('/my-warranties', protect, getUserWarranties);
router.get('/check-serial', protect, checkSerialNumber);

// Admin routes
router.get('/', protect, admin, getAllWarranties);
router.put('/:id/approve', protect, admin, approveWarranty);
router.put('/:id/reject', protect, admin, rejectWarranty);
router.put('/:id', protect, admin, updateWarranty);

module.exports = router;
