# Testing Guide for Quote-Based Ordering System

## Prerequisites
- MongoDB instance running
- Backend server running on port 5000
- Frontend dev server running on port 5173
- Email credentials configured in `.env`

## Test Scenarios

### 1. Admin Account Setup

**Steps:**
1. Manually create an admin user in MongoDB or update an existing user's role to 'admin'
   ```javascript
   db.users.updateOne(
     { email: "admin@telogica.com" },
     { $set: { role: "admin", isApproved: true } }
   )
   ```
2. Login with admin credentials
3. Verify redirect to `/admin` dashboard

**Expected Results:**
- ✅ Login successful
- ✅ Redirected to admin dashboard
- ✅ Can see Users and Quotes tabs

---

### 2. Regular User Registration and Login

**Test Case 2.1: User Registration**

**Steps:**
1. Navigate to `/register`
2. Fill in the form:
   - Name: Test User
   - Email: user@test.com
   - Password: password123
   - Role: User
   - Phone: 1234567890
   - Address: 123 Test Street
3. Click Register

**Expected Results:**
- ✅ Registration successful
- ✅ Automatically logged in (no admin approval needed)
- ✅ Redirected to home page
- ✅ Token stored in localStorage

**Test Case 2.2: User Login**

**Steps:**
1. Logout if logged in
2. Navigate to `/login`
3. Enter credentials
4. Click Sign In

**Expected Results:**
- ✅ Login successful
- ✅ Redirected to home page
- ✅ User info displayed in header

---

### 3. Regular User - Direct Purchase (≤3 Items)

**Steps:**
1. Login as regular user
2. Browse products on home page
3. Add 1-3 products to cart
4. Navigate to `/cart`
5. Verify cart summary shows correct count
6. Click "Checkout"

**Expected Results:**
- ✅ No warning message about item limit
- ✅ "Checkout" button is visible (not "Request Quote")
- ✅ Can proceed to order creation
- ✅ Order created successfully
- ✅ Cart cleared after order

---

### 4. Regular User - Quote Required (>3 Items)

**Test Case 4.1: Cart with 4+ Items**

**Steps:**
1. Login as regular user
2. Add 4 or more products to cart
3. Navigate to `/cart`

**Expected Results:**
- ✅ Yellow warning banner displayed
- ✅ Banner message: "You have more than 3 items in your cart..."
- ✅ "Request Quote" button shown instead of "Checkout"
- ✅ Cart summary shows 4+ items

**Test Case 4.2: Submit Quote Request**

**Steps:**
1. Continue from Test Case 4.1
2. Click "Request Quote" button
3. On quote page, verify items are displayed
4. Add a message: "Need bulk pricing for these items"
5. Click "Submit Quote Request"

**Expected Results:**
- ✅ Redirected to quote page with all cart items
- ✅ Can add custom message
- ✅ Quote submitted successfully
- ✅ Success message displayed
- ✅ Cart cleared
- ✅ Redirected to user dashboard

**Test Case 4.3: View Pending Quote**

**Steps:**
1. Navigate to `/user-dashboard`
2. Click "My Quotes" tab

**Expected Results:**
- ✅ Quote visible with status "pending"
- ✅ Shows all products with quantities
- ✅ Shows submitted message
- ✅ No admin response yet
- ✅ No action buttons (waiting for admin)

---

### 5. Admin - Manage Quotes

**Test Case 5.1: View Quote Requests**

**Steps:**
1. Login as admin
2. Navigate to `/admin`
3. Click "Quotes" tab

**Expected Results:**
- ✅ All pending quotes visible
- ✅ Shows user name and email
- ✅ Shows user role badge
- ✅ Shows original total price
- ✅ Lists all products with quantities
- ✅ "Respond to Quote" button visible for pending quotes

**Test Case 5.2: Respond to Quote**

**Steps:**
1. Click "Respond to Quote" on a pending quote
2. Enter total price: 850 (assuming original was 1000)
3. Enter discount percentage: 15
4. Enter message: "Special discount approved for bulk order"
5. Click OK on all prompts

**Expected Results:**
- ✅ All three prompts appear
- ✅ Quote status changes to "responded"
- ✅ Admin response section appears
- ✅ Shows offered price, discount %, and message
- ✅ Email sent to user (check email)
- ✅ "Respond" button no longer visible

---

### 6. User - Accept Quote and Purchase

**Test Case 6.1: View Quote Response**

**Steps:**
1. Login as the user who submitted the quote
2. Navigate to `/user-dashboard`
3. Click "My Quotes" tab
4. Check email inbox

