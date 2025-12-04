const express = require('express');
const router = express.Router();
const { getReports, createReport, updateReport, deleteReport } = require('../controllers/reportController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
  .get(getReports)
  .post(protect, admin, createReport);

router.route('/:id')
  .put(protect, admin, updateReport)
  .delete(protect, admin, deleteReport);

module.exports = router;
