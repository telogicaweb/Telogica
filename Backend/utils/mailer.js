const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Enhanced sendEmail function with logging
const sendEmail = async (to, subject, text, emailType, relatedEntity = null, html = null) => {
  let EmailLog;
  try {
    // Lazy load EmailLog to avoid circular dependency
    EmailLog = require('../models/EmailLog');
  } catch (error) {
    console.log('EmailLog model not available, skipping logging');
  }

  const emailBody = html || text;
  
  // Determine recipient type
  let recipientType = 'user';
  if (to.includes('admin') || to === process.env.ADMIN_EMAIL) {
    recipientType = 'admin';
  }

  // Create email log entry
  let emailLog;
  if (EmailLog) {
    try {
      emailLog = await EmailLog.create({
        recipient: to,
        recipientType,
        subject,
        body: emailBody,
        emailType: emailType || 'general',
        status: 'pending',
        relatedEntity: relatedEntity || {}
      });
    } catch (error) {
      console.error('Error creating email log:', error);
    }
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html: html || text
    };
    
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', to);
    
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
