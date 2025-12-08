require('dotenv').config();
const nodemailer = require('nodemailer');
const connectDB = require('../config/db');

// Connect to MongoDB for email logs
connectDB();

// Email transporter instance (for SMTP)
let transporter = null;

// Determine provider preference
const hasSendGrid = !!process.env.SENDGRID_API_KEY;
const hasResend = !!process.env.RESEND_API_KEY;
const preferredProvider = process.env.EMAIL_PROVIDER || (hasSendGrid ? 'sendgrid' : hasResend ? 'resend' : 'smtp');

const getFromAddress = () => {
  const name = process.env.EMAIL_FROM_NAME || 'Telogica';
  const address = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  return `${name} <${address}>`;
};

// Function to get or create transporter
const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  // Check credentials
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ EMAIL_USER or EMAIL_PASS not set in environment variables');
    console.error('EMAIL_USER:', process.env.EMAIL_USER ? 'SET' : 'NOT SET');
    console.error('EMAIL_PASS:', process.env.EMAIL_PASS ? 'SET' : 'NOT SET');
    return null;
  }

  try {
    console.log('✅ Email credentials found, creating transporter...');
    const useHost = !!process.env.EMAIL_HOST;

    const port = Number(process.env.EMAIL_PORT) || 587;
    const secure = process.env.EMAIL_SECURE === 'true' || port === 465;

    const transportOptions = useHost
      ? {
          host: process.env.EMAIL_HOST,
          port,
          secure, // true for 465, false for 587
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          pool: true,
          maxConnections: 3,
          maxMessages: 100,
          connectionTimeout: 10000,
          socketTimeout: 10000,
          greetingTimeout: 10000,
        }
      : {
          service: process.env.EMAIL_SERVICE || 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          pool: true,
          maxConnections: 3,
          maxMessages: 100,
          connectionTimeout: 10000,
          socketTimeout: 10000,
          greetingTimeout: 10000,
        };

    console.log(
      `📧 Creating transporter via ${useHost ? 'host' : 'service'}:`,
      useHost
        ? { host: process.env.EMAIL_HOST, port, secure }
        : { service: process.env.EMAIL_SERVICE || 'gmail' }
    );

    transporter = nodemailer.createTransport(transportOptions);

    // Verify transporter configuration
    transporter.verify((error, success) => {
      if (error) {
        console.error('❌ Email transporter configuration error:', error);
        console.error('   → Tried configuration:', useHost ? { host: process.env.EMAIL_HOST, port, secure } : { service: process.env.EMAIL_SERVICE || 'gmail' });
        console.error('   → Tips: On Render, prefer port 587 (TLS) with secure=false');
        transporter = null; // Reset on error
      } else {
        console.log('✅ Email server is ready to send emails');
      }
    });

    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error);
    return null;
  }
};

// Initialize transporter on module load (only for SMTP)
if (preferredProvider === 'smtp') {
  getTransporter();
}

// --- HTTP Provider Implementations ---
const sendViaSendGrid = async ({ to, subject, text, html }) => {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error('SENDGRID_API_KEY not set');
  const body = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: (process.env.EMAIL_FROM || process.env.EMAIL_USER), name: process.env.EMAIL_FROM_NAME || 'Telogica' },
    subject,
    content: html ? [{ type: 'text/html', value: html }] : [{ type: 'text/plain', value: text || '' }]
  };
  const resp = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const errTxt = await resp.text();
    throw new Error(`SendGrid error: ${resp.status} ${errTxt}`);
  }
  const messageId = resp.headers.get('x-message-id') || 'sendgrid';
  return { messageId };
};

const sendViaResend = async ({ to, subject, text, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not set');
  const body = {
    from: getFromAddress(),
    to: [to],
    subject,
    html: html || undefined,
    text: html ? undefined : (text || '')
  };
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(`Resend error: ${resp.status} ${JSON.stringify(data)}`);
  }
  return { messageId: data.id || 'resend' };
};

