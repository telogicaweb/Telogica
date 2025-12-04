# Admin Dashboard Troubleshooting Guide

## Issue: "I didn't see nothing in the admin side"

### Quick Solution Steps:

## Step 1: Login as Admin

You need to login with an admin account first.

### Option A: Use Existing Admin Account (if you have one)
1. Go to http://localhost:5174/login
2. Login with your admin credentials
3. Go to http://localhost:5174/admin

### Option B: Create Admin Account Using MongoDB

Since regular registration creates users with role "user" or "retailer", you need to manually change a user to admin role in MongoDB:

1. **Open MongoDB Compass** or **MongoDB Shell**

2. **Connect to your database** (check your Backend/.env for connection string)

3. **Find the users collection**

4. **Update a user to be admin:**
   ```javascript
   db.users.updateOne(
     { email: "your-email@example.com" },
     { $set: { role: "admin", isApproved: true } }
   )
   ```

5. **Or create a new admin user directly:**
   ```javascript
   // First, you'll need to hash a password
   // The backend uses bcrypt, so it's easier to register normally and then update the role
   
   // Register a normal account at http://localhost:5174/register
   // Then update it in MongoDB:
   db.users.updateOne(
     { email: "admin@telogica.com" },
     { $set: { role: "admin", isApproved: true } }
   )
   ```

### Option C: Quick Admin User Creation Script

Create this file in your Backend folder:

**Backend/createAdmin.js**
\`\`\`javascript
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI);

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  isApproved: Boolean,
  phone: String,
  address: String
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@telogica.com',
      password: hashedPassword,
      role: 'admin',
      isApproved: true,
      phone: '1234567890',
      address: 'Admin Office'
    });
    
    console.log('Admin user created successfully!');
    console.log('Email: admin@telogica.com');
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();
\`\`\`

Then run:
\`\`\`bash
cd Backend
node createAdmin.js
\`\`\`

Then login with:
- Email: admin@telogica.com
- Password: admin123

---

## Step 2: Check If Backend is Running

Your backend is already running on port 5000 ✅

## Step 3: Check If Frontend is Running

Your frontend is running on port 5174 ✅

## Step 4: Access Admin Dashboard

1. Go to: http://localhost:5174/login
2. Login with admin credentials
3. Navigate to: http://localhost:5174/admin
4. You should see these tabs:
   - Dashboard
   - Products
   - Users
   - Quotes
   - Orders
   - Warranties
   - **Content** ← Click this tab!
   - Email Logs

## Step 5: Access Content Management

Once logged in as admin:
1. Click the **"Content"** tab
2. You'll see 6 cards:
   - Blog Posts → Manage Blogs
   - Team Members → Manage Team
   - Events → Manage Events
   - Reports → Manage Reports
   - Page Content → Edit Content
   - Home Stats → Update Stats

---

## Common Issues & Solutions

### Issue: Redirected to Login Page
**Solution:** You're not logged in. Login first.

### Issue: Redirected to Home Page
**Solution:** You're logged in but not as admin. Update your user role in MongoDB.

### Issue: Blank/White Screen
**Solution:** Check browser console (F12) for errors. Most likely:
- Backend API not responding
- Missing authentication token
- CORS issues

### Issue: "Error Loading Dashboard"
**Solution:** 
- Backend server not running → Start with `npm start` in Backend folder
- MongoDB not connected → Check MongoDB connection string
- .env file incorrect → Verify VITE_API_URL=http://localhost:5000

### Issue: Can't See Content Tab
**Solution:** 
- Make sure you're logged in as admin
- Refresh the page (Ctrl+R)
- Clear browser cache
- Check if activeTab state is working

---

## Current Status

✅ Backend running on port 5000
✅ Frontend running on port 5174
✅ MongoDB connected
✅ All admin routes created
✅ Content management pages created

❓ Need to verify: Admin user exists and you're logged in

---

## Next Steps

1. **Create/Login as admin** (see options above)
2. **Go to** http://localhost:5174/admin
3. **Click "Content" tab** to see the content management options
4. **Test each management page** by clicking the buttons

If you still don't see anything, please:
1. Open browser console (F12)
2. Check for any red errors
3. Share the error messages
