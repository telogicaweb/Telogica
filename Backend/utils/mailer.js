const nodemailer = require('nodemailer');
const axios = require('axios');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Use EmailService microservice if available, fallback to direct SMTP
const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || 'http://localhost:5001';

// Enhanced sendEmail function with logging
const sendEmail = async (to, subject, text, emailType, relatedEntity = null, html = null) => {
  let EmailLog;
  try {
    // Lazy load EmailLog to avoid circular dependency
    EmailLog = require('../models/EmailLog');
  } catch (error) {
    console.log('EmailLog model not available, skipping logging');
  }

  const emailBody = html || text || 'No content';
  
  // Determine recipient type
  let recipientType = 'user';
  if (to && (to.includes('admin') || to === process.env.ADMIN_EMAIL)) {
    recipientType = 'admin';
  }

  // Create email log entry
  let emailLog;
  if (EmailLog) {
    try {
      emailLog = await EmailLog.create({
        recipient: to || 'unknown',
        recipientType,
        subject: subject || 'No Subject',
        body: emailBody,
        emailType: emailType || 'general',
        status: 'pending',
        relatedEntity: relatedEntity || {}
      });
    } catch (error) {
      console.error('Error creating email log:', error);
    }
  }

  if (!to) {
    const errorMsg = 'Recipient email is missing';
    console.error(errorMsg);
    if (emailLog) {
      emailLog.status = 'failed';
      emailLog.errorMessage = errorMsg;
      await emailLog.save();
    }
    return { success: false, error: errorMsg, emailLog };
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    const errorMsg = 'Email credentials missing in .env';
    console.error(errorMsg);
    if (emailLog) {
      emailLog.status = 'failed';
      emailLog.errorMessage = errorMsg;
      await emailLog.save();
    }
    return { success: false, error: errorMsg, emailLog };
  }

  try {
    // Try to use EmailService microservice first
    try {
      const emailServiceResponse = await axios.post(`${EMAIL_SERVICE_URL}/api/email/send`, {
        to,
        subject,
        text,
        html: html || text,
        emailType: emailType || 'general',
        relatedEntity
      }, {
        timeout: 5000 // 5 second timeout
      });

      if (emailServiceResponse.data.success) {
        console.log('Email sent successfully via EmailService to:', to);
        
        // Update email log status to sent
        if (emailLog) {
          emailLog.status = 'sent';
          emailLog.sentAt = new Date();
          await emailLog.save();
        }
        
        return { success: true, emailLog };
      }
    } catch (emailServiceError) {
      console.log('EmailService not available, falling back to direct SMTP:', emailServiceError.message);
      
      // Fallback to direct SMTP
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        html: html || text
      };
      
      await transporter.sendMail(mailOptions);
      console.log('Email sent successfully via SMTP to:', to);
    }
    
    // Update email log status to sent
    if (emailLog) {
      emailLog.status = 'sent';
      emailLog.sentAt = new Date();
      await emailLog.save();
    }
    
    return { success: true, emailLog };
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Update email log status to failed
    if (emailLog) {
      emailLog.status = 'failed';
      emailLog.errorMessage = error.message;
      await emailLog.save();
    }
    
    return { success: false, error: error.message, emailLog };
  }
};

// Function to resend email from log
const resendEmail = async (emailLogId) => {
  const EmailLog = require('../models/EmailLog');
  
  try {
    const emailLog = await EmailLog.findById(emailLogId);
    if (!emailLog) {
      throw new Error('Email log not found');
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: emailLog.recipient,
      subject: emailLog.subject,
      html: emailLog.body
    };
    
    await transporter.sendMail(mailOptions);
    
    // Update email log
    emailLog.status = 'sent';
    emailLog.sentAt = new Date();
    emailLog.errorMessage = null;
    await emailLog.save();
    
    return { success: true, emailLog };
  } catch (error) {
    console.error('Error resending email:', error);
    return { success: false, error: error.message };
  }
};

// Get email logs
const getEmailLogs = async (filters = {}) => {
  const EmailLog = require('../models/EmailLog');
  
  try {
    const logs = await EmailLog.find(filters)
      .sort({ createdAt: -1 })
      .limit(100);
    return logs;
  } catch (error) {
    console.error('Error fetching email logs:', error);
    return [];
  }
};

module.exports = {
  sendEmail,
  resendEmail,
  getEmailLogs
};
