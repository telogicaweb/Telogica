// Professional Email Templates for Telogica

const COMPANY_INFO = {
  name: 'TELOGICA LIMITED',
  website: 'http://telogica.com/',
  logo: 'https://aishwaryatechtele.com/images/telogica_logo.png',
  address: `Empire Square, Plot No 233-A, 234 & 235,<br>
    3rd Fl, Rd No 36, Jubilee Hills,<br>
    Hyderabad- 500 033, Telangana, India`,
  emails: {
    sales: 'sales@telogica.com',
    support: 'support@telogica.com'
  },
  phones: [
    '+91 9396610682',
    '+91-40-27531324 to 26',
    '+91-40-27535423'
  ]
};

// Base email template with professional styling
const getEmailTemplate = (content) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Telogica</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f7fa;
    }
    .email-container {
      max-width: 650px;
      margin: 20px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      padding: 30px 40px;
      text-align: center;
    }
    .header img {
      max-width: 200px;
      height: auto;
      margin-bottom: 10px;
    }
    .header h1 {
      color: #ffffff;
      margin: 10px 0 0 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 40px;
      color: #334155;
      line-height: 1.6;
    }
    .content h2 {
      color: #059669;
      margin-top: 0;
      font-size: 22px;
      border-bottom: 2px solid #10b981;
      padding-bottom: 10px;
    }
    .content p {
      margin: 15px 0;
      font-size: 15px;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
      color: #ffffff !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 4px 8px rgba(5, 150, 105, 0.3);
      transition: all 0.3s ease;
    }
    .button:hover {
      box-shadow: 0 6px 12px rgba(5, 150, 105, 0.4);
      transform: translateY(-2px);
    }
    .info-box {
      background-color: #f0fdf4;
      border-left: 4px solid #10b981;
      padding: 20px;
      margin: 20px 0;
      border-radius: 6px;
    }
    .info-box strong {
      color: #059669;
    }
    .footer {
      background-color: #1f2937;
      color: #d1d5db;
      padding: 30px 40px;
      font-size: 13px;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .footer-section h3 {
      color: #10b981;
      font-size: 14px;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .footer-section p {
      margin: 8px 0;
      line-height: 1.5;
    }
    .footer-section a {
      color: #10b981;
      text-decoration: none;
    }
    .footer-section a:hover {
      text-decoration: underline;
    }
    .footer-bottom {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #374151;
      color: #9ca3af;
    }
    .social-links {
      margin: 15px 0;
    }
    .social-links a {
      display: inline-block;
      margin: 0 8px;
      color: #10b981;
      text-decoration: none;
      font-weight: 500;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 25px 20px;
      }
      .header {
        padding: 20px;
      }
      .footer {
        padding: 20px;
      }
      .footer-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <img src="${COMPANY_INFO.logo}" alt="Telogica Logo">
      <h1>TELOGICA LIMITED</h1>
    </div>

    <!-- Content -->
    <div class="content">
      ${content}
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-grid">
        <div class="footer-section">
          <h3>Contact Us</h3>
          <p><strong>Email:</strong><br>
            <a href="mailto:${COMPANY_INFO.emails.sales}">${COMPANY_INFO.emails.sales}</a><br>
            <a href="mailto:${COMPANY_INFO.emails.support}">${COMPANY_INFO.emails.support}</a>
          </p>
          <p><strong>Phone:</strong><br>
            ${COMPANY_INFO.phones.join('<br>')}
          </p>
        </div>
        <div class="footer-section">
          <h3>Our Address</h3>
          <p>
            ${COMPANY_INFO.address}
          </p>
        </div>
      </div>
      
      <div class="social-links">
        <a href="${COMPANY_INFO.website}" target="_blank">Visit Our Website</a>
      </div>

      <div class="footer-bottom">
        <p>&copy; ${new Date().getFullYear()} Telogica Limited. All rights reserved.</p>
        <p style="font-size: 12px; margin-top: 8px;">This is an automated email. Please do not reply directly to this message.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

// Welcome Email Template
const getWelcomeEmail = (userName) => {
  const content = `
    <h2>Welcome to Telogica! 🎉</h2>
    <p>Dear ${userName},</p>
    <p>Thank you for registering with <strong>Telogica</strong>. We're excited to have you as part of our growing community!</p>
    
    <div class="info-box">
      <p><strong>What's Next?</strong></p>
      <p>Explore our wide range of telecommunication products and solutions designed to meet your business needs.</p>
    </div>

    <a href="${COMPANY_INFO.website}" class="button">Explore Products</a>

    <p>If you have any questions or need assistance, our support team is always here to help.</p>
    <p>Best regards,<br><strong>Team Telogica</strong></p>
  `;
  return getEmailTemplate(content);
};

// Retailer Welcome Email
const getRetailerWelcomeEmail = (retailerName) => {
  const content = `
    <h2>Welcome to Telogica Partner Network! 🤝</h2>
    <p>Dear ${retailerName},</p>
    <p>Congratulations! Your retailer account with <strong>Telogica</strong> has been successfully created.</p>
    
    <div class="info-box">
      <p><strong>Retailer Benefits:</strong></p>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Special retailer pricing on all products</li>
        <li>Bulk ordering capabilities</li>
        <li>Dedicated support team</li>
        <li>Access to inventory management tools</li>
      </ul>
    </div>

    <p><strong>Note:</strong> Your account is currently pending approval. Our team will review your application and activate your account within 24-48 hours.</p>

    <a href="${COMPANY_INFO.website}" class="button">Visit Dashboard</a>

    <p>For any inquiries, please contact our sales team at <a href="mailto:${COMPANY_INFO.emails.sales}">${COMPANY_INFO.emails.sales}</a></p>
    <p>Best regards,<br><strong>Telogica Sales Team</strong></p>
  `;
  return getEmailTemplate(content);
};

// Order Confirmation Email
const getOrderConfirmationEmail = (userName, orderNumber, totalAmount, orderDetails) => {
  const content = `
    <h2>Order Confirmation</h2>
    <p>Dear ${userName},</p>
    <p>Thank you for your order! We've received your order and it's being processed.</p>
    
    <div class="info-box">
      <p><strong>Order Number:</strong> ${orderNumber}</p>
      <p><strong>Total Amount:</strong> ₹${totalAmount.toLocaleString('en-IN')}</p>
      <p><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}</p>
    </div>

    ${orderDetails ? `
    <h3 style="color: #059669; margin-top: 25px;">Order Items:</h3>
    ${orderDetails}
    ` : ''}

    <p style="margin-top: 25px;">You will receive another email once your order has been shipped with tracking details.</p>

    <a href="${COMPANY_INFO.website}" class="button">Track Order</a>

    <p>Thank you for choosing Telogica!</p>
    <p>Best regards,<br><strong>Team Telogica</strong></p>
  `;
  return getEmailTemplate(content);
};

// Quote Request Email (to Admin)
const getQuoteRequestAdminEmail = (userName, userEmail, productCount) => {
  const content = `
    <h2>New Quote Request Received</h2>
    <p>A new quote request has been submitted.</p>
    
    <div class="info-box">
      <p><strong>Customer Name:</strong> ${userName}</p>
      <p><strong>Customer Email:</strong> ${userEmail}</p>
      <p><strong>Number of Products:</strong> ${productCount}</p>
      <p><strong>Requested On:</strong> ${new Date().toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</p>
    </div>

    <a href="${COMPANY_INFO.website}" class="button">View Quote Request</a>

    <p>Please review and respond to this quote request at your earliest convenience.</p>
    <p>Best regards,<br><strong>Telogica System</strong></p>
  `;
  return getEmailTemplate(content);
};

// Quote Response Email (to Customer)
const getQuoteResponseEmail = (userName, totalPrice, responseMessage) => {
  const content = `
    <h2>Your Quote Response is Ready!</h2>
    <p>Dear ${userName},</p>
    <p>We've reviewed your quote request and are pleased to provide you with our pricing.</p>
    
    <div class="info-box">
      <p><strong>Quoted Price:</strong> ₹${totalPrice.toLocaleString('en-IN')}</p>
      ${responseMessage ? `<p><strong>Message from our team:</strong><br>${responseMessage}</p>` : ''}
    </div>

    <p>This quote is valid for 30 days from the date of issue.</p>

    <a href="${COMPANY_INFO.website}" class="button">Accept Quote</a>

    <p>If you have any questions or would like to discuss this further, please don't hesitate to contact us.</p>
    <p>Best regards,<br><strong>Telogica Sales Team</strong></p>
  `;
  return getEmailTemplate(content);
};

// Warranty Registration Email
const getWarrantyRegistrationEmail = (userName, productName, serialNumber, warrantyPeriod) => {
  const content = `
    <h2>Warranty Registration Successful</h2>
    <p>Dear ${userName},</p>
    <p>Your warranty registration has been successfully submitted and is pending approval.</p>
    
    <div class="info-box">
      <p><strong>Product:</strong> ${productName}</p>
      <p><strong>Serial Number:</strong> ${serialNumber}</p>
      <p><strong>Warranty Period:</strong> ${warrantyPeriod} months</p>
      <p><strong>Registered On:</strong> ${new Date().toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}</p>
    </div>

    <p>Our team will review your warranty registration and send you a confirmation email within 24-48 hours.</p>

    <a href="${COMPANY_INFO.website}" class="button">View Warranty Status</a>

    <p>Thank you for choosing Telogica!</p>
    <p>Best regards,<br><strong>Telogica Support Team</strong></p>
  `;
  return getEmailTemplate(content);
};

// Delivery Tracking Email
const getDeliveryTrackingEmail = (userName, orderNumber, trackingLink) => {
  const content = `
    <h2>Your Order is On Its Way! 🚚</h2>
    <p>Dear ${userName},</p>
    <p>Great news! Your order <strong>${orderNumber}</strong> has been shipped and is on its way to you.</p>
    
    <div class="info-box">
      <p><strong>Track Your Delivery:</strong></p>
      <p><a href="${trackingLink}" style="color: #059669; font-weight: 600;">${trackingLink}</a></p>
    </div>

    <a href="${trackingLink}" class="button">Track Your Package</a>

    <p>You can use the tracking link above to monitor your delivery status in real-time.</p>
    <p>If you have any questions about your order, please contact our support team.</p>
    <p>Best regards,<br><strong>Team Telogica</strong></p>
  `;
  return getEmailTemplate(content);
};

// Contact Form Acknowledgment
const getContactAcknowledgmentEmail = (userName) => {
  const content = `
    <h2>Thank You for Contacting Us</h2>
    <p>Dear ${userName},</p>
    <p>We've received your message and appreciate you reaching out to us.</p>
    
    <div class="info-box">
      <p><strong>What happens next?</strong></p>
      <p>Our team will review your inquiry and get back to you within 24 hours during business hours.</p>
    </div>

    <p>If your matter is urgent, please feel free to call us directly at:</p>
    <p><strong>${COMPANY_INFO.phones[0]}</strong></p>

    <a href="${COMPANY_INFO.website}" class="button">Visit Our Website</a>

    <p>Thank you for your patience!</p>
    <p>Best regards,<br><strong>Telogica Support Team</strong></p>
  `;
  return getEmailTemplate(content);
};

// Contact Form Notification (to Admin)
const getContactNotificationEmail = (userName, userEmail, message) => {
  const content = `
    <h2>New Contact Form Submission</h2>
    <p>A new message has been received through the contact form.</p>
    
    <div class="info-box">
      <p><strong>From:</strong> ${userName}</p>
      <p><strong>Email:</strong> ${userEmail}</p>
      <p><strong>Received:</strong> ${new Date().toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</p>
    </div>

    <h3 style="color: #059669; margin-top: 25px;">Message:</h3>
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px; border-left: 4px solid #10b981;">
      <p style="margin: 0; white-space: pre-wrap;">${message}</p>
    </div>

    <a href="${COMPANY_INFO.website}" class="button">View in Dashboard</a>

    <p>Please respond to this inquiry at your earliest convenience.</p>
    <p>Best regards,<br><strong>Telogica System</strong></p>
  `;
  return getEmailTemplate(content);
};

// Password Reset Email
const getPasswordResetEmail = (userName, resetLink) => {
  const content = `
    <h2>Password Reset Request</h2>
    <p>Dear ${userName},</p>
    <p>We received a request to reset your password for your Telogica account.</p>
    
    <div class="info-box">
      <p><strong>Important:</strong> This link will expire in 1 hour for security reasons.</p>
    </div>

    <a href="${resetLink}" class="button">Reset Your Password</a>

    <p>If you didn't request a password reset, please ignore this email or contact our support team if you have concerns about your account security.</p>

    <p>For security reasons, we recommend:</p>
    <ul style="margin: 10px 0; padding-left: 20px;">
      <li>Using a strong, unique password</li>
      <li>Not sharing your password with anyone</li>
      <li>Changing your password regularly</li>
    </ul>

    <p>Best regards,<br><strong>Telogica Security Team</strong></p>
  `;
  return getEmailTemplate(content);
};

// Invoice Email
const getInvoiceEmail = (userName, invoiceNumber, invoiceUrl) => {
  const content = `
    <h2>Your Invoice is Ready</h2>
    <p>Dear ${userName},</p>
    <p>Your invoice has been generated and is ready for download.</p>
    
    <div class="info-box">
      <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
      <p><strong>Generated On:</strong> ${new Date().toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}</p>
    </div>

    <a href="${invoiceUrl}" class="button">Download Invoice</a>

    <p>Please keep this invoice for your records. If you have any questions regarding this invoice, please contact our support team.</p>

    <p>Thank you for your business!</p>
    <p>Best regards,<br><strong>Telogica Accounts Team</strong></p>
  `;
  return getEmailTemplate(content);
};

const getPaymentSuccessEmail = (customerName, orderNumber, amount, invoiceUrl = null, warrantyLinks = []) => {
  let invoiceSection = '';
  if (invoiceUrl) {
    invoiceSection = `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${invoiceUrl}" class="button">Download Invoice</a>
      </div>
    `;
  }

  let warrantySection = '';
  if (warrantyLinks && warrantyLinks.length > 0) {
    const warrantyItems = warrantyLinks.map(w => `
      <div style="background-color: #f0fdf4; padding: 15px; margin: 10px 0; border-radius: 8px; border-left: 4px solid #10b981;">
        <p style="margin: 5px 0; color: #065f46;"><strong>${w.name}</strong></p>
        <p style="margin: 5px 0; color: #047857; font-size: 14px;">Serial Number: ${w.serial}</p>
        <a href="${w.url}" style="color: #059669; text-decoration: none; font-weight: 600; font-size: 14px;">📄 Download Warranty Certificate</a>
      </div>
    `).join('');

    warrantySection = `
      <div style="margin: 30px 0;">
        <h3 style="color: #065f46; margin-bottom: 15px; font-size: 18px;">📋 Warranty Certificates</h3>
        ${warrantyItems}
      </div>
    `;
  }

  const content = `
    <div style="text-align: center; margin: 20px 0;">
      <div style="display: inline-block; background-color: #dcfce7; padding: 15px 30px; border-radius: 50px;">
        <span style="font-size: 40px;">✅</span>
      </div>
    </div>

    <h2 style="color: #065f46; text-align: center; margin: 20px 0; font-size: 28px;">Payment Successful!</h2>
    
    <p>Dear ${customerName},</p>
    
    <p>Thank you for your payment! We're pleased to confirm that your payment has been processed successfully.</p>

    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center;">
      <p style="margin: 0; font-size: 14px; opacity: 0.9;">Order Number</p>
      <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">#${orderNumber}</p>
    </div>

    <div style="background-color: #f9fafb; padding: 25px; border-radius: 12px; margin: 25px 0;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; margin-bottom: 15px;">
        <span style="color: #6b7280; font-size: 16px;">Payment Amount</span>
        <span style="color: #059669; font-size: 32px; font-weight: 700;">₹${amount.toLocaleString('en-IN')}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0;">
        <span style="color: #6b7280;">Payment Status</span>
        <span style="color: #059669; font-weight: 600;">✓ Completed</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0;">
        <span style="color: #6b7280;">Payment Date</span>
        <span style="color: #1f2937; font-weight: 600;">${new Date().toLocaleDateString('en-IN', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 8px 0;">
        <span style="color: #6b7280;">Order ID</span>
        <span style="color: #1f2937; font-weight: 600;">#${orderNumber}</span>
      </div>
    </div>

    ${invoiceSection}
    ${warrantySection}

    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 6px;">
      <h4 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px;">📦 What's Next?</h4>
      <ul style="margin: 10px 0; padding-left: 20px; color: #1e3a8a; line-height: 1.8;">
        <li>Your order is being processed and will be shipped soon</li>
        <li>You'll receive a tracking link once your order is dispatched</li>
        <li>Keep your invoice and warranty certificates safe</li>
        <li>Contact our support team if you have any questions</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${COMPANY_INFO.website}user-dashboard" class="button" style="background: linear-gradient(135deg, #059669 0%, #047857 100%);">View Order Status</a>
    </div>

    <p>Thank you for choosing Telogica! We appreciate your business and look forward to serving you.</p>

    <p>If you have any questions or concerns, please don't hesitate to reach out to our customer support team.</p>

    <p>Best regards,<br><strong>The Telogica Team</strong></p>
  `;
  return getEmailTemplate(content);
};

module.exports = {
  COMPANY_INFO,
  getEmailTemplate,
  getWelcomeEmail,
  getRetailerWelcomeEmail,
  getOrderConfirmationEmail,
  getQuoteRequestAdminEmail,
  getQuoteResponseEmail,
  getWarrantyRegistrationEmail,
  getDeliveryTrackingEmail,
  getContactAcknowledgmentEmail,
  getContactNotificationEmail,
  getPasswordResetEmail,
  getInvoiceEmail,
  getPaymentSuccessEmail
};
