# Telogica E-Commerce Platform

A comprehensive full-stack MERN (MongoDB, Express, React, Node.js) e-commerce platform with warranty management, automated invoice generation, product unit tracking, retailer inventory management, and comprehensive email notifications.

## 🚀 Key Features

### Complete Warranty Management System
- **User Warranty Registration**: Register products with serial numbers
- **Automatic Validation**: Serial number verification against product database
- **Flexible Purchase Types**: Support for online, offline, and retailer purchases
- **Admin Approval Workflow**: Review and approve/reject warranty claims
- **Email Notifications**: Automated emails at each warranty lifecycle stage
- **Retailer Integration**: Automatic warranty transfer when retailers sell to customers

### Automated Invoice Generation
- **Auto-generation**: Invoices created automatically after payment completion
- **Unique Invoice Numbers**: Sequential numbering (INV-YYYYMM-XXXXX format)
- **Serial Number Tracking**: All assigned serial numbers included in invoice
- **Email Delivery**: Invoices automatically emailed to customers
- **Admin Management**: View, download, and resend invoices

### Product Unit Management
- **Individual Tracking**: Each product unit tracked with unique serial/model number
- **Stock Management**: Separate online and offline stock tracking
- **Unit Assignment**: Automatic assignment to orders upon payment
- **Manufacturing Details**: Track warranty period and manufacturing dates
- **Status Tracking**: Monitor unit lifecycle (available, sold, reserved, etc.)

### Retailer Inventory System
- **Inventory Dashboard**: Retailers manage purchased stock
- **Customer Sales**: Record sales to end customers with full details
- **Automatic Warranty Transfer**: Creates warranty registration for final customer
- **Email Notifications**: Customers and admin notified of retailer sales
- **Invoice Requirements**: Customer invoice upload mandatory

### Comprehensive Email System
- **12 Email Types**: Complete notification coverage for all user actions
- **Email Logging**: All emails logged with status tracking
- **Failed Email Tracking**: Monitor and retry failed deliveries
- **Admin Resend**: Ability to resend any email
- **Audit Trail**: Complete history of all communications

### Analytics Dashboard
- **Sales Metrics**: Total, direct, and quote-based sales tracking
- **User Analytics**: Breakdown by user type (regular vs retailer)
- **Quote Conversion**: Track quote acceptance and conversion rates
- **Inventory Levels**: Real-time stock monitoring
- **Warranty Statistics**: Pending, approved, and rejected warranties
- **Recent Activity**: Latest orders, quotes, and warranty registrations

### Three User Roles

#### 1. Admin
- Full administrative dashboard access
- User management (approve/reject retailers)
- Quote request management
- Custom pricing and discount capabilities
- Warranty approval/rejection
- Product unit management (add serial numbers)
- Invoice management and resending
- Email log monitoring
- Comprehensive analytics

#### 2. Regular User
- Browse and purchase products
- **Direct Purchase**: Up to 3 items without restrictions
- **Bulk Orders**: Request quotes for orders with more than 3 items
- Quote acceptance/rejection
- Order history tracking
- **Warranty Registration**: Register purchased products
- **Invoice Access**: Download invoices for all orders

#### 3. Retailer
- Requires admin approval before access
- Bulk ordering capabilities without item restrictions
- Special wholesale/bulk pricing through quotes
- **Inventory Management**: Track purchased stock
- **Customer Sales**: Sell products to end customers
- **Warranty Transfer**: Automatic warranty registration for customers
- Order history tracking

### Quote-Based Ordering System

1. **Quote Request**: Users/retailers submit quote requests for bulk orders
2. **Admin Review**: Admin reviews and responds with custom pricing and discounts
3. **Email Notification**: Users receive email when quote is responded to
4. **Accept/Reject**: Users can accept or reject the quoted price
5. **Order Conversion**: Accepted quotes convert to orders with discounted pricing

### Security Features

- ✅ JWT-based authentication
- ✅ Role-based access control (admin, user, retailer)
- ✅ Password hashing with bcrypt
- ✅ XSS prevention in email templates
- ✅ Input validation and sanitization
- ✅ Quote abuse prevention (one quote = one order)
- ✅ Configurable purchase limits
- ✅ Serial number uniqueness enforcement
- ✅ Ownership verification for all resources
- ✅ Audit logging for all emails

## 📁 Project Structure

