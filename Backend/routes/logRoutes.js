const express = require('express');
const router = express.Router();
const { 
  getLogs, 
  exportLogs,
  getLogStats,
  clearLogs,
  getLogById
} = require('../controllers/logController');
const { protect, admin } = require('../middleware/authMiddleware');

// Main routes
router.route('/')
  .get(protect, admin, getLogs);

router.route('/admin-logs')
  .get(protect, admin, getLogs);

router.route('/stats')
  .get(protect, admin, getLogStats);

router.route('/export')
  .get(protect, admin, exportLogs);

router.route('/clear')
  .delete(protect, admin, clearLogs);

router.route('/:id')
  .get(protect, admin, getLogById);

module.exports = router;
