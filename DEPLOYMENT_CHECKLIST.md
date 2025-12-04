# Production Deployment Checklist

Use this checklist to ensure all steps are completed before deploying to production.

---

## Pre-Deployment

### Code Quality ✅
- [x] All TypeScript errors resolved
- [x] Frontend builds successfully
- [x] Backend starts without errors
- [x] No security vulnerabilities in code (CodeQL verified)
- [x] Dependencies audited and fixed
- [x] Code review completed

### Documentation ✅
- [x] README.md updated with setup instructions
- [x] API documentation complete
- [x] Security analysis documented
- [x] Deployment guide available
- [x] Testing guide available

---

## Backend Deployment

### 1. Environment Setup
- [ ] MongoDB Atlas cluster created and configured
- [ ] Database user credentials created
- [ ] IP whitelist configured (or 0.0.0.0/0 for cloud deployments)
- [ ] Database backups enabled

### 2. Environment Variables
Create a `.env` file with these variables:

```bash
# Server
PORT=5000
NODE_ENV=production

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/telogica?retryWrites=true&w=majority
DB_NAME=telogica

# Security
JWT_SECRET=<64+ character random string>
ADMIN_PASSWORD=<strong secure password>

# Email Service
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
ADMIN_EMAIL=admin@telogica.com

# Payment Gateway
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Frontend
FRONTEND_URL=https://yourdomain.com

# CORS
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Business Logic
MAX_DIRECT_PURCHASE_ITEMS=3
```

**Security Checklist:**
- [ ] JWT_SECRET is at least 64 characters
- [ ] ADMIN_PASSWORD is strong (uppercase, lowercase, numbers, symbols)
- [ ] Email credentials are app-specific passwords (not main password)
- [ ] CORS_ORIGINS set to specific domains (no wildcard)
- [ ] All sensitive values are unique and not from documentation

### 3. Deployment Platform (Choose One)

#### Option A: Render
- [ ] Create new Web Service
- [ ] Connect GitHub repository
- [ ] Set branch to deploy
- [ ] Configure environment variables
- [ ] Set build command: `npm install`
- [ ] Set start command: `npm start`
- [ ] Deploy

#### Option B: Heroku
- [ ] Create new app
- [ ] Connect to GitHub
- [ ] Configure environment variables
- [ ] Add MongoDB add-on or use Atlas
- [ ] Enable automatic deploys
- [ ] Deploy

#### Option C: AWS EC2
- [ ] Launch EC2 instance
- [ ] Install Node.js
- [ ] Clone repository
- [ ] Install dependencies
- [ ] Set up PM2 for process management
- [ ] Configure nginx reverse proxy
- [ ] Set up SSL certificate
- [ ] Configure firewall rules

### 4. Post-Deployment
- [ ] Create admin user: `npm run seed:admin`
- [ ] Test API health endpoint
- [ ] Verify database connection
- [ ] Test email sending
- [ ] Check error logs
- [ ] Set up monitoring (e.g., Sentry)

---

## Frontend Deployment

### 1. Environment Variables
Create `.env` file:

```bash
VITE_API_URL=https://your-backend-domain.com
```

### 2. Build
```bash
cd Frontend
npm install
npm run build
```

Verify build:
- [ ] Build completes successfully
- [ ] No errors in console
- [ ] `dist` folder created

### 3. Deployment Platform (Choose One)

#### Option A: Vercel (Recommended)
- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Run `vercel` in Frontend directory
- [ ] Configure project settings
- [ ] Add environment variable: VITE_API_URL
- [ ] Deploy to production: `vercel --prod`

#### Option B: Netlify
- [ ] Create new site from Git
- [ ] Connect GitHub repository
- [ ] Set build command: `npm run build`
- [ ] Set publish directory: `dist`
- [ ] Add environment variable: VITE_API_URL
- [ ] Deploy

#### Option C: AWS S3 + CloudFront
- [ ] Create S3 bucket
- [ ] Enable static website hosting
- [ ] Upload `dist` folder contents
- [ ] Create CloudFront distribution
- [ ] Configure custom domain
- [ ] Set up SSL certificate

### 4. Post-Deployment
- [ ] Test website loads
- [ ] Verify API connection
- [ ] Test login/registration
- [ ] Check all pages load correctly
- [ ] Test responsive design

---

## Security Hardening

### Backend
- [ ] Install helmet.js: `npm install helmet`
  ```javascript
  const helmet = require('helmet');
  app.use(helmet());
  ```

- [ ] Add rate limiting: `npm install express-rate-limit`
  ```javascript
  const rateLimit = require('express-rate-limit');
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
  });
  app.use(limiter);
  ```

- [ ] Add MongoDB sanitization: `npm install express-mongo-sanitize`
  ```javascript
  const mongoSanitize = require('express-mongo-sanitize');
  app.use(mongoSanitize());
  ```

