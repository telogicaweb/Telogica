const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getSettings,
  getSetting,
  updateSetting,
  initializeSettings
} = require('../controllers/settingsController');

// Public routes
router.get('/', getSettings);
router.get('/:key', getSetting);

// Admin routes
router.put('/:key', protect, admin, updateSetting);
router.post('/initialize', protect, admin, initializeSettings);

module.exports = router;
