# Telogica API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

Request body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user | retailer | admin",
  "phone": "1234567890",
  "address": "123 Main St"
}
```

### Login
**POST** `/auth/login`

Request body:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Profile
**GET** `/auth/profile` (Protected)

### Get All Users
**GET** `/auth/users` (Admin only)

### Approve Retailer
**PUT** `/auth/approve/:id` (Admin only)

---

## Product Endpoints

### Get All Products
**GET** `/products`

### Get Product by ID
**GET** `/products/:id`

### Create Product
**POST** `/products` (Admin only)

Request body:
```json
{
  "name": "Product Name",
  "description": "Product description",
  "images": ["url1", "url2"],
  "price": 999,
  "retailerPrice": 899,
  "category": "Electronics",
  "stock": 10,
  "offlineStock": 5,
  "isRecommended": true,
  "specifications": {
    "color": "Black",
    "weight": "1kg"
  },
  "warrantyPeriodMonths": 12,
  "requiresQuote": false
}
```

### Update Product
**PUT** `/products/:id` (Admin only)

### Delete Product
**DELETE** `/products/:id` (Admin only)

---

## Product Unit Endpoints

### Add Product Units
**POST** `/product-units/add` (Admin only)

Request body:
```json
{
  "productId": "product_id",
  "units": [
    {
      "serialNumber": "SN123456",
      "modelNumber": "MODEL-A",
      "warrantyPeriodMonths": 12,
      "manufacturingDate": "2024-01-01",
      "stockType": "both | online | offline"
    }
  ]
}
```

### Get Product Units
**GET** `/product-units/product/:productId` (Admin only)

Query params: `status`, `stockType`

### Get Available Units
**GET** `/product-units/available/:productId` (Protected)

Query params: `quantity`, `stockType`

### Update Product Unit
**PUT** `/product-units/:id` (Admin only)

### Get Unit by Serial Number
**GET** `/product-units/serial/:serialNumber` (Protected)

---

## Quote Endpoints

### Create Quote
**POST** `/quotes` (Protected)

Request body:
```json
{
  "products": [
    {
      "product": "product_id",
      "quantity": 2
    }
  ],
  "message": "Need bulk pricing for these items"
}
```

### Get Quotes
**GET** `/quotes` (Protected)
- Admin sees all quotes
- Users see only their quotes

### Respond to Quote
**PUT** `/quotes/:id/respond` (Admin only)

Request body:
```json
{
  "totalPrice": 1800,
  "discountPercentage": 10,
  "message": "Special discount applied"
}
```

### Accept Quote
**PUT** `/quotes/:id/accept` (Protected)

### Reject Quote
**PUT** `/quotes/:id/reject` (Protected)

---

## Order Endpoints

### Create Order
**POST** `/orders` (Protected)

Request body:
```json
{
  "products": [
    {
      "product": "product_id",
      "quantity": 2,
      "price": 999
    }
  ],
  "totalAmount": 1998,
  "shippingAddress": "123 Main St",
  "quoteId": "quote_id (optional)"
}
```

### Verify Payment
**POST** `/orders/verify` (Protected)

Request body:
```json
{
  "orderId": "order_id",
  "razorpayPaymentId": "pay_xxx",
  "razorpaySignature": "signature_xxx"
}
```

### Get My Orders
**GET** `/orders/myorders` (Protected)

### Get All Orders
**GET** `/orders` (Admin only)

---

## Warranty Endpoints

### Register Warranty
**POST** `/warranties` (Protected)

Request body:
```json
{
  "productId": "product_id",
  "productName": "Product Name",
  "modelNumber": "MODEL-A",
  "serialNumber": "SN123456",
  "purchaseDate": "2024-01-01",
  "purchaseType": "telogica_online | telogica_offline | retailer",
  "invoice": "invoice_url (required for offline/retailer)"
}
```

### Get User Warranties
**GET** `/warranties/my-warranties` (Protected)

### Get All Warranties
**GET** `/warranties` (Admin only)

Query params: `status`

### Approve Warranty
**PUT** `/warranties/:id/approve` (Admin only)

Request body:
```json
{
  "warrantyStartDate": "2024-01-01",
  "warrantyEndDate": "2025-01-01",
  "adminNotes": "Approved"
}
```

### Reject Warranty
**PUT** `/warranties/:id/reject` (Admin only)

Request body:
```json
{
  "rejectionReason": "Invalid invoice",
  "adminNotes": "Invoice does not match"
}
```

### Update Warranty
**PUT** `/warranties/:id` (Admin only)

### Check Serial Number
**GET** `/warranties/check-serial` (Protected)

Query params: `serialNumber`, `productId`

---

## Invoice Endpoints

### Generate Invoice
**POST** `/invoices/generate` (Admin only)

Request body:
```json
{
  "orderId": "order_id"
}
```

### Get Invoice
**GET** `/invoices/:id` (Protected)

### Get Invoice by Order
**GET** `/invoices/order/:orderId` (Protected)

### Get User Invoices
**GET** `/invoices/my-invoices` (Protected)

### Get All Invoices
**GET** `/invoices` (Admin only)

Query params: `paymentStatus`, `startDate`, `endDate`

### Resend Invoice
**POST** `/invoices/:id/resend` (Admin only)

---

## Retailer Inventory Endpoints

### Get Retailer Inventory
**GET** `/retailer-inventory/my-inventory` (Retailer only)

Query params: `status`

### Add to Inventory
**POST** `/retailer-inventory/add` (Retailer only)

Request body:
```json
{
  "orderId": "order_id",
  "productUnits": [
    {
      "productUnitId": "unit_id",
      "price": 999
    }
  ]
}
```

### Mark as Sold
**POST** `/retailer-inventory/:inventoryId/sell` (Retailer only)

Request body:
```json
{
  "customerName": "Customer Name",
  "customerEmail": "customer@email.com",
  "customerPhone": "1234567890",
  "customerAddress": "123 Main St",
  "sellingPrice": 1200,
  "customerInvoice": "invoice_url",
  "soldDate": "2024-01-01"
}
```

### Get Inventory Item
**GET** `/retailer-inventory/:id` (Protected)

### Get All Inventories
**GET** `/retailer-inventory` (Admin only)

Query params: `retailerId`, `status`

### Update Inventory Status
**PUT** `/retailer-inventory/:id/status` (Protected)

Request body:
```json
{
  "status": "in_stock | sold | returned | damaged",
  "notes": "Optional notes"
}
```

---

## Email Log Endpoints

### Get Email Logs
**GET** `/email-logs` (Admin only)

Query params: `emailType`, `status`, `recipient`

### Resend Email
**POST** `/email-logs/:id/resend` (Admin only)

---

## Analytics Endpoints

### Get Dashboard Analytics
**GET** `/analytics/dashboard` (Admin only)

Query params: `startDate`, `endDate`

Response:
```json
{
  "sales": {
    "total": 50000,
    "direct": 30000,
    "quote": 20000,
    "byUserType": {
      "user": 35000,
      "retailer": 15000
    }
  },
  "orders": {
    "total": 100,
    "direct": 60,
    "quote": 40,
    "byUserType": {
      "user": 70,
      "retailer": 30
    }
  },
  "quotes": {
    "total": 50,
    "pending": 10,
    "responded": 15,
    "accepted": 20,
    "rejected": 5,
    "conversionRate": "40.00"
  },
  "users": {
    "total": 200,
    "retailers": 20,
    "pendingRetailers": 5
  },
  "inventory": {
    "total": 500,
    "online": 300,
    "offline": 200
  },
  "warranties": {
    "total": 80,
    "pending": 15,
    "approved": 60,
    "rejected": 5
  },
  "recentActivity": {
    "orders": [],
    "quotes": [],
    "warranties": []
  }
}
```

### Get Sales Report
**GET** `/analytics/sales-report` (Admin only)

Query params: `startDate`, `endDate`, `groupBy` (day|month|year)

### Get Top Products
**GET** `/analytics/top-products` (Admin only)

Query params: `limit` (default: 10)

---

## Email Notification Types

The system automatically sends emails for the following events:

1. **Quote Request** - Sent to admin when user requests quote
2. **Quote Approval** - Sent to user when admin responds to quote
3. **Quote Rejection** - Sent to user when admin rejects quote
4. **Order Confirmation** - Sent to user when order is created
5. **Payment Confirmation** - Sent to user when payment is completed
6. **Warranty Submitted** - Sent to user and admin when warranty is registered
7. **Warranty Approved** - Sent to user when warranty is approved
8. **Warranty Rejected** - Sent to user when warranty is rejected
9. **User Registration** - Sent to admin when new user registers
10. **Retailer Approval** - Sent to retailer when account is approved
11. **Retailer Sale Notification** - Sent to customer and admin when retailer sells product
12. **Invoice Generated** - Sent to user when invoice is generated

---

## Error Responses

All endpoints return standard error responses:

```json
{
  "message": "Error description"
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

---

## Business Rules

### Purchase Limits
- Regular users can buy up to 3 items directly
- Orders with more than 3 items require a quote
- Retailers always use quote system (no direct purchases)

### Stock Management
- Products have separate online and offline stock
- Retailers can only purchase from offline stock
- Regular users purchase from online stock

### Warranty Registration
- Online purchases don't require invoice upload
- Offline and retailer purchases require invoice upload
- Each serial number can only be registered once
- Retailer sales automatically create warranty registration for customer

### Invoice Generation
- Invoices are auto-generated after payment completion
- Invoice numbers follow format: INV-YYYYMM-XXXXX
- Each order gets one invoice

### Quote System
- Quotes cannot be reused for multiple orders
- Accepted quotes must be used within the session
- Quote conversion creates discounted order