- [ ] Update CORS to specific origins (remove wildcard)

- [ ] Enable HTTPS only

### Frontend
- [ ] Configure security headers in hosting platform
- [ ] Enable HTTPS
- [ ] Set up custom domain with SSL

### Both
- [ ] Change default admin password immediately after first login
- [ ] Set up monitoring and error tracking
- [ ] Configure backup strategy
- [ ] Set up alerts for critical errors

---

## Testing in Production

### Functional Tests
- [ ] User registration works
- [ ] User login works
- [ ] Product listing loads
- [ ] Add to cart works
- [ ] 3-item limit enforced
- [ ] Quote request works
- [ ] Admin login works
- [ ] Admin dashboard accessible
- [ ] Email notifications sent
- [ ] Payment flow works (with test keys first)

### Security Tests
- [ ] Cannot access admin routes as regular user
- [ ] Cannot access other users' data
- [ ] SQL injection attempts blocked
- [ ] XSS attempts blocked
- [ ] Rate limiting works
- [ ] HTTPS enforced

### Performance Tests
- [ ] Page load times acceptable
- [ ] API response times good
- [ ] Database queries optimized
- [ ] Images load quickly
- [ ] Mobile performance acceptable

---

## Monitoring & Maintenance

### Set Up Monitoring
- [ ] Error tracking (Sentry, LogRocket)
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Performance monitoring (New Relic, DataDog)
- [ ] Analytics (Google Analytics, Mixpanel)

### Configure Alerts
- [ ] Server down alerts
- [ ] High error rate alerts
- [ ] Database issues alerts
- [ ] Payment failures alerts
- [ ] Low disk space alerts

### Backup Strategy
- [ ] Automated daily database backups
- [ ] Test backup restoration monthly
- [ ] Store backups in separate location
- [ ] Document recovery procedure

### Maintenance Schedule
- [ ] Weekly: Review error logs
- [ ] Monthly: Update dependencies
- [ ] Quarterly: Security audit
- [ ] Annually: Comprehensive review

---

## Go-Live Checklist

### Final Verification
- [ ] All environment variables set correctly
- [ ] Admin user created and tested
- [ ] Email notifications working
- [ ] Payment gateway configured
- [ ] Database indexes created
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] SSL certificates installed
- [ ] Custom domain configured
- [ ] DNS records updated

### Communication
- [ ] Notify stakeholders of go-live date
- [ ] Prepare user documentation
- [ ] Create support contact method
- [ ] Prepare FAQ document

### Launch
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Verify everything works
- [ ] Monitor for first 24 hours closely
- [ ] Be ready to rollback if needed

---

## Post-Launch

### First 24 Hours
- [ ] Monitor error logs continuously
- [ ] Check server performance
- [ ] Verify all features working
- [ ] Respond to any issues immediately

### First Week
- [ ] Collect user feedback
- [ ] Monitor usage patterns
- [ ] Identify and fix any bugs
- [ ] Optimize based on real usage

### First Month
- [ ] Review analytics
- [ ] Assess performance metrics
- [ ] Plan improvements
- [ ] Update documentation based on learnings

---

## Rollback Plan

If critical issues occur:

1. **Immediate Actions**
   - [ ] Put up maintenance page
   - [ ] Notify users of issue
   - [ ] Stop incoming traffic

2. **Assess Situation**
   - [ ] Identify the problem
   - [ ] Determine severity
   - [ ] Decide: fix forward or rollback

3. **Rollback Steps** (if needed)
   - [ ] Revert to previous backend version
   - [ ] Revert to previous frontend version
   - [ ] Restore database from backup (if corrupted)
   - [ ] Update DNS if needed

4. **Recovery**
   - [ ] Fix the issue in staging
   - [ ] Test thoroughly
   - [ ] Re-deploy when ready
   - [ ] Document the incident

---

## Success Criteria

Your deployment is successful when:

- ✅ All features work as expected
- ✅ No critical errors in logs
- ✅ Response times are acceptable
- ✅ Users can register and login
- ✅ Orders can be placed
- ✅ Emails are being sent
- ✅ Admin dashboard is functional
- ✅ Payment processing works
- ✅ Security measures are in place
- ✅ Monitoring is active

---

## Support Contacts

Maintain a list of contacts for production issues:

- **Hosting Provider Support**: [Contact Info]
- **Database Provider Support**: [Contact Info]
- **Email Service Support**: [Contact Info]
- **Payment Gateway Support**: [Contact Info]
- **Development Team**: [Contact Info]
- **System Administrator**: [Contact Info]

---

## Notes

Use this section to track deployment-specific information:

- Deployment Date: __________
- Backend URL: __________
- Frontend URL: __________
- Database: __________
- Special Configurations: __________
- Known Issues: __________

---

**Remember**: Always test in a staging environment that mirrors production before deploying to production!
