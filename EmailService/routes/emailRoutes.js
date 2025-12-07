const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const emailTemplates = require('../utils/emailTemplates');

// Send Email Endpoint
router.post('/send', async (req, res) => {
  try {
    const { to, subject, text, html, emailType, relatedEntity } = req.body;
    
    if (!to || !subject) {
      return res.status(400).json({ 
        success: false, 
        error: 'Recipient and subject are required' 
      });
    }

    const result = await emailService.sendEmail(
      to, 
      subject, 
      text, 
      emailType || 'general',
      relatedEntity,
      html
    );

    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Email sent successfully',
        messageId: result.messageId,
        emailLogId: result.emailLog?._id
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Error in send email endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Send Template-Based Email
router.post('/send-template', async (req, res) => {
  try {
    const { to, templateType, templateData, emailType, relatedEntity } = req.body;
    
    if (!to || !templateType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Recipient and template type are required' 
      });
    }

    let subject = '';
    let html = '';

    switch (templateType) {
      case 'welcome':
        subject = 'Welcome to Telogica!';
        html = emailTemplates.getWelcomeEmail(templateData.userName);
        break;
      case 'retailer-welcome':
        subject = 'Welcome to Telogica Retailer Network!';
        html = emailTemplates.getRetailerWelcomeEmail(templateData.retailerName);
        break;
      case 'order-confirmation':
        subject = `Order Confirmation - #${templateData.orderNumber}`;
        html = emailTemplates.getOrderConfirmationEmail(
          templateData.orderNumber,
          templateData.customerName,
          templateData.totalAmount
        );
        break;
      case 'delivery-tracking':
        subject = `Your Order is On the Way - #${templateData.orderNumber}`;
        html = emailTemplates.getDeliveryTrackingEmail(
          templateData.customerName,
          templateData.orderNumber,
          templateData.trackingLink
        );
        break;
      case 'quote-request-admin':
        subject = 'New Quote Request Received';
        html = emailTemplates.getQuoteRequestAdminEmail(
          templateData.customerName,
          templateData.customerEmail,
          templateData.products
        );
        break;
      case 'quote-response':
        subject = 'Your Quote is Ready!';
        html = emailTemplates.getQuoteResponseEmail(
          templateData.customerName,
          templateData.quoteDetails
        );
        break;
      case 'warranty':
        subject = 'Warranty Registration Confirmed';
        html = emailTemplates.getWarrantyEmail(
          templateData.customerName,
          templateData.warrantyDetails
        );
        break;
      case 'contact-confirmation':
        subject = 'We\'ve Received Your Message';
        html = emailTemplates.getContactConfirmationEmail(templateData.name);
        break;
      case 'password-reset':
        subject = 'Password Reset Request';
        html = emailTemplates.getPasswordResetEmail(templateData.resetLink);
        break;
      case 'invoice':
        subject = `Invoice - ${templateData.invoiceNumber}`;
        html = emailTemplates.getInvoiceEmail(
          templateData.customerName,
          templateData.invoiceNumber,
          templateData.amount
        );
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid template type' 
        });
    }

    const result = await emailService.sendEmail(
      to, 
      subject, 
      '', 
      emailType || templateType,
      relatedEntity,
      html
    );

    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Email sent successfully',
        messageId: result.messageId,
        emailLogId: result.emailLog?._id
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Error in send template email endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get Email Logs
router.get('/logs', async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      emailType: req.query.emailType,
      recipientType: req.query.recipientType,
      recipient: req.query.recipient,
      limit: parseInt(req.query.limit) || 100
    };

    const logs = await emailService.getEmailLogs(filters);
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get Email Stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await emailService.getEmailStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Resend Email
router.post('/resend/:emailLogId', async (req, res) => {
  try {
    const { emailLogId } = req.params;
    const result = await emailService.resendEmail(emailLogId);

    if (result.success) {
      res.json({ 
        success: true, 
        message: 'Email resent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: result.error 
      });
    }
  } catch (error) {
    console.error('Error resending email:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
