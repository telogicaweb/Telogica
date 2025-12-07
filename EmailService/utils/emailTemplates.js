// Company Information
const COMPANY_INFO = {
  name: 'Telogica',
  logo: 'https://aishwaryatechtele.com/images/telogica_logo.png',
  website: 'https://aishwaryatechtele.com',
  address: 'Aishwarya Tech Tele Solutions Private Limited, Somajiguda, Hyderabad, Telangana, India',
  phone1: '+91 93937 44786',
  phone2: '+91 81067 64867',
  email: 'info@aishwaryatechtele.com',
  supportEmail: 'support@aishwaryatechtele.com'
};

// Common email styles and header/footer
const getEmailHeader = () => `
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
    <img src="${COMPANY_INFO.logo}" alt="${COMPANY_INFO.name}" style="height: 50px; margin-bottom: 15px;">
    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">${COMPANY_INFO.name}</h1>
  </div>
`;

const getEmailFooter = () => `
  <div style="background-color: #1f2937; color: #e5e7eb; padding: 30px; margin-top: 40px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="${COMPANY_INFO.logo}" alt="${COMPANY_INFO.name}" style="height: 40px; margin-bottom: 15px;">
    </div>
    <div style="max-width: 600px; margin: 0 auto; text-align: center;">
      <p style="margin: 10px 0; font-size: 14px;"><strong>${COMPANY_INFO.name}</strong></p>
      <p style="margin: 10px 0; font-size: 13px;">${COMPANY_INFO.address}</p>
      <p style="margin: 10px 0; font-size: 13px;">
        📞 ${COMPANY_INFO.phone1} | ${COMPANY_INFO.phone2}<br>
        📧 ${COMPANY_INFO.email}
      </p>
      <p style="margin: 20px 0 10px 0;">
        <a href="${COMPANY_INFO.website}" style="color: #10b981; text-decoration: none; font-weight: 600;">Visit Our Website</a>
      </p>
      <p style="margin: 10px 0; font-size: 12px; color: #9ca3af;">
        © ${new Date().getFullYear()} ${COMPANY_INFO.name}. All rights reserved.
      </p>
    </div>
  </div>
`;

// Template Functions
const getWelcomeEmail = (userName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        ${getEmailHeader()}
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">Welcome to ${COMPANY_INFO.name}!</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Dear ${userName},</p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Thank you for registering with ${COMPANY_INFO.name}. We're excited to have you on board!
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Explore our wide range of telecom products and solutions designed to meet your business needs.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${COMPANY_INFO.website}/products" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Browse Products</a>
          </div>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            If you have any questions, feel free to contact our support team.
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Best regards,<br>
            <strong>The ${COMPANY_INFO.name} Team</strong>
          </p>
        </div>
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;
};

const getRetailerWelcomeEmail = (retailerName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0;">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        ${getEmailHeader()}
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">Welcome to ${COMPANY_INFO.name} Retailer Network!</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Dear ${retailerName},</p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Congratulations! Your retailer account has been successfully created.
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            You now have access to our complete product catalog and can start managing your inventory and sales.
          </p>
          <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <h3 style="color: #065f46; margin-top: 0; font-size: 18px;">As a retailer, you can:</h3>
            <ul style="color: #047857; margin: 10px 0; padding-left: 20px;">
              <li>Access wholesale pricing</li>
              <li>Manage your inventory</li>
              <li>Track sales and shipments</li>
              <li>Request product quotes</li>
              <li>View detailed analytics</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${COMPANY_INFO.website}/retailer-dashboard" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Access Dashboard</a>
          </div>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Best regards,<br>
            <strong>The ${COMPANY_INFO.name} Team</strong>
          </p>
        </div>
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;
};

