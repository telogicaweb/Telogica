const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const orderRoutes = require('./routes/orderRoutes');
const warrantyRoutes = require('./routes/warrantyRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const productUnitRoutes = require('./routes/productUnitRoutes');
const retailerInventoryRoutes = require('./routes/retailerInventoryRoutes');
const emailLogRoutes = require('./routes/emailLogRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/warranties', warrantyRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/product-units', productUnitRoutes);
app.use('/api/retailer-inventory', retailerInventoryRoutes);
app.use('/api/email-logs', emailLogRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
