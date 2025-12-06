# Telogica Platform - Quick Start Guide

## 🚀 Getting Started

**Platform Version:** 3.0.0  
**Status:** Production Ready  
**Last Updated:** December 6, 2025

---

## 📋 Prerequisites

### Required Software
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager
- Git

### Optional (For Production)
- Redis (for caching)
- NGINX (for reverse proxy)
- PM2 (for process management)

---

## ⚙️ Environment Setup

### 1. Clone Repository
```bash
git clone https://github.com/telogicaweb/Telogica.git
cd Telogica
```

### 2. Backend Setup

```bash
cd Backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variables
# Edit .env with your configuration
nano .env
```

**Required Environment Variables:**
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/telogica

# Authentication
JWT_SECRET=your_super_secret_key_here

# Email (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
ADMIN_EMAIL=admin@telogica.com

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Application
MAX_DIRECT_PURCHASE_ITEMS=3
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=*

# Logging
LOG_LEVEL=info
LOG_DIR=logs
```

**Create Admin User:**
```bash
npm run seed:admin
```
This creates admin@telogica.com / Admin@123

**Start Backend:**
```bash
# Development
npm run dev

# Production
npm start
```

### 3. Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure environment variable
echo "VITE_API_URL=http://localhost:5000" > .env

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 🔐 Default Credentials

**Admin Account:**
- Email: admin@telogica.com
- Password: Admin@123
- ⚠️ **CHANGE THIS IMMEDIATELY**

---

## 🛠️ Common Commands

### Backend

```bash
# Development
npm run dev

# Production
npm start

# Create admin user
npm run seed:admin

# Seed mock data
npm run seed:mock
```

### Frontend

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run typecheck

# Linting
npm run lint
```

---

## 📊 API Endpoints Overview

### Base URL
```
Development: http://localhost:5000
Production: https://your-domain.com
```

### Authentication
```
POST   /api/auth/register        - Register new user
POST   /api/auth/login           - User login
GET    /api/auth/profile         - Get user profile
```

### Products
```
GET    /api/products             - Get all products
GET    /api/products/:id         - Get product by ID
POST   /api/products             - Create product (Admin)
PUT    /api/products/:id         - Update product (Admin)
DELETE /api/products/:id         - Delete product (Admin)
```

### Orders
```
POST   /api/orders               - Create order
GET    /api/orders/myorders      - Get user orders
POST   /api/orders/verify        - Verify payment
```

### Quotes
```
POST   /api/quotes               - Request quote
GET    /api/quotes               - Get quotes
PUT    /api/quotes/:id/respond   - Admin respond (Admin)
PUT    /api/quotes/:id/accept    - Accept quote
PUT    /api/quotes/:id/reject    - Reject quote
```

### Notifications (NEW)
```
GET    /api/notifications                - Get notifications
GET    /api/notifications/unread-count   - Get unread count
PUT    /api/notifications/:id/read       - Mark as read
PUT    /api/notifications/mark-all-read  - Mark all read
DELETE /api/notifications/:id            - Delete notification
```

### Activity Logs (NEW)
```
GET /api/activity-logs/my-logs   - Get user activity logs
GET /api/activity-logs/my-stats  - Get user statistics
GET /api/activity-logs           - Get all logs (Admin)
GET /api/activity-logs/stats     - Get statistics (Admin)
```

**For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**

---

## 🎯 User Roles & Permissions

### Admin
- Full system access
- User management
- Product management
- Order management
- Quote management
- Warranty management
- Analytics access
- System settings
- Activity log access

### User
- Browse products
- Purchase products (≤3 items direct, >3 via quote)
- Request quotes
- Register warranties
- View order history
- Access notifications
- View activity logs

### Retailer (Requires Approval)
- All user permissions
- Bulk ordering without limits
- Special wholesale pricing
- Inventory management
- Customer sales tracking
- Warranty transfers

---

## 🔔 Real-Time Features

### WebSocket Connection

**Client Connection:**
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('token')
  }
});

socket.on('connected', (data) => {
  console.log('Connected:', data);
});

