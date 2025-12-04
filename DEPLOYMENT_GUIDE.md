# Deployment Guide for Telogica

This guide covers the deployment process for both the frontend (Vercel) and backend (Render) of the Telogica e-commerce platform.

## Prerequisites

- GitHub repository access
- Vercel account (for frontend)
- Render account (for backend)
- MongoDB Atlas account (for database)

## Backend Deployment (Render)

### Current Production URL
`https://telogica.onrender.com`

### Environment Variables Required

Set the following environment variables in Render dashboard:

```
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=YourCluster
DB_NAME=telogica
JWT_SECRET=your_secure_jwt_secret
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
ADMIN_EMAIL=admin@telogica.com
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
FRONTEND_URL=https://telogica-p7tf.vercel.app
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CORS_ORIGINS=*
MAX_DIRECT_PURCHASE_ITEMS=3
```

### Deployment Steps

1. **Connect Repository to Render**
   - Go to Render Dashboard
   - Create New Web Service
   - Connect GitHub repository
   - Select `Backend` directory as root

2. **Configure Build Settings**
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node

3. **Set Environment Variables**
   - Add all variables listed above in Render dashboard
   - **IMPORTANT**: Make sure `FRONTEND_URL` is set to your Vercel production URL

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete

### Post-Deployment Verification

Test the following endpoints:

```bash
# Check API is running
curl https://telogica.onrender.com/

# Test registration (should return 400 for missing data)
curl -X POST https://telogica.onrender.com/api/auth/register \
  -H "Content-Type: application/json"

# Test login (should return 400 for missing data)
curl -X POST https://telogica.onrender.com/api/auth/login \
  -H "Content-Type: application/json"
```

## Frontend Deployment (Vercel)

### Current Production URL
`https://telogica-p7tf.vercel.app/`

### Environment Variables Required

Create a `.env` file in the Frontend directory or set in Vercel dashboard:

```
VITE_API_URL=https://telogica.onrender.com
```

### Deployment Steps

1. **Connect Repository to Vercel**
   - Go to Vercel Dashboard
   - Import Project from GitHub
   - Select the repository
   - Select `Frontend` directory as root

2. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Environment Variables**
   - Add `VITE_API_URL` with backend URL
   - **IMPORTANT**: Must start with `VITE_` for Vite to expose it

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete

### Post-Deployment Verification

1. Open `https://telogica-p7tf.vercel.app/` in browser
2. Check browser console for any errors
3. Test navigation to Login and Register pages
4. Open Network tab and verify API calls are going to correct backend URL

## Common Issues and Solutions

### Issue: CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- API requests fail with "blocked by CORS policy"

**Solution:**
1. Verify `FRONTEND_URL` in backend `.env` matches your Vercel URL
2. Check that backend CORS configuration includes your frontend URL
3. Ensure credentials are enabled in CORS config

### Issue: 401 Unauthorized Errors

**Symptoms:**
- Login/Register returns 401 errors
- Protected routes fail

**Solution:**
1. Verify JWT_SECRET is set in backend environment
2. Check that frontend is sending token in Authorization header
3. Verify token format is `Bearer <token>`

### Issue: 404 Not Found on API Calls

**Symptoms:**
- Frontend makes requests to wrong URL
- API endpoints return 404

**Solution:**
1. Verify `VITE_API_URL` is set in Vercel environment variables
2. Check that API base URL doesn't have trailing slash
3. Rebuild and redeploy frontend after changing env vars

### Issue: Database Connection Errors

**Symptoms:**
- Backend logs show MongoDB connection errors
- 500 errors on all API calls

**Solution:**
1. Verify MongoDB URI is correct in Render environment
2. Check MongoDB Atlas network access allows Render's IP
3. Verify database user credentials are correct

### Issue: Email Notifications Not Working

**Symptoms:**
- Registration succeeds but no emails sent
- Admin notifications missing

**Solution:**
1. Verify `EMAIL_USER` and `EMAIL_PASS` are set correctly
2. For Gmail, use App Password not regular password
3. Check `ADMIN_EMAIL` is set correctly
4. Note: Email failures don't block registration/login

## Environment Variables Reference

### Backend (Render)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| PORT | Server port | No (defaults to 5000) | 5000 |
| MONGO_URI | MongoDB connection string | Yes | mongodb+srv://... |
| DB_NAME | Database name | Yes | telogica |
| JWT_SECRET | Secret for JWT tokens | Yes | your_secret_key |
| EMAIL_SERVICE | Email service provider | Yes | gmail |
| EMAIL_USER | Email sender address | Yes | email@gmail.com |
| EMAIL_PASS | Email password/app password | Yes | xxxx xxxx xxxx xxxx |
| ADMIN_EMAIL | Admin notification email | Yes | admin@telogica.com |
| FRONTEND_URL | Frontend production URL | Yes | https://telogica-p7tf.vercel.app |
| RAZORPAY_KEY_ID | Payment gateway key | Yes | rzp_... |
| RAZORPAY_KEY_SECRET | Payment gateway secret | Yes | ... |
| CLOUDINARY_CLOUD_NAME | Image storage cloud name | Yes | your_cloud_name |
| CLOUDINARY_API_KEY | Cloudinary API key | Yes | ... |
| CLOUDINARY_API_SECRET | Cloudinary API secret | Yes | ... |
| MAX_DIRECT_PURCHASE_ITEMS | Max items for direct purchase | No (defaults to 3) | 3 |

### Frontend (Vercel)

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| VITE_API_URL | Backend API URL | Yes | https://telogica.onrender.com |

## Development vs Production

### Local Development

**Backend (.env):**
```
FRONTEND_URL=http://localhost:5173
# ... other vars
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:5000
```

### Production

**Backend (Render env vars):**
```
FRONTEND_URL=https://telogica-p7tf.vercel.app
# ... other vars
```

**Frontend (Vercel env vars):**
```
VITE_API_URL=https://telogica.onrender.com
```

## Monitoring and Logs

### Backend (Render)
- Access logs from Render dashboard
- Check for MongoDB connection errors
- Monitor for CORS issues
- Watch for authentication errors

### Frontend (Vercel)
- Check Vercel deployment logs
- Monitor browser console for errors
- Use Network tab to debug API calls
- Check for environment variable issues

## Security Checklist

- [ ] JWT_SECRET is strong and unique
- [ ] MongoDB URI credentials are secure
- [ ] Email password is an App Password, not account password
- [ ] .env files are not committed to git
- [ ] CORS is configured to allow only trusted origins
- [ ] All sensitive credentials are environment variables
- [ ] MongoDB Atlas has IP whitelist configured
- [ ] Render environment variables are properly set
- [ ] Frontend environment variables are prefixed with VITE_

## Support

If you encounter issues:

1. Check the Common Issues section above
2. Review server logs in Render dashboard
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly
5. Test API endpoints directly using curl or Postman
6. Ensure both frontend and backend are using latest deployment

## Rollback Procedure

If a deployment causes issues:

1. **Render (Backend)**
   - Go to Render dashboard
   - Find the previous successful deployment
   - Click "Redeploy"

2. **Vercel (Frontend)**
   - Go to Vercel dashboard
   - Find the previous successful deployment
   - Click "Promote to Production"