const getOrderConfirmationEmail = (orderNumber, customerName, totalAmount) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        ${getEmailHeader()}
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">Order Confirmation</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Dear ${customerName},</p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Thank you for your order! We've received your order and are processing it.
          </p>
          <div style="background-color: #f0fdf4; border: 2px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 8px; text-align: center;">
            <p style="margin: 0; color: #065f46; font-size: 14px; font-weight: 600;">Order Number</p>
            <p style="margin: 10px 0 0 0; color: #047857; font-size: 24px; font-weight: 700;">#${orderNumber}</p>
          </div>
          <div style="background-color: #f9fafb; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Order Total</p>
            <p style="margin: 0; color: #1f2937; font-size: 28px; font-weight: 700;">₹${totalAmount}</p>
          </div>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            We'll send you another email with tracking information once your order ships.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${COMPANY_INFO.website}/user-dashboard" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">View Order Status</a>
          </div>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Best regards,<br>
            <strong>The ${COMPANY_INFO.name} Team</strong>
          </p>
        </div>
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;
};

const getDeliveryTrackingEmail = (customerName, orderNumber, trackingLink) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        ${getEmailHeader()}
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">Your Order is On the Way! 🚚</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Dear ${customerName},</p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Great news! Your order <strong>#${orderNumber}</strong> has been shipped and is on its way to you.
          </p>
          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0 0 15px 0; color: #1e40af; font-weight: 600;">Track Your Delivery:</p>
            <div style="text-align: center;">
              <a href="${trackingLink}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600;">Track Package</a>
            </div>
          </div>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            You can click the button above to see real-time updates on your delivery status.
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            If you have any questions about your order, please don't hesitate to contact us.
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Best regards,<br>
            <strong>The ${COMPANY_INFO.name} Team</strong>
          </p>
        </div>
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;
};

const getQuoteRequestAdminEmail = (customerName, customerEmail, products) => {
  const productsList = products.map(p => `<li>${p.name} - Quantity: ${p.quantity}</li>`).join('');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        ${getEmailHeader()}
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">🔔 New Quote Request</h2>
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; color: #92400e; font-weight: 600;">Customer Details:</p>
            <p style="margin: 5px 0; color: #78350f;"><strong>Name:</strong> ${customerName}</p>
            <p style="margin: 5px 0; color: #78350f;"><strong>Email:</strong> ${customerEmail}</p>
          </div>
          <div style="background-color: #f9fafb; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0 0 15px 0; color: #374151; font-weight: 600;">Requested Products:</p>
            <ul style="color: #4b5563; margin: 0; padding-left: 20px;">
              ${productsList}
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${COMPANY_INFO.website}/admin" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Review & Respond</a>
          </div>
        </div>
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;
};

const getQuoteResponseEmail = (customerName, quoteDetails) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        ${getEmailHeader()}
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">Your Quote is Ready! 📋</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Dear ${customerName},</p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Thank you for your interest in our products. We've prepared a quote for you.
          </p>
          <div style="background-color: #f0fdf4; border: 2px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0 0 10px 0; color: #065f46; font-weight: 600;">Quote Details:</p>
            <p style="margin: 5px 0; color: #047857;">${quoteDetails}</p>
          </div>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Please review the quote and let us know if you'd like to proceed with the order.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${COMPANY_INFO.website}/contact" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Contact Us</a>
          </div>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Best regards,<br>
            <strong>The ${COMPANY_INFO.name} Team</strong>
          </p>
        </div>
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;
};

const getWarrantyEmail = (customerName, warrantyDetails) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        ${getEmailHeader()}
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">Warranty Registration Confirmed ✅</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Dear ${customerName},</p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Your warranty has been successfully registered with ${COMPANY_INFO.name}.
          </p>
          <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; color: #065f46; font-weight: 600;">Warranty Information:</p>
            <p style="margin: 5px 0; color: #047857;">${warrantyDetails}</p>
          </div>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Keep this email for your records. If you need to make a warranty claim, please contact our support team.
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Best regards,<br>
            <strong>The ${COMPANY_INFO.name} Team</strong>
          </p>
        </div>
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;
};

const getContactConfirmationEmail = (name) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        ${getEmailHeader()}
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">We've Received Your Message! 📬</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Dear ${name},</p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Thank you for contacting ${COMPANY_INFO.name}. We've received your message and will get back to you as soon as possible.
          </p>
          <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0; color: #1e40af;">
              Our team typically responds within 24-48 hours during business days.
            </p>
          </div>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            If you have an urgent matter, please call us at ${COMPANY_INFO.phone1}.
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Best regards,<br>
            <strong>The ${COMPANY_INFO.name} Team</strong>
          </p>
        </div>
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;
};

