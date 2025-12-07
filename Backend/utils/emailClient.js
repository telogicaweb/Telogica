const axios = require('axios');

// Create axios instance for email service
const emailServiceClient = axios.create({
  baseURL: process.env.EMAIL_SERVICE_URL || 'http://localhost:5001',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds timeout
});

/**
 * Send a custom email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} emailType - Type of email (general, order_confirmation, etc.)
 * @param {object} relatedEntity - Related entity information { type, id }
 * @param {string} html - HTML content
 * @returns {Promise<object>} Response from email service
 */
const sendEmail = async (to, subject, text, emailType = 'general', relatedEntity = null, html = null) => {
  try {
    const response = await emailServiceClient.post('/api/email/send', {
      to,
      subject,
      text,
      html,
      emailType,
      relatedEntity
    });
    
    console.log('✅ Email sent via service:', response.data);
    return { success: true, ...response.data };
  } catch (error) {
    console.error('❌ Email service error:', error.response?.data || error.message);
    
    // Fallback to local mailer if email service is unavailable
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.warn('⚠️ Email service unavailable, using local mailer fallback');
      try {
        const localMailer = require('./mailer');
        return await localMailer.sendEmail(to, subject, text, emailType, relatedEntity, html);
      } catch (fallbackError) {
        console.error('❌ Local mailer fallback also failed:', fallbackError.message);
        return { success: false, error: fallbackError.message };
      }
    }
    
    return { success: false, error: error.response?.data?.error || error.message };
  }
};

/**
 * Send an email using a predefined template
 * @param {string} to - Recipient email address
 * @param {string} templateType - Template type (welcome, order-confirmation, etc.)
 * @param {object} templateData - Data to populate the template
 * @param {string} emailType - Type of email for logging
 * @param {object} relatedEntity - Related entity information { type, id }
 * @returns {Promise<object>} Response from email service
 */
const sendTemplateEmail = async (to, templateType, templateData, emailType = null, relatedEntity = null) => {
  try {
    const response = await emailServiceClient.post('/api/email/send-template', {
      to,
      templateType,
      templateData,
      emailType: emailType || templateType,
      relatedEntity
    });
    
    console.log('✅ Template email sent via service:', response.data);
    return { success: true, ...response.data };
  } catch (error) {
    console.error('❌ Email service error:', error.response?.data || error.message);
    
    // Fallback to local templates if email service is unavailable
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      console.warn('⚠️ Email service unavailable, using local template fallback');
      try {
        const emailTemplates = require('./emailTemplates');
        const localMailer = require('./mailer');
        
        let subject = '';
        let html = '';
        
        // Generate HTML from local templates
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
            throw new Error('Invalid template type');
        }
        
        return await localMailer.sendEmail(to, subject, '', emailType || templateType, relatedEntity, html);
      } catch (fallbackError) {
        console.error('❌ Local template fallback also failed:', fallbackError.message);
        return { success: false, error: fallbackError.message };
      }
    }
    
    return { success: false, error: error.response?.data?.error || error.message };
  }
};

/**
 * Get email logs from the service
 * @param {object} filters - Filter parameters
 * @returns {Promise<object>} Email logs
 */
const getEmailLogs = async (filters = {}) => {
  try {
    const response = await emailServiceClient.get('/api/email/logs', { params: filters });
    return { success: true, logs: response.data.logs };
  } catch (error) {
    console.error('❌ Error fetching email logs:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.error || error.message, logs: [] };
  }
};

/**
 * Get email statistics from the service
 * @returns {Promise<object>} Email statistics
 */
const getEmailStats = async () => {
  try {
    const response = await emailServiceClient.get('/api/email/stats');
    return { success: true, stats: response.data.stats };
  } catch (error) {
    console.error('❌ Error fetching email stats:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.error || error.message, stats: null };
  }
};

/**
 * Resend a failed email
 * @param {string} emailLogId - Email log ID
 * @returns {Promise<object>} Response from email service
 */
const resendEmail = async (emailLogId) => {
  try {
    const response = await emailServiceClient.post(`/api/email/resend/${emailLogId}`);
    return { success: true, ...response.data };
  } catch (error) {
    console.error('❌ Error resending email:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.error || error.message };
  }
};

module.exports = {
  sendEmail,
  sendTemplateEmail,
  getEmailLogs,
  getEmailStats,
  resendEmail
};
