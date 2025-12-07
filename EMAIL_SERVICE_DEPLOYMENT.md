# Email Service Deployment Guide

## Overview

The Email Service is now separated as a standalone microservice that can be deployed independently from the main backend. This provides better scalability, security, and maintainability.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│                 │         │                  │
│  Main Backend   ├────────►│  Email Service   │
│  (Port 5000)    │  HTTP   │  (Port 5001)     │
│                 │         │                  │
└─────────────────┘         └──────────────────┘
         │                           │
         │                           │
         ▼                           ▼
    ┌─────────┐               ┌─────────────┐
    │ MongoDB │               │  Nodemailer │
    │ (Main)  │               │   (Gmail)   │
    └─────────┘               └─────────────┘
```

## Deployment Options

### Option 1: Same Server (Development/Small Scale)

Both services run on the same server on different ports.

**Steps:**
1. Keep EMAIL_SERVICE_URL as `http://localhost:5001`
2. Run both services:
   ```bash
   # Terminal 1 - Main Backend
   cd Backend
   npm run dev
   
   # Terminal 2 - Email Service
   cd EmailService
   npm run dev
   ```

### Option 2: Separate Servers (Production - Recommended)

Deploy Email Service to a different platform/server.

#### Deploy Email Service to Vercel

1. Create a new Git repository for EmailService:
   ```bash
   cd EmailService
   git init
   git add .
   git commit -m "Initial email service"
   ```

2. Push to GitHub/GitLab

3. Deploy on Vercel:
   - Connect your repository
   - Set environment variables in Vercel dashboard
   - Deploy

4. Update Backend .env:
   ```env
   EMAIL_SERVICE_URL=https://your-email-service.vercel.app
   EMAIL_SERVICE_API_KEY=your-production-api-key
   ```

#### Deploy Email Service to Railway

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Deploy:
   ```bash
   cd EmailService
   railway login
   railway init
   railway up
   ```

3. Set environment variables in Railway dashboard

4. Get deployment URL and update Backend .env

#### Deploy Email Service to Heroku

1. Install Heroku CLI

2. Deploy:
   ```bash
   cd EmailService
   heroku create telogica-email-service
   heroku config:set EMAIL_USER=your-email
   heroku config:set EMAIL_PASS=your-password
   heroku config:set API_KEY=your-api-key
   heroku config:set MONGODB_URI=your-mongodb-uri
   git push heroku main
   ```

3. Update Backend .env:
   ```env
   EMAIL_SERVICE_URL=https://telogica-email-service.herokuapp.com
   ```

#### Deploy Email Service to VPS (DigitalOcean, AWS EC2, etc.)

1. SSH into your VPS

2. Install Node.js and PM2:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

3. Clone and setup:
   ```bash
   git clone <your-email-service-repo>
   cd EmailService
   npm install
   ```

4. Create .env file with production values

5. Start with PM2:
   ```bash
   pm2 start server.js --name email-service
   pm2 save
   pm2 startup
   ```

6. Setup Nginx reverse proxy:
   ```nginx
   server {
       listen 80;
       server_name email.telogica.com;
       
       location / {
           proxy_pass http://localhost:5001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. Setup SSL with Let's Encrypt:
   ```bash
   sudo certbot --nginx -d email.telogica.com
   ```

8. Update Backend .env:
   ```env
   EMAIL_SERVICE_URL=https://email.telogica.com
   ```

## Environment Variables

### Backend .env
```env
# Email Service Configuration
EMAIL_SERVICE_URL=http://localhost:5001  # Change for production
EMAIL_SERVICE_API_KEY=your-secure-api-key
```

### EmailService .env
```env
PORT=5001
NODE_ENV=production

# Email Credentials
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM_NAME=Telogica

# MongoDB (for logs)
MONGODB_URI=your-mongodb-connection-string

# Security
API_KEY=your-secure-api-key  # Must match Backend EMAIL_SERVICE_API_KEY

# CORS
ALLOWED_ORIGINS=https://your-frontend.com,https://your-backend.com
```

## Security Checklist

- [ ] Generate strong API_KEY (use: `openssl rand -hex 32`)
- [ ] Use Gmail App Password (not regular password)
- [ ] Enable 2FA on Gmail account
- [ ] Set specific ALLOWED_ORIGINS (not *)
- [ ] Use HTTPS in production
- [ ] Keep API_KEY secret and rotate regularly
- [ ] Monitor email logs for suspicious activity
- [ ] Set up rate limiting (already configured)
- [ ] Use environment-specific .env files

## Testing

### Test Email Service Health

```bash
curl http://localhost:5001/health
```

Response:
```json
{
  "status": "healthy",
  "service": "Email Service",
  "timestamp": "2024-12-07T..."
}
```

### Test Sending Email

```bash
curl -X POST http://localhost:5001/api/email/send \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "text": "This is a test",
    "emailType": "general"
  }'
```

### Test From Backend

```bash
curl -X POST http://localhost:5000/api/test-email
```

## Monitoring

### Check Email Service Logs

**PM2:**
```bash
pm2 logs email-service
```

**Vercel:**
View logs in Vercel dashboard

**Heroku:**
```bash
heroku logs --tail -a telogica-email-service
```

### Check Email Statistics

```bash
curl -H "x-api-key: your-api-key" \
  http://localhost:5001/api/email/stats
```

## Troubleshooting

### Email Service Not Responding

1. Check if service is running:
   ```bash
   pm2 status  # For PM2
   curl http://localhost:5001/health
   ```

2. Check logs for errors

3. Verify EMAIL_SERVICE_URL in Backend .env

4. Backend will automatically fallback to local mailer if service is down

### Emails Not Sending

1. Verify Gmail credentials
2. Check if "Less secure app access" is disabled (use App Password)
3. Check SMTP settings
4. Review email logs:
   ```bash
   curl -H "x-api-key: your-api-key" \
     "http://localhost:5001/api/email/logs?status=failed"
   ```

### Authentication Errors

1. Verify API_KEY matches in both services
2. Check x-api-key header is included
3. Ensure no typos in environment variables

## Scaling

### Horizontal Scaling

Deploy multiple instances of Email Service behind a load balancer:

```
                    ┌──────────────────┐
                    │  Load Balancer   │
                    └────────┬─────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
      │ Email Service│ │ Email Service│ │ Email Service│
      │ Instance 1   │ │ Instance 2   │ │ Instance 3   │
      └──────────────┘ └──────────────┘ └──────────────┘
```

### Queue-Based Processing

For high volume, add Redis queue:

1. Install Redis
2. Add Bull queue to Email Service
3. Process emails asynchronously

## Backup Plan

The Backend has automatic fallback to local mailer if Email Service is unavailable. This ensures emails are always sent even if the microservice is down.

## Production Deployment Checklist

- [ ] Deploy Email Service to production platform
- [ ] Update EMAIL_SERVICE_URL in Backend .env
- [ ] Set strong API_KEY in both services
- [ ] Configure ALLOWED_ORIGINS
- [ ] Enable HTTPS/SSL
- [ ] Test email sending
- [ ] Set up monitoring
- [ ] Configure backup email provider (optional)
- [ ] Document deployment URL and credentials
- [ ] Set up automated backups for MongoDB
- [ ] Configure alerts for failed emails

## Support

For issues:
1. Check health endpoint
2. Review logs
3. Verify environment variables
4. Test with curl commands
5. Check MongoDB connection