const getPasswordResetEmail = (resetLink) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        ${getEmailHeader()}
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request 🔐</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            We received a request to reset your password. Click the button below to create a new password:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
          </div>
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 4px;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;">
              <strong>Important:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email.
            </p>
          </div>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Best regards,<br>
            <strong>The ${COMPANY_INFO.name} Team</strong>
          </p>
        </div>
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;
};

const getInvoiceEmail = (customerName, invoiceNumber, amount) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        ${getEmailHeader()}
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">Invoice - ${invoiceNumber} 📄</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Dear ${customerName},</p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Please find your invoice attached to this email.
          </p>
          <div style="background-color: #f9fafb; padding: 20px; margin: 25px 0; border-radius: 8px; text-align: center;">
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Invoice Amount</p>
            <p style="margin: 0; color: #1f2937; font-size: 32px; font-weight: 700;">₹${amount}</p>
          </div>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Thank you for your business!
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Best regards,<br>
            <strong>The ${COMPANY_INFO.name} Team</strong>
          </p>
        </div>
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;
};

const getPaymentSuccessEmail = (customerName, orderNumber, amount, invoiceUrl = null, warrantyLinks = []) => {
  let invoiceSection = '';
  if (invoiceUrl) {
    invoiceSection = `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${invoiceUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Download Invoice</a>
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

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        ${getEmailHeader()}
        <div style="padding: 40px 30px;">
          <div style="text-align: center; margin: 20px 0;">
            <div style="display: inline-block; background-color: #dcfce7; padding: 15px 30px; border-radius: 50px;">
              <span style="font-size: 40px;">✅</span>
            </div>
          </div>

          <h2 style="color: #065f46; text-align: center; margin: 20px 0; font-size: 28px;">Payment Successful!</h2>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Dear ${customerName},</p>
          
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Thank you for your payment! We're pleased to confirm that your payment has been processed successfully.</p>

          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px; opacity: 0.9;">Order Number</p>
            <p style="margin: 10px 0 0 0; font-size: 28px; font-weight: 700;">#${orderNumber}</p>
          </div>

          <div style="background-color: #f9fafb; padding: 25px; border-radius: 12px; margin: 25px 0;">
            <div style="border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; margin-bottom: 15px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Payment Amount</p>
              <p style="margin: 10px 0 0 0; color: #059669; font-size: 32px; font-weight: 700;">₹${typeof amount === 'number' ? amount.toLocaleString('en-IN') : amount}</p>
            </div>
            <div style="padding: 8px 0; display: flex; justify-content: space-between;">
              <span style="color: #6b7280;">Payment Status</span>
              <span style="color: #059669; font-weight: 600;">✓ Completed</span>
            </div>
            <div style="padding: 8px 0; display: flex; justify-content: space-between;">
              <span style="color: #6b7280;">Payment Date</span>
              <span style="color: #1f2937; font-weight: 600;">${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div style="padding: 8px 0; display: flex; justify-content: space-between;">
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
            <a href="${COMPANY_INFO.website}/user-dashboard" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">View Order Status</a>
          </div>

          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Thank you for choosing ${COMPANY_INFO.name}! We appreciate your business and look forward to serving you.</p>

          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">If you have any questions or concerns, please don't hesitate to reach out to our customer support team.</p>

          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Best regards,<br>
            <strong>The ${COMPANY_INFO.name} Team</strong>
          </p>
        </div>
        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  getWelcomeEmail,
  getRetailerWelcomeEmail,
  getOrderConfirmationEmail,
  getDeliveryTrackingEmail,
  getQuoteRequestAdminEmail,
  getQuoteResponseEmail,
  getWarrantyEmail,
  getContactConfirmationEmail,
  getPasswordResetEmail,
  getInvoiceEmail,
  getPaymentSuccessEmail
};
