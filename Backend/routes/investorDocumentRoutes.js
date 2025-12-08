const express = require('express');
const router = express.Router();
const {
  uploadDocument,
  getInvestorDocuments,
  getAdminInvestorDocuments,
  getCategories,
  createInvestorDocument,
  updateInvestorDocument,
  deleteInvestorDocument,
} = require('../controllers/investorDocumentController');
const { protect, admin } = require('../middleware/authMiddleware');
const { upload } = require('../utils/fileUpload');

// Public routes
router.get('/', getInvestorDocuments);
router.get('/categories', getCategories);

// Admin routes
router.get('/admin', protect, admin, getAdminInvestorDocuments);
router.post('/upload', protect, admin, upload.single('document'), uploadDocument);
router.post('/', protect, admin, createInvestorDocument);
router.put('/:id', protect, admin, updateInvestorDocument);
router.delete('/:id', protect, admin, deleteInvestorDocument);

module.exports = router;
