# Telogica E-Commerce Platform

A full-stack MERN (MongoDB, Express, React, Node.js) e-commerce platform with a sophisticated quote-based ordering system supporting multiple user roles.

## 🚀 Features

### Three User Roles

#### 1. Admin
- Full administrative dashboard access
- User management (approve/reject retailers)
- Quote request management
- Custom pricing and discount capabilities
- Order oversight

#### 2. Regular User
- Browse and purchase products
- **Direct Purchase**: Up to 3 items without restrictions
- **Bulk Orders**: Request quotes for orders with more than 3 items
- Quote acceptance/rejection
- Order history tracking

#### 3. Retailer
- Requires admin approval before access
- Bulk ordering capabilities without item restrictions
- Special wholesale/bulk pricing through quotes
- Order history tracking

### Quote-Based Ordering System

1. **Quote Request**: Users/retailers submit quote requests for bulk orders
2. **Admin Review**: Admin reviews and responds with custom pricing and discounts
3. **Email Notification**: Users receive email when quote is responded to
4. **Accept/Reject**: Users can accept or reject the quoted price
5. **Order Conversion**: Accepted quotes convert to orders with discounted pricing

### Security Features

- ✅ JWT-based authentication
- ✅ Role-based access control
- ✅ Password hashing with bcrypt
- ✅ XSS prevention in email templates
- ✅ Input validation and sanitization
- ✅ Quote abuse prevention (one quote = one order)
- ✅ Configurable purchase limits

## 📁 Project Structure

```
Telogica/
├── Backend/
│   ├── controllers/      # Business logic
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API endpoints
│   ├── middleware/      # Authentication & authorization
│   ├── utils/           # Email & utilities
│   ├── config/          # Database configuration
│   └── server.js        # Entry point
├── Frontend/
│   ├── src/
│   │   ├── pages/       # React pages
│   │   ├── components/  # Reusable components
│   │   └── context/     # React context providers
│   └── package.json
├── IMPLEMENTATION_GUIDE.md  # Detailed feature documentation
├── SECURITY_SUMMARY.md      # Security analysis
└── TESTING_GUIDE.md         # Testing procedures
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
   
   # Email Configuration
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   
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
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Complete feature documentation, workflows, and technical details
- **[SECURITY_SUMMARY.md](./SECURITY_SUMMARY.md)** - Security measures, vulnerabilities analysis, and recommendations
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Comprehensive testing procedures and scenarios

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
5. Order confirmed

### Regular User Buying >3 Items
1. Add 4+ items to cart
2. System prompts for quote request
3. Submit quote with optional message
4. Wait for admin response (email notification)
5. Accept/reject quote
6. If accepted, checkout with discounted price

### Retailer Bulk Order
1. Register as retailer
2. Wait for admin approval (email notification)
3. Login after approval
4. Add any quantity of items
5. Request quote for bulk pricing
6. Admin responds with wholesale discount
7. Accept quote and checkout

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
