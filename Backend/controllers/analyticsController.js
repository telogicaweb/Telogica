const Order = require('../models/Order');
const Quote = require('../models/Quote');
const User = require('../models/User');
const Warranty = require('../models/Warranty');
const ProductUnit = require('../models/ProductUnit');
const Invoice = require('../models/Invoice');

// Get admin dashboard analytics
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Total Sales
    const completedOrders = await Order.find({ 
      paymentStatus: 'completed',
      ...dateFilter 
    });
    const totalSales = completedOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Sales breakdown
    const directPurchaseOrders = completedOrders.filter(order => !order.isQuoteBased);
    const quotePurchaseOrders = completedOrders.filter(order => order.isQuoteBased);
    
    const directSales = directPurchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const quoteSales = quotePurchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // User vs Retailer purchases
    const ordersWithUsers = await Order.find({ 
      paymentStatus: 'completed',
      ...dateFilter 
    }).populate('user', 'role');
    
    const userOrders = ordersWithUsers.filter(order => order.user.role === 'user');
    const retailerOrders = ordersWithUsers.filter(order => order.user.role === 'retailer');
    
    const userSales = userOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const retailerSales = retailerOrders.reduce((sum, order) => sum + order.totalAmount, 0);

    // Quote statistics
    const totalQuotes = await Quote.countDocuments(dateFilter);
    const pendingQuotes = await Quote.countDocuments({ status: 'pending', ...dateFilter });
    const respondedQuotes = await Quote.countDocuments({ status: 'responded', ...dateFilter });
    const acceptedQuotes = await Quote.countDocuments({ status: 'accepted', ...dateFilter });
    const rejectedQuotes = await Quote.countDocuments({ status: 'rejected', ...dateFilter });

    // User statistics
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalRetailers = await User.countDocuments({ role: 'retailer' });
    const pendingRetailers = await User.countDocuments({ role: 'retailer', isApproved: false });

    // Inventory levels
    const totalStock = await ProductUnit.countDocuments({ status: 'available' });
    const onlineStock = await ProductUnit.countDocuments({ 
      status: 'available',
      stockType: { $in: ['online', 'both'] }
    });
    const offlineStock = await ProductUnit.countDocuments({ 
      status: 'available',
      stockType: { $in: ['offline', 'both'] }
    });

    // Warranty statistics
    const totalWarranties = await Warranty.countDocuments(dateFilter);
    const pendingWarranties = await Warranty.countDocuments({ status: 'pending', ...dateFilter });
    const approvedWarranties = await Warranty.countDocuments({ status: 'approved', ...dateFilter });
    const rejectedWarranties = await Warranty.countDocuments({ status: 'rejected', ...dateFilter });

    // Recent activity
    const recentOrders = await Order.find({ paymentStatus: 'completed' })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentQuotes = await Quote.find({ status: 'pending' })
      .populate('user', 'name email role')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentWarranties = await Warranty.find({ status: 'pending' })
      .populate('user', 'name email')
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      sales: {
        total: totalSales,
        direct: directSales,
        quote: quoteSales,
        byUserType: {
          user: userSales,
          retailer: retailerSales
        }
      },
      orders: {
        total: completedOrders.length,
        direct: directPurchaseOrders.length,
        quote: quotePurchaseOrders.length,
        byUserType: {
          user: userOrders.length,
          retailer: retailerOrders.length
        }
      },
      quotes: {
        total: totalQuotes,
        pending: pendingQuotes,
        responded: respondedQuotes,
        accepted: acceptedQuotes,
        rejected: rejectedQuotes,
        conversionRate: totalQuotes > 0 ? ((acceptedQuotes / totalQuotes) * 100).toFixed(2) : 0
      },
      users: {
        total: totalUsers,
        retailers: totalRetailers,
        pendingRetailers
      },
      inventory: {
        total: totalStock,
        online: onlineStock,
        offline: offlineStock
      },
      warranties: {
        total: totalWarranties,
        pending: pendingWarranties,
        approved: approvedWarranties,
        rejected: rejectedWarranties
      },
      recentActivity: {
        orders: recentOrders,
        quotes: recentQuotes,
        warranties: recentWarranties
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get sales report
exports.getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;
    
    const matchStage = { paymentStatus: 'completed' };
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    let groupByField;
    switch (groupBy) {
      case 'day':
        groupByField = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      case 'month':
        groupByField = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        break;
      case 'year':
        groupByField = { $dateToString: { format: "%Y", date: "$createdAt" } };
        break;
      default:
        groupByField = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    }

    const salesData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupByField,
          totalSales: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(salesData);
  } catch (error) {
    console.error('Error generating sales report:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get top products
exports.getTopProducts = async (req, res) => {
  try {
    const { limit } = req.query;
    const limitNum = parseInt(limit) || 10;

    const topProducts = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.product',
          totalQuantity: { $sum: '$products.quantity' },
          totalRevenue: { $sum: { $multiply: ['$products.price', '$products.quantity'] } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: limitNum },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' }
    ]);

    res.json(topProducts);
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = exports;
