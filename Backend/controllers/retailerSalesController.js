const RetailerSale = require('../models/RetailerSale');
const RetailerInventory = require('../models/RetailerInventory');
const User = require('../models/User');
const Order = require('../models/Order');
const Quote = require('../models/Quote');
const Warranty = require('../models/Warranty');
const ProductUnit = require('../models/ProductUnit');

// Get retailer dashboard analytics
exports.getRetailerDashboard = async (req, res) => {
  try {
    const retailerId = req.user._id;

    // Get inventory stats
    const inventoryStats = await RetailerInventory.aggregate([
      { $match: { retailer: retailerId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$purchasePrice' }
        }
      }
    ]);

    const inventory = {
      inStock: 0,
      sold: 0,
      returned: 0,
      damaged: 0,
      totalValue: 0
    };

    inventoryStats.forEach(stat => {
      if (stat._id === 'in_stock') {
        inventory.inStock = stat.count;
        inventory.totalValue = stat.totalValue;
      } else if (stat._id === 'sold') {
        inventory.sold = stat.count;
      } else if (stat._id === 'returned') {
        inventory.returned = stat.count;
      } else if (stat._id === 'damaged') {
        inventory.damaged = stat.count;
      }
    });

    // Get sales stats
    const salesStats = await RetailerSale.aggregate([
      { $match: { retailer: retailerId } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$sellingPrice' },
          totalProfit: { $sum: '$profit' },
          avgSalePrice: { $avg: '$sellingPrice' }
        }
      }
    ]);

    const sales = salesStats[0] || {
      totalSales: 0,
      totalRevenue: 0,
      totalProfit: 0,
      avgSalePrice: 0
    };

    // Get recent sales
    const recentSales = await RetailerSale.find({ retailer: retailerId })
      .populate('product', 'name images')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get orders stats
    const orders = await Order.find({ user: retailerId });
    const orderStats = {
      total: orders.length,
      pending: orders.filter(o => o.orderStatus === 'pending').length,
      completed: orders.filter(o => o.paymentStatus === 'completed').length,
      totalSpent: orders.reduce((sum, o) => sum + o.totalAmount, 0)
    };

    // Get quote stats
    const quotes = await Quote.find({ user: retailerId });
    const quoteStats = {
      total: quotes.length,
      pending: quotes.filter(q => q.status === 'pending').length,
      responded: quotes.filter(q => q.status === 'responded').length,
      accepted: quotes.filter(q => q.status === 'accepted').length
    };

    // Monthly sales trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlySales = await RetailerSale.aggregate([
      { 
        $match: { 
          retailer: retailerId,
          saleDate: { $gte: sixMonthsAgo }
        } 
      },
      {
        $group: {
          _id: { 
            month: { $month: '$saleDate' },
            year: { $year: '$saleDate' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$sellingPrice' },
          profit: { $sum: '$profit' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      inventory,
      sales,
      orders: orderStats,
      quotes: quoteStats,
      recentSales,
      monthlySales
    });
  } catch (error) {
    console.error('Error fetching retailer dashboard:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all sales for retailer
exports.getRetailerSales = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 20 } = req.query;
    const filter = { retailer: req.user._id };

    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate) filter.saleDate.$lte = new Date(endDate);
    }

    const sales = await RetailerSale.find(filter)
      .populate('product', 'name images')
      .populate('warrantyRegistration')
      .sort({ saleDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await RetailerSale.countDocuments(filter);

    res.json({
      sales,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching retailer sales:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get sale details
exports.getSaleDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const sale = await RetailerSale.findById(id)
      .populate('product')
      .populate('productUnit')
      .populate('inventoryItem')
      .populate('warrantyRegistration');

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Verify retailer owns this sale
    if (sale.retailer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(sale);
  } catch (error) {
    console.error('Error fetching sale details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ADMIN: Get all retailers with summary
exports.getAllRetailers = async (req, res) => {
  try {
    const retailers = await User.find({ role: 'retailer' })
      .select('name email phone address isApproved createdAt');

    // Get summary for each retailer
    const retailerSummaries = await Promise.all(
      retailers.map(async (retailer) => {
        // Inventory count
        const inventoryCount = await RetailerInventory.countDocuments({ 
          retailer: retailer._id,
          status: 'in_stock'
        });

        // Total sales
        const salesStats = await RetailerSale.aggregate([
          { $match: { retailer: retailer._id } },
          {
            $group: {
              _id: null,
              totalSales: { $sum: 1 },
              totalRevenue: { $sum: '$sellingPrice' },
              totalProfit: { $sum: '$profit' }
            }
          }
        ]);

        const sales = salesStats[0] || { totalSales: 0, totalRevenue: 0, totalProfit: 0 };

        // Total orders
        const ordersCount = await Order.countDocuments({ user: retailer._id });

        // Total purchase value
        const purchaseValue = await Order.aggregate([
          { $match: { user: retailer._id, paymentStatus: 'completed' } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        return {
          ...retailer.toObject(),
          summary: {
            inventoryCount,
            totalSales: sales.totalSales,
            totalRevenue: sales.totalRevenue,
            totalProfit: sales.totalProfit,
            ordersCount,
            totalPurchaseValue: purchaseValue[0]?.total || 0
          }
        };
      })
    );

    res.json(retailerSummaries);
  } catch (error) {
    console.error('Error fetching retailers:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ADMIN: Get retailer details with full history
exports.getRetailerDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const retailer = await User.findById(id).select('-password');
    if (!retailer || retailer.role !== 'retailer') {
      return res.status(404).json({ message: 'Retailer not found' });
    }

    // Get all inventory items
    const inventory = await RetailerInventory.find({ retailer: id })
      .populate('product', 'name images')
      .populate('productUnit')
      .sort({ createdAt: -1 });

    // Get all sales
    const sales = await RetailerSale.find({ retailer: id })
      .populate('product', 'name images')
      .populate('warrantyRegistration')
      .sort({ saleDate: -1 });

    // Get all orders
    const orders = await Order.find({ user: id })
      .populate('products.product', 'name')
      .sort({ createdAt: -1 });

    // Get all quotes
    const quotes = await Quote.find({ user: id })
      .populate('products.product', 'name')
      .sort({ createdAt: -1 });

    // Get all warranties registered by this retailer
    const warranties = await Warranty.find({ retailer: id })
      .populate('product', 'name')
      .sort({ createdAt: -1 });

    // Calculate stats
    const stats = {
      inventory: {
        total: inventory.length,
        inStock: inventory.filter(i => i.status === 'in_stock').length,
        sold: inventory.filter(i => i.status === 'sold').length,
        totalValue: inventory.reduce((sum, i) => sum + i.purchasePrice, 0)
      },
      sales: {
        total: sales.length,
        totalRevenue: sales.reduce((sum, s) => sum + s.sellingPrice, 0),
        totalProfit: sales.reduce((sum, s) => sum + (s.profit || 0), 0)
      },
      orders: {
        total: orders.length,
        completed: orders.filter(o => o.paymentStatus === 'completed').length,
        totalSpent: orders.reduce((sum, o) => sum + o.totalAmount, 0)
      },
      warranties: {
        total: warranties.length,
        pending: warranties.filter(w => w.status === 'pending').length,
        approved: warranties.filter(w => w.status === 'approved').length
      }
    };

    res.json({
      retailer,
      stats,
      inventory,
      sales,
      orders,
      quotes,
      warranties
    });
  } catch (error) {
    console.error('Error fetching retailer details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ADMIN: Get all retailer sales (across all retailers)
exports.getAllRetailerSales = async (req, res) => {
  try {
    const { retailerId, startDate, endDate, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (retailerId) filter.retailer = retailerId;
    if (startDate || endDate) {
      filter.saleDate = {};
      if (startDate) filter.saleDate.$gte = new Date(startDate);
      if (endDate) filter.saleDate.$lte = new Date(endDate);
    }

    const sales = await RetailerSale.find(filter)
      .populate('retailer', 'name email')
      .populate('product', 'name images')
      .populate('warrantyRegistration')
      .sort({ saleDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await RetailerSale.countDocuments(filter);

    // Calculate totals
    const totals = await RetailerSale.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$sellingPrice' },
          totalProfit: { $sum: '$profit' }
        }
      }
    ]);

    res.json({
      sales,
      totals: totals[0] || { totalSales: 0, totalRevenue: 0, totalProfit: 0 },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching all retailer sales:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ADMIN: Get retailer analytics
exports.getRetailerAnalytics = async (req, res) => {
  try {
    // Total retailers
    const totalRetailers = await User.countDocuments({ role: 'retailer' });
    const activeRetailers = await User.countDocuments({ role: 'retailer', isApproved: true });
    const pendingRetailers = await User.countDocuments({ role: 'retailer', isApproved: false });

    // Total inventory in retailers' hands
    const inventoryStats = await RetailerInventory.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          value: { $sum: '$purchasePrice' }
        }
      }
    ]);

    const inventory = {
      total: 0,
      inStock: 0,
      sold: 0,
      totalValue: 0
    };

    inventoryStats.forEach(stat => {
      inventory.total += stat.count;
      if (stat._id === 'in_stock') {
        inventory.inStock = stat.count;
        inventory.totalValue = stat.value;
      } else if (stat._id === 'sold') {
        inventory.sold = stat.count;
      }
    });

    // Total sales through retailers
    const salesStats = await RetailerSale.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$sellingPrice' },
          totalRetailerProfit: { $sum: '$profit' },
          avgSalePrice: { $avg: '$sellingPrice' }
        }
      }
    ]);

    const sales = salesStats[0] || {
      totalSales: 0,
      totalRevenue: 0,
      totalRetailerProfit: 0,
      avgSalePrice: 0
    };

    // Top performing retailers
    const topRetailers = await RetailerSale.aggregate([
      {
        $group: {
          _id: '$retailer',
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$sellingPrice' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'retailer'
        }
      },
      { $unwind: '$retailer' },
      {
        $project: {
          retailerId: '$_id',
          name: '$retailer.name',
          email: '$retailer.email',
          totalSales: 1,
          totalRevenue: 1
        }
      }
    ]);

    // Monthly sales trend
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlySales = await RetailerSale.aggregate([
      { $match: { saleDate: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            month: { $month: '$saleDate' },
            year: { $year: '$saleDate' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$sellingPrice' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      retailers: {
        total: totalRetailers,
        active: activeRetailers,
        pending: pendingRetailers
      },
      inventory,
      sales,
      topRetailers,
      monthlySales
    });
  } catch (error) {
    console.error('Error fetching retailer analytics:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = exports;
