const express = require('express');
const router = express.Router();
const { 
  getLogs, 
  exportLogs,
  searchLogs,
  getLogStats,
  bulkOperation,
  clearLogs,
  archiveLogs,
  restoreLogs,
  getSystemHealth,
  generateReport,
  getAlerts,
  setupAlert,
  acknowledgeAlert,
  getAuditTrail,
  analyzeLogs,
  getLogById,
  updateLog,
  createLog
} = require('../controllers/logController');
const { protect, admin } = require('../middleware/authMiddleware');

// Advanced routes
router.route('/advanced').get(protect, admin, getLogs);
router.route('/search').get(protect, admin, searchLogs);
router.route('/stats').get(protect, admin, getLogStats);
router.route('/bulk').post(protect, admin, bulkOperation);
router.route('/clear').delete(protect, admin, clearLogs);
router.route('/archive').post(protect, admin, archiveLogs);
router.route('/archive/:batchId/restore').post(protect, admin, restoreLogs);
router.route('/health').get(protect, admin, getSystemHealth);
router.route('/reports').post(protect, admin, generateReport);
router.route('/analyze').post(protect, admin, analyzeLogs);

// Alert routes
router.route('/alerts')
  .get(protect, admin, getAlerts)
  .post(protect, admin, setupAlert);
router.route('/alerts/:id/acknowledge').patch(protect, admin, acknowledgeAlert);

// Audit routes
router.route('/audit/:entityType/:entityId').get(protect, admin, getAuditTrail);

// Standard routes
router.route('/')
  .get(protect, admin, getLogs)
  .post(protect, admin, createLog);

router.route('/export').get(protect, admin, exportLogs);

router.route('/:id')
  .get(protect, admin, getLogById)
  .patch(protect, admin, updateLog);

module.exports = router;
