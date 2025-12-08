const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect, admin } = require('../middleware/authMiddleware');

// Email Service URL
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'https://gm1-lovat.vercel.app/';

// Admin routes - Get email logs from Email Service
router.get('/', protect, admin, async (req, res) => {
  try {
    const { emailType, status, recipient, startDate, endDate, limit } = req.query;
    
    // Build query parameters
    const params = new URLSearchParams();
    if (emailType) params.append('emailType', emailType);
    if (status) params.append('status', status);
    if (recipient) params.append('recipient', recipient);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (limit) params.append('limit', limit);

    // Fetch logs from Email Service
    const response = await axios.get(`${EMAIL_SERVICE_URL}/api/email/logs?${params.toString()}`);
    
    // Email service returns { success: true, logs: [...] }
    res.json(response.data.logs || response.data);
  } catch (error) {
    console.error('Error fetching email logs from service:', error.message);
    
    // Fallback to local mailer if service unavailable
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      try {
        const { getEmailLogs } = require('../utils/mailer');
        const filters = {};
        if (req.query.emailType) filters.emailType = req.query.emailType;
        if (req.query.status) filters.status = req.query.status;
        if (req.query.recipient) filters.recipient = req.query.recipient;
        const logs = await getEmailLogs(filters);
        res.json(logs);
      } catch (fallbackError) {
        res.status(500).json({ message: 'Server error', error: fallbackError.message });
      }
    } else {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
});

// Admin routes - Resend email via Email Service
router.post('/:id/resend', protect, admin, async (req, res) => {
  try {
    // Call Email Service to resend
    const response = await axios.post(`${EMAIL_SERVICE_URL}/api/email/resend/${req.params.id}`);
    res.json({ message: 'Email resent successfully', data: response.data });
  } catch (error) {
    console.error('Error resending email via service:', error.response?.data || error.message);
    
    // Fallback to local mailer if service unavailable
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      try {
        const { resendEmail } = require('../utils/mailer');
        const result = await resendEmail(req.params.id);
        if (result.success) {
          res.json({ message: 'Email resent successfully', emailLog: result.emailLog });
        } else {
          res.status(500).json({ message: 'Failed to resend email', error: result.error });
        }
      } catch (fallbackError) {
        res.status(500).json({ message: 'Server error', error: fallbackError.message });
      }
    } else {
      res.status(error.response?.status || 500).json({ 
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to resend email', 
        error: error.response?.data || error.message 
      });
    }
  }
});

module.exports = router;