// Send Email Function with Logging
const sendEmail = async (to, subject, text, emailType, relatedEntity = null, html = null) => {
  let EmailLog;
  try {
    EmailLog = require('../models/EmailLog');
  } catch (error) {
    console.warn('EmailLog model not available, skipping logging');
  }

  const emailBody = html || text || 'No content';
  
  // Determine recipient type
  let recipientType = 'user';
  if (to && (to.includes('admin') || to === process.env.ADMIN_EMAIL)) {
    recipientType = 'admin';
  } else if (to && to.includes('retailer')) {
    recipientType = 'retailer';
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

  // Validate required fields
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

  if (preferredProvider === 'smtp' && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
    const errorMsg = 'Email credentials missing in environment variables';
    console.error(errorMsg);
    if (emailLog) {
      emailLog.status = 'failed';
      emailLog.errorMessage = errorMsg;
      await emailLog.save();
    }
    return { success: false, error: errorMsg, emailLog };
  }

  // Send email via selected provider
  try {
    let info = { messageId: '' };
    if (preferredProvider === 'sendgrid') {
      console.log('📨 Using SendGrid provider');
      info = await sendViaSendGrid({ to, subject, text, html });
    } else if (preferredProvider === 'resend') {
      console.log('📨 Using Resend provider');
      info = await sendViaResend({ to, subject, text, html });
    } else {
      const emailTransporter = getTransporter();
      if (!emailTransporter) {
        throw new Error('Email transporter not initialized. Check EMAIL_USER and EMAIL_PASS configuration.');
      }
      const mailOptions = {
        from: getFromAddress(),
        to,
        subject,
        text,
        html: html || text
      };
      info = await emailTransporter.sendMail(mailOptions);
    }
    console.log('✅ Email sent successfully to:', to, '| MessageID:', info.messageId);
    
    // Update email log status to sent
    if (emailLog) {
      emailLog.status = 'sent';
      emailLog.sentAt = new Date();
      emailLog.metadata = new Map([['messageId', info.messageId]]);
      await emailLog.save();
    }
    
    return { success: true, messageId: info.messageId, emailLog };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    // Update email log status to failed
    if (emailLog) {
      emailLog.status = 'failed';
      emailLog.errorMessage = error.message;
      await emailLog.save();
    }
    
    return { success: false, error: error.message, emailLog };
  }
};

// Resend Email from Log
const resendEmail = async (emailLogId) => {
  const EmailLog = require('../models/EmailLog');
  
  try {
    // Get or create transporter
    const emailTransporter = preferredProvider === 'smtp' ? getTransporter() : null;

    const emailLog = await EmailLog.findById(emailLogId);
    if (!emailLog) {
      throw new Error('Email log not found');
    }

    let info = { messageId: '' };
    if (preferredProvider === 'sendgrid') {
      info = await sendViaSendGrid({ to: emailLog.recipient, subject: emailLog.subject, html: emailLog.body });
    } else if (preferredProvider === 'resend') {
      info = await sendViaResend({ to: emailLog.recipient, subject: emailLog.subject, html: emailLog.body });
    } else {
      if (!emailTransporter) throw new Error('Email transporter not initialized.');
      const mailOptions = {
        from: getFromAddress(),
        to: emailLog.recipient,
        subject: emailLog.subject,
        html: emailLog.body
      };
      info = await emailTransporter.sendMail(mailOptions);
    }
    
    // Update email log
    emailLog.status = 'sent';
    emailLog.sentAt = new Date();
    emailLog.errorMessage = null;
    emailLog.metadata = new Map([['messageId', info.messageId]]);
    await emailLog.save();
    
    console.log('✅ Email resent successfully | MessageID:', info.messageId);
    return { success: true, messageId: info.messageId, emailLog };
  } catch (error) {
    console.error('❌ Error resending email:', error);
    return { success: false, error: error.message };
  }
};

// Get Email Logs
const getEmailLogs = async (filters = {}) => {
  const EmailLog = require('../models/EmailLog');
  
  try {
    const query = {};
    
    if (filters.status) query.status = filters.status;
    if (filters.emailType) query.emailType = filters.emailType;
    if (filters.recipientType) query.recipientType = filters.recipientType;
    if (filters.recipient) query.recipient = new RegExp(filters.recipient, 'i');
    
    const logs = await EmailLog.find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit || 100);
      
    return logs;
  } catch (error) {
    console.error('Error fetching email logs:', error);
    return [];
  }
};

// Get Email Stats
const getEmailStats = async () => {
  const EmailLog = require('../models/EmailLog');
  
  try {
    const totalEmails = await EmailLog.countDocuments();
    const sentEmails = await EmailLog.countDocuments({ status: 'sent' });
    const failedEmails = await EmailLog.countDocuments({ status: 'failed' });
    const pendingEmails = await EmailLog.countDocuments({ status: 'pending' });
    
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEmails = await EmailLog.countDocuments({ createdAt: { $gte: last24Hours } });
    
    return {
      total: totalEmails,
      sent: sentEmails,
      failed: failedEmails,
      pending: pendingEmails,
      last24Hours: recentEmails
    };
  } catch (error) {
    console.error('Error fetching email stats:', error);
    return null;
  }
};

module.exports = {
  sendEmail,
  resendEmail,
  getEmailLogs,
  getEmailStats
};
