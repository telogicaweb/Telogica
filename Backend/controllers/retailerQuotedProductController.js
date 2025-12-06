const RetailerQuotedProduct = require('../models/RetailerQuotedProduct');
const User = require('../models/User');
const Product = require('../models/Product');

// Get retailer's quoted products
exports.getMyQuotedProducts = async (req, res) => {
  try {
    const quotedProducts = await RetailerQuotedProduct.find({ 
      retailer: req.user._id,
      isActive: true 
    })
      .populate('product', 'name description category images stock')
      .sort({ updatedAt: -1 });

    res.json(quotedProducts);
  } catch (error) {
    console.error('Error fetching quoted products:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Save quoted products from accepted quote (called when retailer accepts a quote)
exports.saveQuotedProducts = async (req, res) => {
  try {
    const { quoteId, products } = req.body;
    const retailerId = req.user._id;

    if (!products || products.length === 0) {
      return res.status(400).json({ message: 'No products provided' });
    }

    const savedProducts = [];

    for (const item of products) {
      const { productId, quotedPrice, originalPrice } = item;

      // Upsert - update if exists, create if not
      const quotedProduct = await RetailerQuotedProduct.findOneAndUpdate(
        { retailer: retailerId, product: productId },
        {
          retailer: retailerId,
          product: productId,
          quotedPrice,
          originalPrice,
          quoteId,
          isActive: true,
          lastUpdatedBy: retailerId
        },
        { upsert: true, new: true }
      );

      savedProducts.push(quotedProduct);
    }

    res.json({ 
      message: 'Quoted products saved successfully',
      products: savedProducts 
    });
  } catch (error) {
    console.error('Error saving quoted products:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ADMIN: Get all retailers with their quoted products
exports.getAllRetailersQuotedProducts = async (req, res) => {
  try {
    const retailers = await User.find({ role: 'retailer' })
      .select('name email phone isApproved');

    const retailersWithProducts = await Promise.all(
      retailers.map(async (retailer) => {
        const quotedProducts = await RetailerQuotedProduct.find({ 
          retailer: retailer._id,
          isActive: true 
        })
          .populate('product', 'name category images')
          .sort({ updatedAt: -1 });

        return {
          ...retailer.toObject(),
          quotedProductsCount: quotedProducts.length,
          quotedProducts
        };
      })
    );

    // Filter to only show retailers with quoted products, or show all if requested
    const { showAll } = req.query;
    const result = showAll === 'true' 
      ? retailersWithProducts 
      : retailersWithProducts.filter(r => r.quotedProductsCount > 0);

    res.json(result);
  } catch (error) {
    console.error('Error fetching retailers quoted products:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ADMIN: Get quoted products for a specific retailer
exports.getRetailerQuotedProducts = async (req, res) => {
  try {
    const { retailerId } = req.params;

    const retailer = await User.findById(retailerId).select('name email phone');
    if (!retailer || retailer.role === 'admin') {
      return res.status(404).json({ message: 'Retailer not found' });
    }

    const quotedProducts = await RetailerQuotedProduct.find({ 
      retailer: retailerId,
      isActive: true 
    })
      .populate('product', 'name description category images stock price retailerPrice')
      .populate('lastUpdatedBy', 'name')
      .sort({ updatedAt: -1 });

    res.json({
      retailer,
      quotedProducts
    });
  } catch (error) {
    console.error('Error fetching retailer quoted products:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ADMIN: Update quoted price for a retailer's product
exports.updateQuotedPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const { quotedPrice, notes } = req.body;

    if (!quotedPrice || quotedPrice <= 0) {
      return res.status(400).json({ message: 'Valid quoted price is required' });
    }

    const quotedProduct = await RetailerQuotedProduct.findById(id);
    if (!quotedProduct) {
      return res.status(404).json({ message: 'Quoted product not found' });
    }

    quotedProduct.quotedPrice = quotedPrice;
    quotedProduct.lastUpdatedBy = req.user._id;
    if (notes !== undefined) {
      quotedProduct.notes = notes;
    }

    await quotedProduct.save();

    const updated = await RetailerQuotedProduct.findById(id)
      .populate('product', 'name category images')
      .populate('lastUpdatedBy', 'name');

    res.json({
      message: 'Quoted price updated successfully',
      quotedProduct: updated
    });
  } catch (error) {
    console.error('Error updating quoted price:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ADMIN: Add a new quoted product for a retailer
exports.addQuotedProduct = async (req, res) => {
  try {
    const { retailerId, productId, quotedPrice, notes } = req.body;

    if (!retailerId || !productId || !quotedPrice) {
      return res.status(400).json({ message: 'Retailer, product, and price are required' });
    }

    const retailer = await User.findById(retailerId);
    if (!retailer || retailer.role !== 'retailer') {
      return res.status(404).json({ message: 'Retailer not found' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if already exists
    const existing = await RetailerQuotedProduct.findOne({ 
      retailer: retailerId, 
      product: productId 
    });

    if (existing) {
      existing.quotedPrice = quotedPrice;
      existing.isActive = true;
      existing.lastUpdatedBy = req.user._id;
      if (notes) existing.notes = notes;
      await existing.save();

      const updated = await RetailerQuotedProduct.findById(existing._id)
        .populate('product', 'name category images');

      return res.json({
        message: 'Quoted product updated',
        quotedProduct: updated
      });
    }

    const quotedProduct = new RetailerQuotedProduct({
      retailer: retailerId,
      product: productId,
      quotedPrice,
      originalPrice: product.price || product.retailerPrice,
      isActive: true,
      lastUpdatedBy: req.user._id,
      notes
    });

    await quotedProduct.save();

    const saved = await RetailerQuotedProduct.findById(quotedProduct._id)
      .populate('product', 'name category images');

    res.status(201).json({
      message: 'Quoted product added successfully',
      quotedProduct: saved
    });
  } catch (error) {
    console.error('Error adding quoted product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ADMIN: Delete/deactivate a quoted product
exports.deleteQuotedProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const quotedProduct = await RetailerQuotedProduct.findById(id);
    if (!quotedProduct) {
      return res.status(404).json({ message: 'Quoted product not found' });
    }

    // Soft delete by setting isActive to false
    quotedProduct.isActive = false;
    quotedProduct.lastUpdatedBy = req.user._id;
    await quotedProduct.save();

    res.json({ message: 'Quoted product removed successfully' });
  } catch (error) {
    console.error('Error deleting quoted product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = exports;
