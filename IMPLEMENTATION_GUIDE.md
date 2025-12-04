# MERN Stack E-Commerce Quote System - Implementation Guide

## Overview
This document describes the implementation of a quote-based ordering system for a MERN stack e-commerce application with three distinct user roles: Admin, User, and Retailer.

## User Roles & Capabilities

### 1. Admin
- Full access to the admin dashboard
- Can view and manage all users (including pending retailer approvals)
- Can view all quote requests from users and retailers
- Can respond to quotes with discounted pricing
- Can set custom discount percentages and total prices

### 2. User (Regular User)
- Can browse and view all products
- **Purchase Limits:**
  - Can buy up to 3 items directly with payment (no restrictions)
  - For orders with more than 3 items, must request a quote
- **Quote Workflow:**
  1. Add items to cart (> 3 items triggers quote requirement)
  2. Submit quote request with optional message
  3. Receive email notification when admin responds
  4. Accept or reject the quote
  5. If accepted, can proceed to checkout with discounted price
- Can view order history and quote status in dashboard

### 3. Retailer
- **Registration:** Requires admin approval before login is allowed
- **Bulk Ordering:**
  - Can request quotes for bulk purchases without the 3-item restriction
  - Always goes through quote workflow to get wholesale/bulk discounts
  - No restrictions on quantity per order once approved
- Can view order history and quote status in dashboard

## Key Features Implemented

### Backend Features

#### 1. Enhanced Models

**Quote Model (`Backend/models/Quote.js`):**
- Stores product information with original prices
- Tracks quote status: pending → responded → accepted/rejected
- Includes admin response with:
  - Total discounted price
  - Discount percentage
  - Custom message
  - Response timestamp
- Links to order when quote is converted

**Order Model (`Backend/models/Order.js`):**
- Supports quote-based orders with `quoteId` reference
- Tracks discount information
- Differentiates between regular and quote-based orders

**User Model (`Backend/models/User.js`):**
- Three roles: admin, user, retailer
- Auto-approval for admin and regular users
- Retailers require manual approval (`isApproved` flag)

#### 2. API Endpoints

**Quote Management:**
- `POST /api/quotes` - Create new quote (Protected)
- `GET /api/quotes` - Get quotes (Admin sees all, users see own)
- `PUT /api/quotes/:id/respond` - Admin responds with pricing (Admin only)
- `PUT /api/quotes/:id/accept` - User/Retailer accepts quote (Protected)
- `PUT /api/quotes/:id/reject` - User/Retailer rejects quote (Protected)

**Order Creation:**
- `POST /api/orders` - Create order with validation:
  - Enforces 3-item limit for regular users without quote
  - Validates quote acceptance before allowing quote-based orders
  - Prevents duplicate orders from same quote

**User Management:**
- `PUT /api/auth/approve/:id` - Admin approves retailer (Admin only)
- `GET /api/auth/users` - Get all users (Admin only)

#### 3. Email Notifications

**Quote Response Email:**
- Sent when admin responds to a quote
- Includes discount percentage, total price, and message
- Formatted in both text and HTML

**Retailer Approval Email:**
- Sent when admin approves a retailer account
- Notifies user they can now login

### Frontend Features

#### 1. Shopping Cart (`Frontend/src/pages/Cart.tsx`)
- Displays item count warning for regular users
- Shows alert when cart has > 3 items
- Redirects to quote page instead of checkout for bulk orders
- Different behavior for retailers (no restrictions)

#### 2. Quote Request Page (`Frontend/src/pages/Quote.tsx`)
- Shows items from cart or quote list
- Allows adding custom message/requirements
- Visual feedback for quote submission
- Enhanced UI with product images and details

#### 3. User Dashboard (`Frontend/src/pages/UserDashboard.tsx`)
- **Orders Tab:**
  - Shows all orders with status
  - Displays discount information for quote-based orders
  - Order history with detailed product information

- **Quotes Tab:**
  - Shows all quote requests with status
  - Displays admin responses with pricing details
  - Action buttons to accept/reject quotes
  - "Proceed to Checkout" for accepted quotes
  - Visual indicators for quote conversion to orders

#### 4. Admin Dashboard (`Frontend/src/pages/AdminDashboard.tsx`)
- **Users Tab:**
  - Lists all users with role badges
  - Shows approval status
  - "Approve" button for pending retailers

- **Quotes Tab:**
  - Shows all quote requests from all users
  - Displays user role (User vs Retailer)
  - Shows original total and product details
  - Input prompts for setting discount price and percentage
  - Status indicators (pending, responded, accepted, rejected)
  - Shows conversion status when quote becomes an order

## Workflow Examples

