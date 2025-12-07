# Email Service

A standalone microservice for handling all email communications for the Telogica platform.

## Features

- ✉️ Send emails via Nodemailer
- 📧 Professional HTML email templates
- 📊 Email logging and tracking
- 🔄 Email resend functionality
- 📈 Email statistics and analytics
- 🔐 API key authentication
- 🚦 Rate limiting
- 🛡️ CORS protection

## Setup

### 1. Install Dependencies

```bash
cd EmailService
npm install
```

### 2. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Update the `.env` file with your credentials:

```env
PORT=5001
NODE_ENV=production

# Email Provider Credentials
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM_NAME=Telogica

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/telogica

# Security
API_KEY=your-secure-api-key-here

# CORS Settings
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000,https://your-main-backend.com
```

### 3. Start the Service

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## API Endpoints

All endpoints require `x-api-key` header for authentication.

### Send Email

**POST** `/api/email/send`

```json
{
  "to": "user@example.com",
  "subject": "Test Email",
  "text": "Plain text content",
  "html": "<h1>HTML content</h1>",
  "emailType": "general",
  "relatedEntity": {
    "type": "order",
    "id": "123456"
  }
}
```

### Send Template Email

**POST** `/api/email/send-template`

```json
{
  "to": "user@example.com",
  "templateType": "welcome",
  "templateData": {
    "userName": "John Doe"
  },
  "emailType": "welcome",
  "relatedEntity": {
    "type": "user",
    "id": "user123"
  }
}
```

**Available Templates:**
- `welcome` - User welcome email
- `retailer-welcome` - Retailer welcome email
- `order-confirmation` - Order confirmation
- `delivery-tracking` - Delivery tracking
- `quote-request-admin` - Quote request notification
- `quote-response` - Quote response
- `warranty` - Warranty confirmation
- `contact-confirmation` - Contact form confirmation
- `password-reset` - Password reset
- `invoice` - Invoice email

### Get Email Logs

**GET** `/api/email/logs?status=sent&limit=50`

Query Parameters:
- `status` - Filter by status (pending, sent, failed)
- `emailType` - Filter by email type
- `recipientType` - Filter by recipient type (user, admin, retailer)
- `recipient` - Filter by recipient email
- `limit` - Number of logs to return (default: 100)

### Get Email Stats

**GET** `/api/email/stats`

Returns:
```json
{
  "success": true,
  "stats": {
    "total": 1500,
    "sent": 1450,
    "failed": 45,
    "pending": 5,
    "last24Hours": 120
  }
}
```

### Resend Email

**POST** `/api/email/resend/:emailLogId`

### Health Check

**GET** `/health`

No authentication required.

## Integration with Main Backend

### 1. Add Environment Variable

In your main backend `.env`:

```env
EMAIL_SERVICE_URL=http://localhost:5001
EMAIL_SERVICE_API_KEY=your-secure-api-key-here
```

For production:
```env
EMAIL_SERVICE_URL=https://your-email-service.com
EMAIL_SERVICE_API_KEY=your-production-api-key
```

### 2. Create Email Client (Backend/utils/emailClient.js)

```javascript
const axios = require('axios');

const emailClient = axios.create({
  baseURL: process.env.EMAIL_SERVICE_URL,
  headers: {
    'x-api-key': process.env.EMAIL_SERVICE_API_KEY,
    'Content-Type': 'application/json'
  }
});

const sendEmail = async (to, subject, text, emailType, relatedEntity, html) => {
  try {
    const response = await emailClient.post('/api/email/send', {
      to,
      subject,
      text,
      html,
      emailType,
      relatedEntity
    });
    return response.data;
  } catch (error) {
    console.error('Email service error:', error.message);
    return { success: false, error: error.message };
  }
};

const sendTemplateEmail = async (to, templateType, templateData, emailType, relatedEntity) => {
  try {
    const response = await emailClient.post('/api/email/send-template', {
      to,
      templateType,
      templateData,
      emailType,
      relatedEntity
    });
    return response.data;
  } catch (error) {
    console.error('Email service error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = { sendEmail, sendTemplateEmail };
```

## Deployment

### Deploy to Vercel/Heroku/Railway

1. Push EmailService folder to a separate Git repository
2. Connect to your hosting platform
3. Set environment variables
4. Deploy

### Deploy to VPS

1. Clone repository on server
2. Install dependencies: `npm install`
3. Set up PM2: `pm2 start server.js --name email-service`
4. Configure nginx reverse proxy
5. Set up SSL certificate

## Security Best Practices

1. **Always use HTTPS in production**
2. **Keep API_KEY secret and rotate regularly**
3. **Use strong email app passwords**
4. **Enable rate limiting**
5. **Whitelist allowed origins in CORS**
6. **Monitor email logs for suspicious activity**

## Monitoring

Check service health:
```bash
curl http://localhost:5001/health
```

View email stats:
```bash
curl -H "x-api-key: YOUR_API_KEY" http://localhost:5001/api/email/stats
```

## Troubleshooting

### Emails not sending

1. Check email credentials in `.env`
2. Verify SMTP settings
3. Check firewall/port settings
4. Review email logs for error messages

### MongoDB connection issues

1. Verify MONGODB_URI is correct
2. Check network connectivity
3. Service will work without MongoDB (logs won't be saved)

## License

ISC
