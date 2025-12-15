const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');

// Admin routes - Get email logs from local database
router.get('/', protect, admin, async (req, res) => {
  try {
    const { emailType, status, recipient, startDate, endDate, limit } = req.query;
    
    // Build query
    const query = {};
    if (emailType) query.emailType = emailType;
    if (status) query.status = status;
    if (recipient) query.recipient = new RegExp(recipient, 'i');
    if (startDate || endDate) {
      query.sentAt = {};
      if (startDate) query.sentAt.$gte = new Date(startDate);
      if (endDate) query.sentAt.$lte = new Date(endDate);
    }

    const EmailLog = require('../models/EmailLog');
    const logs = await EmailLog.find(query)
      .sort({ sentAt: -1 })
      .limit(parseInt(limit) || 100);

    res.json(logs);
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin routes - Resend email
router.post('/:id/resend', protect, admin, async (req, res) => {
  try {
    // Try local resend first
    const { resendEmail } = require('../utils/mailer');
    const result = await resendEmail(req.params.id);
    if (result.success) {
      res.json({ message: 'Email resent successfully', emailLog: result.emailLog });
      return;
    }

    // Fallback to Email Service if local fails
    try {
      const response = await axios.post(`${EMAIL_SERVICE_URL}/api/email/resend/${req.params.id}`);
      res.json({ message: 'Email resent successfully', data: response.data });
    } catch (serviceError) {
      res.status(500).json({ 
        message: 'Failed to resend email via both local and service', 
        error: result.error || serviceError.message 
      });
    }
  } catch (error) {
    console.error('Error resending email:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
