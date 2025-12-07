# Email Service - Postman Testing Guide

## Base URL
```
http://localhost:5001
```

---

## 1. Health Check (No Auth Required)

**GET** `http://localhost:5001/health`

**Response:**
```json
{
  "status": "healthy",
  "service": "Email Service",
  "timestamp": "2024-12-07T..."
}
```

---

## 2. Send Custom Email

**POST** `http://localhost:5001/api/email/send`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "to": "test@example.com",
  "subject": "Test Email from Postman",
  "text": "This is a plain text test email",
  "html": "<h1>Test Email</h1><p>This is an HTML test email from Postman</p>",
  "emailType": "general"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "messageId": "...",
  "emailLogId": "..."
}
```

---

## 3. Send Welcome Email (Template)

**POST** `http://localhost:5001/api/email/send-template`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "to": "newuser@example.com",
  "templateType": "welcome",
  "templateData": {
    "userName": "John Doe"
  },
  "emailType": "welcome"
}
```

---

## 4. Send Order Confirmation Email

**POST** `http://localhost:5001/api/email/send-template`

**Body (JSON):**
```json
{
  "to": "customer@example.com",
  "templateType": "order-confirmation",
  "templateData": {
    "orderNumber": "12345678",
    "customerName": "Jane Smith",
    "totalAmount": "15000"
  },
  "emailType": "order_confirmation"
}
```

---

## 5. Send Payment Success Email (Professional Template)

**POST** `http://localhost:5001/api/email/send-template`

**Body (JSON):**
```json
{
  "to": "customer@example.com",
  "templateType": "payment-success",
  "templateData": {
    "customerName": "Jane Smith",
    "orderNumber": "12345678",
    "amount": 15000,
    "invoiceUrl": "https://cloudinary.com/invoice/INV-12345678.pdf",
    "warrantyLinks": [
      {
        "name": "Telecom Device XYZ",
        "serial": "SN12345678",
        "url": "https://cloudinary.com/warranty/WRT-12345678.pdf"
      },
      {
        "name": "Network Router ABC",
        "serial": "SN87654321",
        "url": "https://cloudinary.com/warranty/WRT-87654321.pdf"
      }
    ]
  },
  "emailType": "payment_confirmation"
}
```

**Note:** The `invoiceUrl` and `warrantyLinks` are optional. You can test without them:

```json
{
  "to": "customer@example.com",
  "templateType": "payment-success",
  "templateData": {
    "customerName": "Jane Smith",
    "orderNumber": "12345678",
    "amount": 15000
  },
  "emailType": "payment_confirmation"
}
```

---

## 6. Send Delivery Tracking Email

**POST** `http://localhost:5001/api/email/send-template`

**Body (JSON):**
```json
{
  "to": "customer@example.com",
  "templateType": "delivery-tracking",
  "templateData": {
    "customerName": "Jane Smith",
    "orderNumber": "12345678",
    "trackingLink": "https://tracking.example.com/track/ABC123"
  },
  "emailType": "delivery_tracking"
}
```

---

## 7. Send Quote Request to Admin

**POST** `http://localhost:5001/api/email/send-template`

**Body (JSON):**
```json
{
  "to": "admin@telogica.com",
  "templateType": "quote-request-admin",
  "templateData": {
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "products": [
      { "name": "Product A", "quantity": 5 },
      { "name": "Product B", "quantity": 3 }
    ]
  },
  "emailType": "quote_request"
}
```

---

## 8. Send Quote Response

**POST** `http://localhost:5001/api/email/send-template`

**Body (JSON):**
```json
{
  "to": "customer@example.com",
  "templateType": "quote-response",
  "templateData": {
    "customerName": "John Doe",
    "quoteDetails": "Product A: ₹5000/unit x 5 = ₹25,000\nProduct B: ₹3000/unit x 3 = ₹9,000\nTotal: ₹34,000"
  },
  "emailType": "quote_response"
}
```

---

## 9. Send Warranty Registration Email

**POST** `http://localhost:5001/api/email/send-template`

**Body (JSON):**
```json
{
  "to": "customer@example.com",
  "templateType": "warranty",
  "templateData": {
    "customerName": "Jane Smith",
    "warrantyDetails": "Product: Telecom Device XYZ\nSerial Number: SN12345678\nWarranty Period: 2 years\nValid Until: December 7, 2027"
  },
  "emailType": "warranty_registration"
}
```

---

## 10. Send Contact Confirmation Email

**POST** `http://localhost:5001/api/email/send-template`

**Body (JSON):**
```json
{
  "to": "customer@example.com",
  "templateType": "contact-confirmation",
  "templateData": {
    "name": "John Doe"
  },
  "emailType": "contact_confirmation"
}
```

---