socket.on('notification', (notification) => {
  console.log('New notification:', notification);
});
```

**Events Available:**
- `connected` - Connection established
- `notification` - New notification
- `notification:read` - Notification marked as read
- `notifications:all-read` - All notifications read
- `admin-notification` - Admin-specific notification

---

## 📝 Logging

### Winston Logger

**Log Files Location:**
```
logs/
├── error-YYYY-MM-DD.log      # Error logs
├── combined-YYYY-MM-DD.log   # All logs
└── [archived logs]           # Rotated logs
```

**Log Retention:** 14 days  
**Max File Size:** 20MB  
**Format:** JSON

### Log Levels
- error
- warn
- info
- http
- verbose
- debug

---

## 🔒 Security Features

### Rate Limiting
- General API: 100 requests / 15 minutes
- Auth endpoints: 5 requests / 15 minutes
- Export endpoints: 10 requests / 5 minutes

### Input Validation
All inputs are validated and sanitized automatically.

### Authentication
JWT tokens expire after 30 days (configurable).

---

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check MongoDB is running
mongosh

# Check environment variables
cat .env

# Check port availability
lsof -i :5000
```

### Frontend build fails
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear cache
npm cache clean --force
```

### WebSocket connection fails
1. Check JWT token is valid
2. Verify CORS configuration
3. Check backend server is running
4. Verify FRONTEND_URL in .env

### Database connection issues
1. Verify MongoDB is running
2. Check MONGO_URI in .env
3. Verify network connectivity
4. Check MongoDB credentials

---

## 📚 Documentation

### Available Guides
1. [README.md](./README.md) - Project overview
2. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - Complete API reference
3. [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Production deployment
4. [SECURITY_FINAL_REPORT.md](./SECURITY_FINAL_REPORT.md) - Security documentation
5. [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Testing procedures
6. [FINAL_IMPLEMENTATION_SUMMARY.md](./FINAL_IMPLEMENTATION_SUMMARY.md) - Implementation details
7. [ENTERPRISE_IMPLEMENTATION_COMPLETE.md](./ENTERPRISE_IMPLEMENTATION_COMPLETE.md) - Feature documentation

---

## 🚀 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] MongoDB production instance ready
- [ ] HTTPS/SSL certificates installed
- [ ] CORS origins restricted
- [ ] Admin password changed
- [ ] Email service configured
- [ ] Payment gateway credentials set
- [ ] Rate limiting enabled
- [ ] Logs directory writable
- [ ] Frontend built and deployed

### Quick Deploy

**Backend (Render/Heroku):**
1. Push to GitHub
2. Connect repository
3. Set environment variables
4. Deploy

**Frontend (Vercel/Netlify):**
1. Push to GitHub
2. Connect repository
3. Set `VITE_API_URL`
4. Deploy

**For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**

---

## 💡 Tips & Best Practices

### Development
- Use `npm run dev` for hot reloading
- Check logs in `logs/` directory
- Use MongoDB Compass for database inspection
- Test API with Postman/Insomnia
- Monitor WebSocket connections in browser DevTools

### Production
- Always use HTTPS
- Set `NODE_ENV=production`
- Restrict CORS origins
- Enable rate limiting
- Monitor logs regularly
- Set up automated backups
- Use PM2 for process management
- Configure log rotation

### Security
- Change default admin password
- Use strong JWT secret
- Restrict API access
- Monitor activity logs
- Regular security audits
- Keep dependencies updated

---

## 📞 Support

### Getting Help
1. Check documentation
2. Review logs
3. Check GitHub issues
4. Contact support team

### Reporting Issues
- **GitHub Issues**: For bugs and feature requests
- **Security Issues**: security@telogica.com
- **General Support**: support@telogica.com

---

## 🎓 Learning Resources

### Recommended Reading
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Winston Logger](https://github.com/winstonjs/winston)

### Video Tutorials
- MERN Stack tutorials
- WebSocket implementation
- MongoDB optimization
- React best practices

---

## ✅ Quick Health Check

### Verify Installation

```bash
# Backend health
curl http://localhost:5000

# API health
curl http://localhost:5000/api/products

# WebSocket test
# Open browser DevTools console at http://localhost:5173
```

**Expected Response:**
```json
{
  "message": "Telogica E-Commerce API",
  "version": "3.0.0",
  "status": "running"
}
```

---

## 🎉 You're Ready!

Your Telogica platform is now set up and ready to use!

**Next Steps:**
1. Login as admin
2. Create products
3. Test user registration
4. Explore features
5. Review documentation

**Need Help?** Check the documentation or contact support.

---

**Happy Coding!** 🚀

---

**Version:** 3.0.0  
**Last Updated:** December 6, 2025  
**Status:** Production Ready
