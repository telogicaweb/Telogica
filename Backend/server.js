const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

// CORS Configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    // If CORS_ORIGINS is set to '*', allow all origins
    if (process.env.CORS_ORIGINS === '*') {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:5173',
      'https://telogica-p7tf.vercel.app',
      'https://telogica.onrender.com',
      'https://telogica-lac.vercel.app'
    ];
    
    // Allow requests with no origin (like mobile apps, curl requests, or server-to-server)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly for all routes
app.options('*', cors(corsOptions));

app.use(express.json());

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

app.get('/', (req, res) => {
  res.send('API is running...');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