## 11. Send Retailer Welcome Email

**POST** `http://localhost:5001/api/email/send-template`

**Body (JSON):**
```json
{
  "to": "retailer@example.com",
  "templateType": "retailer-welcome",
  "templateData": {
    "retailerName": "ABC Electronics"
  },
  "emailType": "retailer_welcome"
}
```

---

## 12. Send Password Reset Email

**POST** `http://localhost:5001/api/email/send-template`

**Body (JSON):**
```json
{
  "to": "user@example.com",
  "templateType": "password-reset",
  "templateData": {
    "resetLink": "https://telogica.com/reset-password?token=abc123xyz"
  },
  "emailType": "password_reset"
}
```

---

## 13. Send Invoice Email

**POST** `http://localhost:5001/api/email/send-template`

**Body (JSON):**
```json
{
  "to": "customer@example.com",
  "templateType": "invoice",
  "templateData": {
    "customerName": "Jane Smith",
    "invoiceNumber": "INV-2024-001",
    "amount": "15000"
  },
  "emailType": "invoice"
}
```

---

## 14. Get Email Logs

**GET** `http://localhost:5001/api/email/logs`

**Query Parameters (optional):**
- `status` - Filter by status (sent, failed, pending)
- `emailType` - Filter by email type
- `limit` - Number of logs (default: 100)

**Example:**
```
http://localhost:5001/api/email/logs?status=sent&limit=20
```

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "_id": "...",
      "recipient": "test@example.com",
      "subject": "Test Email",
      "status": "sent",
      "emailType": "general",
      "createdAt": "...",
      "sentAt": "..."
    }
  ]
}
```

---

## 15. Get Email Statistics

**GET** `http://localhost:5001/api/email/stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "sent": 145,
    "failed": 3,
    "pending": 2,
    "last24Hours": 25
  }
}
```

---

## 16. Resend Failed Email

**POST** `http://localhost:5001/api/email/resend/:emailLogId`

**Example:**
```
POST http://localhost:5001/api/email/resend/67546abc123def456
```

**Response:**
```json
{
  "success": true,
  "message": "Email resent successfully",
  "messageId": "..."
}
```

---

## Complete Postman Collection (Import This)

Save this as `Telogica-Email-Service.postman_collection.json`:

```json
{
  "info": {
    "name": "Telogica Email Service",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:5001/health",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5001",
          "path": ["health"]
        }
      }
    },
    {
      "name": "Send Custom Email",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"to\": \"test@example.com\",\n  \"subject\": \"Test Email\",\n  \"text\": \"This is a test email\",\n  \"html\": \"<h1>Test</h1><p>This is a test email</p>\",\n  \"emailType\": \"general\"\n}"
        },
        "url": {
          "raw": "http://localhost:5001/api/email/send",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5001",
          "path": ["api", "email", "send"]
        }
      }
    },
    {
      "name": "Send Welcome Email",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"to\": \"newuser@example.com\",\n  \"templateType\": \"welcome\",\n  \"templateData\": {\n    \"userName\": \"John Doe\"\n  },\n  \"emailType\": \"welcome\"\n}"
        },
        "url": {
          "raw": "http://localhost:5001/api/email/send-template",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5001",
          "path": ["api", "email", "send-template"]
        }
      }
    },
    {
      "name": "Get Email Logs",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:5001/api/email/logs?limit=50",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5001",
          "path": ["api", "email", "logs"],
          "query": [
            {
              "key": "limit",
              "value": "50"
            }
          ]
        }
      }
    },
    {
      "name": "Get Email Stats",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:5001/api/email/stats",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5001",
          "path": ["api", "email", "stats"]
        }
      }
    }
  ]
}
```

---

## Quick Start Steps

1. **Start Email Service:**
   ```bash
   cd EmailService
   npm install
   npm run dev
   ```

2. **Open Postman**

3. **Test Health Check:**
   - Method: GET
   - URL: `http://localhost:5001/health`
   - Click Send

4. **Test Send Email:**
   - Method: POST
   - URL: `http://localhost:5001/api/email/send`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "to": "your-email@gmail.com",
       "subject": "Test from Postman",
       "text": "Hello from Telogica Email Service!",
       "emailType": "general"
     }
     ```
   - Click Send

5. **Check your email inbox!**

---

## Template Types Available

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

---

## Troubleshooting

### Email not sending?
1. Check `.env` file has correct Gmail credentials
2. Verify Gmail App Password is set correctly
3. Check console logs for errors
4. Try with your own email first

### CORS Error?
- Email service allows all origins by default for testing

### Rate Limit Error?
- Wait 15 minutes or restart the service

---

## Environment Variables

Make sure `EmailService/.env` has:
```env
PORT=5001
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM_NAME=Telogica
```
