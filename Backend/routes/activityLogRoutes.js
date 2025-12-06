const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLogController');
const { protect, admin } = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/security');

router.use(apiLimiter);

router.get('/my-logs', protect, activityLogController.getMyActivityLogs);
router.get('/my-stats', protect, activityLogController.getMyActivityStats);
router.get('/', protect, admin, activityLogController.getAllActivityLogs);
router.get('/stats', protect, admin, activityLogController.getActivityStats);

module.exports = router;
