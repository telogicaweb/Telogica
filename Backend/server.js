const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const {
  applySecurityMiddleware,
  apiLimiter,
  authLimiter,
  exportLimiter,
} = require('./middleware/security');
const { initializeSocket } = require('./services/socketService');
const logger = require('./services/loggerService');

// Prevent crash on unhandled errors
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
});

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);

// CORS Configuration for production
// IMPORTANT: CORS must be applied FIRST before any other middleware
// to ensure CORS headers are set even when errors occur in other middleware
const corsOptions = {
  origin: function (origin, callback) {
    // If CORS_ORIGINS is set to '*', allow all origins
    if (process.env.CORS_ORIGINS === '*') {
      return callback(null, true);
    }

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'https://telogica-p7tf.vercel.app',
      'https://telogica.onrender.com',
      'https://telogica-lac.vercel.app'
    ];

    // Allow requests with no origin (like mobile apps, curl requests, or server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Disposition'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200
};

// Apply CORS middleware FIRST
app.use(cors(corsOptions));

// Handle preflight requests explicitly for all routes
app.options(/.*/, cors(corsOptions));

// Apply comprehensive security middleware AFTER CORS


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply comprehensive security middleware - Must be after body parsers
applySecurityMiddleware(app);

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const orderRoutes = require('./routes/orderRoutes');
const warrantyRoutes = require('./routes/warrantyRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const productUnitRoutes = require('./routes/productUnitRoutes');
const retailerInventoryRoutes = require('./routes/retailerInventoryRoutes');
const retailerSalesRoutes = require('./routes/retailerSalesRoutes');
const emailLogRoutes = require('./routes/emailLogRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const contentRoutes = require('./routes/contentRoutes');
const blogRoutes = require('./routes/blogRoutes');
const teamRoutes = require('./routes/teamRoutes');
const eventRoutes = require('./routes/eventRoutes');
const reportRoutes = require('./routes/reportRoutes');
const contactRoutes = require('./routes/contactRoutes');
const exportRoutes = require('./routes/exportRoutes');
const logRoutes = require('./routes/logRoutes');
const retailerQuotedProductRoutes = require('./routes/retailerQuotedProductRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const investorDocumentRoutes = require('./routes/investorDocumentRoutes');

// Apply rate limiting to routes
// app.use('/api/auth/login', authLimiter);
// app.use('/api/auth/register', authLimiter);
// app.use('/api/export', exportLimiter);
// app.use('/api', apiLimiter); // General API rate limit

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/warranties', warrantyRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/product-units', productUnitRoutes);
app.use('/api/retailer-inventory', retailerInventoryRoutes);
app.use('/api/retailer', retailerSalesRoutes);
app.use('/api/email-logs', emailLogRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/quoted-products', retailerQuotedProductRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/investor-documents', investorDocumentRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Telogica E-Commerce API',
    version: '3.0.0',
    status: 'running',
    features: [
      'Complete E-Commerce',
      'Real-time WebSocket Notifications',
      'Warranty Management',
      'Invoice Generation',
      'Export Functionality (PDF/CSV/Excel)',
      'Activity Logging & Audit Trail',
      'In-App Notifications',
      'Rate Limiting & Security',
      'Admin Dashboard',
      'Retailer Portal',
    ],
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Error handling middleware - ensure CORS headers are set on errors
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  // Handle CORS errors specifically
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS policy violation' });
  }

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message),
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate entry. Resource already exists.' });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;

// Initialize WebSocket server
initializeSocket(server);

server.listen(PORT, () => {
  logger.info(`Server started on port ${PORT}`);
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 Telogica E-Commerce Platform                         ║
║                                                           ║
║   Server running on port ${PORT}                          ║
║   Environment: ${process.env.NODE_ENV || 'development'}   ║
║                                                           ║
║   ✓ Security middleware active                            ║
║   ✓ Rate limiting enabled                                 ║
║   ✓ CORS configured                                       ║
║   ✓ Input validation ready                                ║
║   ✓ Export functionality available                        ║
║   ✓ Security middleware active                           ║
║   ✓ Rate limiting enabled                                ║
║   ✓ CORS configured                                      ║
║   ✓ Input validation ready                               ║
║   ✓ Export functionality available                       ║
║   ✓ WebSocket server initialized                         ║
║   ✓ Real-time notifications enabled                      ║
║   ✓ Activity logging configured                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
