# Email Service Deployment Fix - CORS Issue Resolved

## Problem Identified
The email API works in Postman but fails from the deployed frontend due to:
1. ❌ CORS configuration not properly handling wildcard (`*`)
2. ❌ Trailing slash in `EMAIL_SERVICE_URL` in Backend `.env`
3. ❌ Missing `vercel.json` configuration for EmailService deployment
4. ❌ CORS credentials not enabled

## Fixes Applied

### 1. EmailService/server.js - CORS Fix
Updated CORS configuration to:
- Properly handle wildcard (`*`) for all origins
- Allow requests with no origin (Postman, mobile apps)
- Enable credentials for cross-origin requests

### 2. Backend/.env - URL Fix
```env
# BEFORE (Wrong - had trailing slash)
EMAIL_SERVICE_URL=https://telogica-mail-service.vercel.app/

# AFTER (Correct)
EMAIL_SERVICE_URL=https://telogica-mail-service.vercel.app
```

### 3. EmailService/vercel.json - NEW FILE
Created Vercel configuration with:
- Proper routing to `server.js`
- CORS headers for all API routes
- Production environment settings

### 4. EmailService/.env - Simplified CORS
```env
# BEFORE
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000,https://telogica-lac.vercel.app,*

# AFTER (Simpler - just wildcard)
ALLOWED_ORIGINS=*
```

## Deployment Steps

### Step 1: Redeploy EmailService to Vercel

**Option A: Using Vercel CLI**
```powershell
cd EmailService
vercel --prod
```

**Option B: Using Git Push (if connected to GitHub)**
```powershell
git add EmailService/
git commit -m "fix: CORS configuration and add vercel.json"
git push origin main
```

Then in Vercel Dashboard → Telogica Email Service → Deployments → Redeploy

### Step 2: Update Environment Variables in Vercel

Go to Vercel Dashboard → Your EmailService Project → Settings → Environment Variables

**Add/Update these variables:**
```
PORT=5001
NODE_ENV=production
EMAIL_SERVICE=gmail
EMAIL_USER=telogicaweb@gmail.com
EMAIL_PASS=yuis lgyt qfim odti
EMAIL_FROM_NAME=Telogica
MONGODB_URI=mongodb+srv://telogicaweb_db_user:20QPL6ImQUwM6jIo@cluster0.oe3jl52.mongodb.net/?appName=Cluster0
ALLOWED_ORIGINS=*
```

**Important:** After adding/updating variables, click **"Redeploy"** to apply them.

### Step 3: Restart Backend (if deployed)

If your backend is deployed to Vercel/other platform:
1. Ensure the updated `.env` is deployed (without trailing slash)
2. Redeploy or restart the backend service

### Step 4: Test from Frontend

After redeployment, test email functionality from your deployed frontend:
1. Try registration (welcome email)
2. Try placing an order (order confirmation)
3. Try payment (payment success email)

## Verification

### Test 1: Health Check
```bash
curl https://telogica-mail-service.vercel.app/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "Email Service",
  "timestamp": "2025-12-07T..."
}
```

### Test 2: CORS Preflight
```bash
curl -X OPTIONS https://telogica-mail-service.vercel.app/api/email/send \
  -H "Origin: https://telogica-lac.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

**Look for these headers in response:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET,OPTIONS,PATCH,DELETE,POST,PUT
Access-Control-Allow-Credentials: true
```

### Test 3: Send Email from Frontend
Open browser console on your deployed frontend and test:
```javascript
fetch('https://telogica-mail-service.vercel.app/api/email/send-template', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: 'test@example.com',
    templateType: 'welcome',
    templateData: { userName: 'Test User' }
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

## Common Issues & Solutions

### Issue 1: Still getting CORS errors
**Solution:** 
- Clear browser cache and hard refresh (Ctrl+Shift+R)
- Ensure Vercel deployment completed successfully
- Check Vercel logs for errors

### Issue 2: Environment variables not applying
**Solution:**
- After updating env vars in Vercel, you MUST redeploy
- Don't just update - click "Redeploy" button

### Issue 3: 404 errors on API routes
**Solution:**
- Ensure `vercel.json` is in the EmailService root directory
- Check Vercel build logs for routing errors

### Issue 4: Emails still not sending
**Solution:**
- Check EmailService logs in Vercel dashboard
- Verify MongoDB connection string is correct
- Verify Gmail app password is valid

## Environment Variables Checklist

### EmailService (Vercel Dashboard)
- [x] PORT=5001
- [x] NODE_ENV=production
- [x] EMAIL_SERVICE=gmail
- [x] EMAIL_USER=telogicaweb@gmail.com
- [x] EMAIL_PASS=yuis lgyt qfim odti
- [x] EMAIL_FROM_NAME=Telogica
- [x] MONGODB_URI=(your connection string)
- [x] ALLOWED_ORIGINS=*

### Backend
- [x] EMAIL_SERVICE_URL=https://telogica-mail-service.vercel.app (no trailing slash)

## Success Indicators

✅ Postman requests work
✅ Frontend requests work
✅ CORS headers present in response
✅ No browser console CORS errors
✅ Emails delivered successfully
✅ Email logs saved in MongoDB

## Next Steps After Deployment

1. Test all email templates from frontend
2. Monitor Vercel logs for any errors
3. Check MongoDB for email logs
4. Verify email delivery to actual email addresses

## Support

If issues persist after following these steps:
1. Check Vercel deployment logs
2. Check browser network tab for actual error
3. Verify all environment variables are set correctly
4. Ensure no firewall/network issues blocking requests
