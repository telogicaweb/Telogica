const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const {
  registerWarranty,
  getUserWarranties,
  getAllWarranties,
  approveWarranty,
  rejectWarranty,
  updateWarranty,
  checkSerialNumber,
  validateWarranty,
  uploadInvoice
} = require('../controllers/warrantyController');

// User routes
router.post('/upload-invoice', protect, upload.single('invoice'), uploadInvoice);
router.post('/', protect, registerWarranty);
router.get('/my-warranties', protect, getUserWarranties);
router.get('/check-serial', protect, checkSerialNumber);

// Admin routes
router.get('/', protect, admin, getAllWarranties);
router.get('/validate', protect, admin, validateWarranty);
router.put('/:id/approve', protect, admin, approveWarranty);
router.put('/:id/reject', protect, admin, rejectWarranty);
router.put('/:id', protect, admin, updateWarranty);

module.exports = router;