**Expected Results:**
- ✅ Quote status shows "responded"
- ✅ Admin response section visible with blue background
- ✅ Shows offered price: $850
- ✅ Shows discount: 15% OFF
- ✅ Shows admin message
- ✅ "Accept" and "Reject" buttons visible
- ✅ Email received with quote details

**Test Case 6.2: Accept Quote**

**Steps:**
1. Click "Accept" button
2. Confirm in dialog

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Quote status changes to "accepted"
- ✅ Success message displayed
- ✅ "Proceed to Checkout" button appears
- ✅ Accept/Reject buttons disappear

**Test Case 6.3: Checkout with Quote**

**Steps:**
1. Click "Proceed to Checkout"
2. (Mock payment would happen here)

**Expected Results:**
- ✅ Order created with discounted price ($850)
- ✅ Order marked as quote-based
- ✅ Discount percentage stored (15%)
- ✅ Quote marked with orderId
- ✅ Success message shown

**Test Case 6.4: Verify Order**

**Steps:**
1. Click "Order History" tab
2. Find the new order

**Expected Results:**
- ✅ Order visible in history
- ✅ Shows total amount: $850
- ✅ Shows discount: 15%
- ✅ Shows as quote-based order
- ✅ All products listed

---

### 7. User - Reject Quote

**Test Case 7.1: Reject Quote**

**Steps:**
1. Login as user with responded quote
2. Navigate to My Quotes
3. Click "Reject" button
4. Confirm in dialog

**Expected Results:**
- ✅ Confirmation dialog appears
- ✅ Quote status changes to "rejected"
- ✅ No action buttons visible
- ✅ Quote cannot be used for ordering

---

### 8. Retailer Registration and Approval

**Test Case 8.1: Retailer Registration**

**Steps:**
1. Navigate to `/register`
2. Fill in form:
   - Name: Test Retailer
   - Email: retailer@test.com
   - Password: password123
   - Role: Retailer
   - Phone: 9876543210
   - Address: 456 Business Ave
3. Click Register

**Expected Results:**
- ✅ Registration successful
- ✅ Alert: "Please wait for admin approval"
- ✅ Redirected to login page
- ✅ NOT automatically logged in

**Test Case 8.2: Attempt Login Before Approval**

**Steps:**
1. Navigate to `/login`
2. Enter retailer credentials
3. Click Sign In

**Expected Results:**
- ✅ Error message: "Account not approved yet"
- ✅ Login fails
- ✅ Not redirected

**Test Case 8.3: Admin Approves Retailer**

**Steps:**
1. Login as admin
2. Navigate to `/admin`
3. Click "Users" tab
4. Find retailer with "Pending" status
5. Click "Approve" button

**Expected Results:**
- ✅ Retailer status changes to "Approved"
- ✅ "Approve" button disappears
- ✅ Email sent to retailer (check email)

**Test Case 8.4: Retailer Login After Approval**

**Steps:**
1. Logout admin
2. Login as retailer

**Expected Results:**
- ✅ Login successful
- ✅ Redirected to home page
- ✅ Can browse products

---

### 9. Retailer - Bulk Ordering

**Test Case 9.1: Add Many Items to Cart**

**Steps:**
1. Login as approved retailer
2. Add 10+ products to cart
3. Navigate to `/cart`

**Expected Results:**
- ✅ NO warning about item limit
- ✅ Shows "Request Quote" button (retailers always quote for discounts)
- ✅ Can add any number of items

**Test Case 9.2: Submit Bulk Quote**

**Steps:**
1. Click "Request Quote"
2. Add message: "Bulk order for wholesale pricing"
3. Submit quote

**Expected Results:**
- ✅ Quote submitted successfully
- ✅ No restrictions on quantity
- ✅ Quote visible in dashboard

**Test Case 9.3: Admin Sees Retailer Badge**

**Steps:**
1. Login as admin
2. View quotes tab

**Expected Results:**
- ✅ Retailer quote shows "retailer" badge
- ✅ Admin can see it's a bulk/wholesale request
- ✅ Can respond with appropriate discount

---

### 10. Edge Cases and Validation

**Test Case 10.1: Empty Cart Checkout**

**Steps:**
1. Navigate to `/cart` with no items
2. Verify empty state

**Expected Results:**
- ✅ Empty cart message displayed
- ✅ "Start Shopping" link visible
- ✅ No checkout button

**Test Case 10.2: Quote Reuse Prevention**

**Steps:**
1. Accept a quote
2. Create order from quote
3. Try to use "Proceed to Checkout" again

