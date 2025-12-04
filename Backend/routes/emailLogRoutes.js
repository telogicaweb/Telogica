const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getEmailLogs, resendEmail } = require('../utils/mailer');

// Admin routes
router.get('/', protect, admin, async (req, res) => {
  try {
    const { emailType, status, recipient } = req.query;
    const filters = {};
    if (emailType) filters.emailType = emailType;
    if (status) filters.status = status;
    if (recipient) filters.recipient = recipient;

    const logs = await getEmailLogs(filters);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/:id/resend', protect, admin, async (req, res) => {
  try {
    const result = await resendEmail(req.params.id);
    if (result.success) {
      res.json({ message: 'Email resent successfully', emailLog: result.emailLog });
    } else {
      res.status(500).json({ message: 'Failed to resend email', error: result.error });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