### Example 1: Regular User Buying 3 or Fewer Items
1. User browses products on home page
2. Adds 1-3 items to cart
3. Clicks "Checkout"
4. Proceeds directly to payment (Razorpay integration)
5. Order is created and user receives confirmation

### Example 2: Regular User Buying More Than 3 Items
1. User adds 4+ items to cart
2. Cart shows warning message about 3-item limit
3. "Checkout" button is replaced with "Request Quote" button
4. User clicks "Request Quote"
5. Quote page shows all cart items
6. User adds optional message about requirements
7. Submits quote request
8. Admin receives notification (dashboard shows pending quote)
9. Admin reviews quote and responds with:
   - Discounted total price
   - Discount percentage
   - Custom message
10. User receives email notification
11. User logs in and sees quote in dashboard
12. User clicks "Accept" on the quote
13. Quote status changes to "accepted"
14. User clicks "Proceed to Checkout"
15. Order is created with discounted price
16. User proceeds to payment

### Example 3: Retailer Registration and Bulk Order
1. New retailer registers with role "Retailer"
2. Registration successful but login is blocked (not approved)
3. Admin sees pending retailer in dashboard
4. Admin clicks "Approve" button
5. Retailer receives approval email
6. Retailer can now login
7. Retailer browses products
8. Adds any quantity of items (no 3-item restriction)
9. Requests quote for bulk pricing
10. Admin responds with wholesale discount
11. Retailer accepts quote
12. Proceeds to checkout with discounted price

## Technical Implementation Details

### 3-Item Purchase Limit Enforcement

**Backend Validation:**
```javascript
if (req.user.role === 'user' && !quoteId && products.length > 3) {
  return res.status(400).json({ 
    message: 'Regular users can only purchase up to 3 items directly. Please request a quote for larger orders.',
    requiresQuote: true
  });
}
```

**Frontend Cart Logic:**
```typescript
const requiresQuote = user?.role === 'user' && cart.length > 3;
```

### Quote-Based Order Creation

**Order Controller Logic:**
```javascript
// If order is based on a quote, verify and use quote price
if (quoteId) {
  const quote = await Quote.findById(quoteId);
  
  // Validation checks
  if (quote.status !== 'accepted') {
    return res.status(400).json({ message: 'Quote must be accepted before creating an order' });
  }
  
  if (quote.orderId) {
    return res.status(400).json({ message: 'Quote has already been used for an order' });
  }
  
  // Use quote pricing
  finalAmount = quote.adminResponse.totalPrice;
  discountApplied = quote.adminResponse.discountPercentage;
}
```

## Security Considerations

1. **Role-based Access Control:**
   - Middleware checks user role before allowing access to endpoints
   - Admin-only routes protected with `admin` middleware
   - Quote acceptance limited to quote owner

2. **Quote Validation:**
   - Prevents quote reuse (one quote = one order)
   - Validates quote status before order creation
   - Ensures user owns the quote before accepting

3. **Purchase Limit Enforcement:**
   - Backend validation prevents bypassing frontend checks
   - Retailer role exempt from 3-item limit
   - Quote-based orders properly validated

## Email Configuration

Email notifications require proper configuration in `.env`:

```
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Database Schema Changes

### Quote Schema Updates
- Added `originalPrice` to product items
- Added `totalPrice`, `discountPercentage`, `respondedAt` to adminResponse
- Added `acceptedAt` timestamp
- Added `orderId` reference

### Order Schema Updates
- Added `quoteId` reference
- Added `isQuoteBased` boolean flag
- Added `discountApplied` field

## Testing Recommendations

1. **Test User Flow:**
   - Create user account
   - Add 1-3 items and checkout directly
   - Add 4+ items and verify quote requirement
   - Submit quote and verify email notification
   - Accept quote and complete purchase

2. **Test Retailer Flow:**
   - Register as retailer
   - Verify login is blocked
   - Admin approves retailer
   - Login and verify bulk ordering capability
   - Request quote without item restrictions

3. **Test Admin Flow:**
   - View all users and approve retailers
   - View all quotes with proper filtering
   - Respond to quotes with custom pricing
   - Verify email notifications sent

## Future Enhancements

1. **Payment Integration:**
   - Complete Razorpay integration for actual payments
   - Handle payment failures and retries

2. **Quote Negotiation:**
   - Allow users to counter-offer on quotes
   - Multiple rounds of negotiation

3. **Automated Discounts:**
   - Bulk discount rules based on quantity
   - Tiered pricing for retailers

4. **Advanced Notifications:**
   - SMS notifications for critical updates
   - In-app notification system

5. **Analytics Dashboard:**
   - Quote conversion rates
   - Average discount percentages
   - Sales by user role

## Conclusion

This implementation provides a complete quote-based ordering system with proper role separation, purchase limits, and discount management. The system is designed to be scalable and can be extended with additional features as needed.