```
Telogica/
├── Backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── quoteController.js
│   │   ├── orderController.js
│   │   ├── warrantyController.js         # NEW
│   │   ├── invoiceController.js          # NEW
│   │   ├── productUnitController.js      # NEW
│   │   ├── retailerInventoryController.js # NEW
│   │   └── analyticsController.js        # NEW
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Quote.js
│   │   ├── Order.js
│   │   ├── Warranty.js                   # NEW
│   │   ├── Invoice.js                    # NEW
│   │   ├── ProductUnit.js                # NEW
│   │   ├── RetailerInventory.js          # NEW
│   │   └── EmailLog.js                   # NEW
│   ├── routes/                 # API endpoints
│   ├── middleware/             # Authentication & authorization
│   ├── utils/                  # Email & utilities (enhanced)
│   ├── config/                 # Database configuration
│   └── server.js               # Entry point
├── Frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── ProductDetails.tsx
│   │   │   ├── Cart.tsx
│   │   │   ├── Quote.tsx
│   │   │   ├── UserDashboard.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── WarrantyRegistration.tsx  # NEW
│   │   │   └── RetailerInventory.tsx     # NEW
│   │   ├── components/         # Reusable components
│   │   └── context/            # React context providers
│   └── package.json
├── API_DOCUMENTATION.md        # NEW - Complete API reference
├── FEATURE_SUMMARY.md          # NEW - Feature documentation
├── SECURITY_REVIEW.md          # NEW - Security analysis
├── IMPLEMENTATION_GUIDE.md     # Detailed feature documentation
├── SECURITY_SUMMARY.md         # Security analysis
└── TESTING_GUIDE.md            # Testing procedures
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd Backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with the following variables:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   
   # Email Configuration (Required for notifications)
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ADMIN_EMAIL=admin@telogica.com
   
   # Payment Gateway (Razorpay)
   RAZORPAY_KEY_ID=your_key
   RAZORPAY_KEY_SECRET=your_secret
   
   # Configuration
   MAX_DIRECT_PURCHASE_ITEMS=3
   FRONTEND_URL=http://localhost:5173
   ```

4. Start the server:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd Frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## 📖 Documentation

### For Developers
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference with examples
- **[FEATURE_SUMMARY.md](./FEATURE_SUMMARY.md)** - Comprehensive feature documentation
- **[SECURITY_REVIEW.md](./SECURITY_REVIEW.md)** - Security analysis and recommendations
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Implementation workflows and technical details
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Testing procedures and scenarios
- **[SECURITY_SUMMARY.md](./SECURITY_SUMMARY.md)** - Additional security measures

