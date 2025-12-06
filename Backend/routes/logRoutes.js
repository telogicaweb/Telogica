const express = require('express');
const router = express.Router();
const { getLogs, exportLogs } = require('../controllers/logController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(protect, admin, getLogs);
router.route('/export').get(protect, admin, exportLogs);

module.exports = router;