**Expected Results:**
- ✅ "Proceed to Checkout" button not visible after order
- ✅ Shows "Order placed successfully" message
- ✅ Backend prevents duplicate order creation

**Test Case 10.3: Quote Without Login**

**Steps:**
1. Logout
2. Add items to cart
3. Try to request quote

**Expected Results:**
- ✅ Redirected to login page
- ✅ Cannot submit quote without authentication

---

## Environment Variables to Test

Verify these are properly configured:

```
PORT=5000
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
RAZORPAY_KEY_ID=test_key
RAZORPAY_KEY_SECRET=test_secret
FRONTEND_URL=http://localhost:5173
MONGO_URI=your-mongodb-uri
JWT_SECRET=your-secret-key
MAX_DIRECT_PURCHASE_ITEMS=3
```

**Test:**
1. Change `MAX_DIRECT_PURCHASE_ITEMS=5`
2. Restart backend
3. Verify users can now buy up to 5 items directly
4. Reset to 3

---

## Performance Tests

### Load Testing (Optional)

**Test Quote System Under Load:**
1. Create 10 users
2. Each submits 5 quotes
3. Admin responds to all
4. Users accept/reject
5. Monitor response times

**Expected:**
- No database errors
- Reasonable response times (<1s)
- All operations complete successfully

---

## Email Notification Checklist

Verify emails are sent for:
- ✅ Admin responds to quote
- ✅ Retailer account approved

Email should contain:
- ✅ Proper HTML formatting
- ✅ No XSS vulnerabilities (no script execution)
- ✅ All user data properly escaped
- ✅ Clear call-to-action

---

## Browser Compatibility

Test on:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (if available)

---

## Mobile Responsiveness

Test on mobile viewport:
- ✅ Cart view
- ✅ Quote submission
- ✅ Dashboard tabs
- ✅ Admin interface

---

## Security Testing

### Manual Security Tests

1. **SQL Injection** (MongoDB NoSQL Injection)
   - Try injecting `{"$gt": ""}` in email field
   - Expected: Sanitized/rejected

2. **XSS in Quotes**
   - Submit quote with message: `<script>alert('XSS')</script>`
   - Check admin dashboard and email
   - Expected: Script tags escaped, not executed

3. **CSRF** (Manual)
   - Try accessing protected routes without token
   - Expected: 401 Unauthorized

4. **Authorization Bypass**
   - Try accessing `/admin` as regular user
   - Expected: Redirected to login
   
   - Try accepting someone else's quote
   - Expected: 403 Forbidden

---

## Database Verification

After testing, verify in MongoDB:

**Users Collection:**
```javascript
// Should have users with different roles
db.users.find({ role: "retailer" })
db.users.find({ role: "admin" })
db.users.find({ role: "user" })
```

**Quotes Collection:**
```javascript
// Should have quotes with various statuses
db.quotes.find({ status: "pending" })
db.quotes.find({ status: "responded" })
db.quotes.find({ status: "accepted" })
db.quotes.find({ status: "rejected" })

// Verify originalPrice is stored
db.quotes.findOne({ "products.originalPrice": { $exists: true } })
```

**Orders Collection:**
```javascript
// Should have both regular and quote-based orders
db.orders.find({ isQuoteBased: true })
db.orders.find({ isQuoteBased: false })

// Verify discount tracking
db.orders.find({ discountApplied: { $gt: 0 } })
```

---

## Rollback Plan

If issues found:
1. Document the issue
2. Check git history: `git log --oneline`
3. Rollback if needed: `git revert <commit-hash>`
4. Report bugs with reproduction steps

---

## Success Criteria

The implementation is successful if:
- ✅ All user roles can register and login
- ✅ Regular users can buy ≤3 items directly
- ✅ Regular users must quote for >3 items
- ✅ Retailers require admin approval
- ✅ Retailers can order bulk without restrictions
- ✅ Quote workflow works end-to-end
- ✅ Email notifications are sent
- ✅ No security vulnerabilities
- ✅ No console errors in frontend
- ✅ No server errors in backend
- ✅ Data persists correctly in database

---

## Known Limitations

1. **Payment Integration**: Razorpay integration is mocked in this version
2. **Rate Limiting**: Not implemented (recommended for production)
3. **Real-time Updates**: Dashboard requires manual refresh
4. **Image Upload**: Product images use URLs, not file uploads

---

## Support

For issues or questions:
1. Check IMPLEMENTATION_GUIDE.md
2. Check SECURITY_SUMMARY.md
3. Review console logs (browser and server)
4. Check MongoDB logs
5. Verify .env configuration