### Quick Links
- [User Workflows](#user-workflows)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)

## 🔄 User Workflows

### Regular User Buying ≤3 Items
1. Browse products
2. Add 1-3 items to cart
3. Checkout directly
4. Complete payment
5. **Invoice auto-generated and emailed**
6. **Product units (serial numbers) assigned**
7. Can register warranty for purchased products

### Regular User Buying >3 Items
1. Add 4+ items to cart
2. System prompts for quote request
3. Submit quote with optional message
4. Wait for admin response (email notification)
5. Accept/reject quote
6. If accepted, checkout with discounted price
7. **Invoice generated and units assigned**
8. Register warranty for products

### Retailer Bulk Order
1. Register as retailer
2. Wait for admin approval (email notification)
3. Login after approval
4. Add any quantity of items (from offline stock)
5. Request quote for bulk pricing
6. Admin responds with wholesale discount
7. Accept quote and checkout
8. **Items added to retailer inventory**
9. **Can sell to customers with warranty transfer**

### Warranty Registration (User)
1. Navigate to warranty registration page
2. Enter product details and serial number
3. **Serial number automatically validated**
4. Upload invoice (if offline/retailer purchase)
5. Submit warranty registration
6. **Email sent to user and admin**
7. Admin reviews and approves/rejects
8. **Email notification of decision**

### Retailer Selling to Customer
1. Access retailer inventory panel
2. Select in-stock item
3. Enter customer details (name, email, phone, address)
4. Upload customer invoice
5. Confirm sale
6. **System creates warranty registration for customer**
7. **Emails sent to customer and admin**

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (Protected)
- `GET /api/auth/users` - Get all users (Admin only)
- `PUT /api/auth/approve/:id` - Approve retailer (Admin only)

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create product (Admin only)
- `PUT /api/products/:id` - Update product (Admin only)
- `DELETE /api/products/:id` - Delete product (Admin only)

### Product Units (NEW)
- `POST /api/product-units/add` - Add product units with serial numbers (Admin only)
- `GET /api/product-units/product/:productId` - Get units for product (Admin only)
- `GET /api/product-units/available/:productId` - Get available units (Protected)
- `GET /api/product-units/serial/:serialNumber` - Get unit by serial (Protected)
- `PUT /api/product-units/:id` - Update unit (Admin only)

### Quotes
- `POST /api/quotes` - Create quote (Protected)
- `GET /api/quotes` - Get quotes (Admin sees all, users see own)
- `PUT /api/quotes/:id/respond` - Admin responds to quote (Admin only)
- `PUT /api/quotes/:id/accept` - Accept quote (Protected)
- `PUT /api/quotes/:id/reject` - Reject quote (Protected)

### Orders
- `POST /api/orders` - Create order (Protected, validates 3-item limit)
- `POST /api/orders/verify` - Verify payment (Protected)
- `GET /api/orders/myorders` - Get user's orders (Protected)
- `GET /api/orders` - Get all orders (Admin only)

### Warranties (NEW)
- `POST /api/warranties` - Register warranty (Protected)
- `GET /api/warranties/my-warranties` - Get user warranties (Protected)
- `GET /api/warranties` - Get all warranties (Admin only)
- `PUT /api/warranties/:id/approve` - Approve warranty (Admin only)
- `PUT /api/warranties/:id/reject` - Reject warranty (Admin only)
- `GET /api/warranties/check-serial` - Validate serial number (Protected)

### Invoices (NEW)
- `POST /api/invoices/generate` - Generate invoice (Admin only)
- `GET /api/invoices/:id` - Get invoice (Protected)
- `GET /api/invoices/order/:orderId` - Get invoice by order (Protected)
- `GET /api/invoices/my-invoices` - Get user invoices (Protected)
- `POST /api/invoices/:id/resend` - Resend invoice (Admin only)

### Retailer Inventory (NEW)
- `GET /api/retailer-inventory/my-inventory` - Get retailer inventory (Retailer only)
- `POST /api/retailer-inventory/:inventoryId/sell` - Mark as sold (Retailer only)
- `GET /api/retailer-inventory` - Get all inventories (Admin only)

### Analytics (NEW)
- `GET /api/analytics/dashboard` - Dashboard analytics (Admin only)
- `GET /api/analytics/sales-report` - Sales report (Admin only)
- `GET /api/analytics/top-products` - Top products (Admin only)

### Email Logs (NEW)
- `GET /api/email-logs` - Get email logs (Admin only)
- `POST /api/email-logs/:id/resend` - Resend email (Admin only)

**For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'admin' | 'user' | 'retailer',
  isApproved: Boolean,
  phone: String,
  address: String
}
```

### Product Model (Enhanced)
```javascript
{
  name: String,
  description: String,
  images: [String],
  price: Number,                    // Optional - if missing, requiresQuote = true
  retailerPrice: Number,            // NEW - Special pricing for retailers
  category: String,
  stock: Number,
  offlineStock: Number,             // NEW - Stock for offline/retailer sales
  isRecommended: Boolean,
  requiresQuote: Boolean,           // NEW - Auto-set if no price
  specifications: Map,              // NEW - Product specs
  warrantyPeriodMonths: Number      // NEW - Default warranty period
}
```

### ProductUnit Model (NEW)
```javascript
{
  product: ObjectId (ref: Product),
  serialNumber: String (unique),
  modelNumber: String,
  warrantyPeriodMonths: Number,
  manufacturingDate: Date,
  status: 'available' | 'sold' | 'reserved' | 'defective' | 'returned',
  stockType: 'online' | 'offline' | 'both',
  currentOwner: ObjectId (ref: User),
  order: ObjectId (ref: Order),
  soldDate: Date,
  retailer: ObjectId (ref: User),
  retailerPurchaseDate: Date,
  finalCustomerSaleDate: Date
}
```

### Warranty Model (NEW)
```javascript
{
  user: ObjectId (ref: User),
  product: ObjectId (ref: Product),
  productUnit: ObjectId (ref: ProductUnit),
  productName: String,
  modelNumber: String,
  serialNumber: String,
  purchaseDate: Date,
  purchaseType: 'telogica_online' | 'telogica_offline' | 'retailer',
  invoice: String,
  status: 'pending' | 'approved' | 'rejected',
  warrantyStartDate: Date,
  warrantyEndDate: Date,
  warrantyPeriodMonths: Number,
  adminNotes: String,
  rejectionReason: String,
  isRetailerSale: Boolean,
  retailer: ObjectId (ref: User),
  finalCustomer: {
    name: String,
    email: String,
    phone: String,
    address: String
  }
}
```

### Invoice Model (NEW)
```javascript
{
  invoiceNumber: String (unique, auto-generated),
  user: ObjectId (ref: User),
  order: ObjectId (ref: Order),
  products: [{
    product: ObjectId (ref: Product),
    productName: String,
    quantity: Number,
    price: Number,
    serialNumbers: [String]
  }],
  subtotal: Number,
  discount: Number,
  tax: Number,
  totalAmount: Number,
  shippingAddress: String,
  paymentStatus: 'pending' | 'completed' | 'failed',
  invoiceDate: Date,
  paidDate: Date
}
```

### RetailerInventory Model (NEW)
```javascript
{
  retailer: ObjectId (ref: User),
  productUnit: ObjectId (ref: ProductUnit),
  product: ObjectId (ref: Product),
  purchaseOrder: ObjectId (ref: Order),
  purchaseDate: Date,
  purchasePrice: Number,
  status: 'in_stock' | 'sold' | 'returned' | 'damaged',
  soldTo: {
    name: String,
    email: String,
    phone: String,
    address: String
  },
  soldDate: Date,
  sellingPrice: Number,
  customerInvoice: String,
  warrantyRegistration: ObjectId (ref: Warranty)
}
```

### EmailLog Model (NEW)
```javascript
{
  recipient: String,
  recipientType: 'user' | 'admin' | 'retailer',
  subject: String,
  body: String,
  emailType: String,  // 12 types supported
  status: 'sent' | 'failed' | 'pending',
  errorMessage: String,
  relatedEntity: {
    entityType: String,
    entityId: ObjectId
  },
  sentAt: Date
}
```

### Quote Model
```javascript
{
  user: ObjectId (ref: User),
  products: [{
    product: ObjectId (ref: Product),
    quantity: Number,
    originalPrice: Number
  }],
  message: String,
  status: 'pending' | 'responded' | 'accepted' | 'rejected',
  adminResponse: {
    totalPrice: Number,
    discountPercentage: Number,
    message: String,
    respondedAt: Date
  },
  acceptedAt: Date,
  orderId: ObjectId (ref: Order)
}
```

### Order Model
```javascript
{
  user: ObjectId (ref: User),
  products: [{
    product: ObjectId (ref: Product),
    quantity: Number,
    price: Number
  }],
  totalAmount: Number,
  shippingAddress: String,
  paymentStatus: 'pending' | 'completed' | 'failed',
  orderStatus: 'processing' | 'shipped' | 'delivered' | 'cancelled',
  quoteId: ObjectId (ref: Quote),
  isQuoteBased: Boolean,
  discountApplied: Number
}
```

## 🧪 Testing

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive testing procedures covering:
- User registration and login flows
- Purchase limit enforcement
- Quote submission and approval
- Admin dashboard operations
- Retailer approval process
- Email notifications
- Security testing
- Edge cases

## 🔒 Security

Key security features implemented:
- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- XSS prevention in email templates
- Input validation and sanitization
- Quote anti-abuse measures
- No vulnerable dependencies

**For Production:**
- Implement rate limiting
- Enable HTTPS
- Add CSRF protection
- Configure security headers
- Set up proper CORS policies

See [SECURITY_SUMMARY.md](./SECURITY_SUMMARY.md) for detailed analysis.

## 🚀 Deployment

### Backend
1. Set up MongoDB Atlas or managed MongoDB instance
2. Configure environment variables in hosting platform
3. Deploy to Heroku, AWS, DigitalOcean, or similar
4. Ensure HTTPS is enabled

### Frontend
1. Build production bundle: `npm run build`
2. Deploy to Vercel, Netlify, or similar
3. Update `FRONTEND_URL` in backend `.env`
4. Configure proper CORS settings

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure builds pass
5. Submit a pull request

## 📝 License

This project is proprietary software for Telogica.

## 👥 Team

Full Stack MERN Development Team

## 📞 Support

For issues or questions:
1. Check the documentation files
2. Review the testing guide
3. Check server and browser console logs
4. Verify environment configuration

## 🎯 Roadmap

### Planned Features
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Automated discount rules
- [ ] Multi-currency support
- [ ] Inventory management
- [ ] Invoice generation
- [ ] Rate limiting implementation
- [ ] Complete payment gateway integration

### Known Limitations
- Payment integration is currently mocked
- Rate limiting not implemented (recommended for production)
- Real-time updates require manual refresh
- Image uploads use URLs, not file storage

## 📊 Statistics

- **Backend Files**: 5 controllers, 4 models, 4 routes
- **Frontend Pages**: 8 pages, multiple components
- **API Endpoints**: 20+ RESTful endpoints
- **User Roles**: 3 distinct roles with different permissions
- **Documentation**: 3 comprehensive guides (25+ pages)

---

**Built with ❤️ using the MERN Stack**
