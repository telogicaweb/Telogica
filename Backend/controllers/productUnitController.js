const ProductUnit = require('../models/ProductUnit');
const Product = require('../models/Product');
const { recalculateProductInventory } = require('../utils/inventory');

// Add product units (Admin)
exports.addProductUnits = async (req, res) => {
  try {
    const { productId, units } = req.body;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Validate units array
    if (!Array.isArray(units) || units.length === 0) {
      return res.status(400).json({ message: 'Units array is required' });
    }

    // Check for duplicate serial numbers
    const serialNumbers = units.map(u => u.serialNumber);
    const existingUnits = await ProductUnit.find({ 
      serialNumber: { $in: serialNumbers } 
    });

    if (existingUnits.length > 0) {
      const duplicates = existingUnits.map(u => u.serialNumber);
      return res.status(400).json({ 
        message: 'Duplicate serial numbers found',
        duplicates
      });
    }

    // Create product units
    const productUnits = await ProductUnit.insertMany(
      units.map(unit => ({
        product: productId,
        serialNumber: unit.serialNumber,
        modelNumber: unit.modelNumber,
        warrantyPeriodMonths: unit.warrantyPeriodMonths || product.warrantyPeriodMonths || 12,
        manufacturingDate: unit.manufacturingDate,
        stockType: unit.stockType || 'both',
        status: 'available'
      }))
    );

    const { totalStock, offlineStock } = await recalculateProductInventory(productId);

    res.status(201).json({
      message: `${productUnits.length} product units added successfully`,
      productUnits,
      totalStock,
      offlineStock
    });
  } catch (error) {
    console.error('Error adding product units:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get product units for a product (Admin)
exports.getProductUnits = async (req, res) => {
  try {
    const { productId } = req.params;
    const { status, stockType } = req.query;

    const filter = { product: productId };
    if (status) filter.status = status;
    if (stockType) filter.stockType = stockType;

    const units = await ProductUnit.find(filter)
      .populate('product', 'name')
      .populate('currentOwner', 'name email')
      .populate('retailer', 'name email')
      .sort({ createdAt: -1 });

    res.json(units);
  } catch (error) {
    console.error('Error fetching product units:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get available units for a product
exports.getAvailableUnits = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, stockType } = req.query;

    const filter = { 
      product: productId, 
      status: 'available' 
    };

    // For retailers, only show offline stock
    if (stockType === 'offline') {
      filter.stockType = { $in: ['offline', 'both'] };
    } else {
      filter.stockType = { $in: ['online', 'both'] };
    }

    const units = await ProductUnit.find(filter)
      .limit(parseInt(quantity) || 10);

    res.json({
      available: units.length,
      units
    });
  } catch (error) {
    console.error('Error fetching available units:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update product unit (Admin)
exports.updateProductUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const unit = await ProductUnit.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).populate('product currentOwner retailer');

    if (!unit) {
      return res.status(404).json({ message: 'Product unit not found' });
    }

    if (updates.status || updates.stockType) {
      await recalculateProductInventory(unit.product?._id || unit.product);
    }

    res.json({
      message: 'Product unit updated successfully',
      unit
    });
  } catch (error) {
    console.error('Error updating product unit:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Assign units to order
exports.assignUnitsToOrder = async (req, res) => {
  try {
    const { orderId, productId, quantity, userId, stockType } = req.body;

    // Find available units
    const filter = { 
      product: productId, 
      status: 'available' 
    };

    if (stockType === 'offline') {
      filter.stockType = { $in: ['offline', 'both'] };
    } else {
      filter.stockType = { $in: ['online', 'both'] };
    }

    const units = await ProductUnit.find(filter).limit(quantity);

    if (units.length < quantity) {
      return res.status(400).json({ 
        message: 'Insufficient stock available',
        available: units.length,
        required: quantity
      });
    }

    // Update units
    const updatedUnits = await Promise.all(
      units.map(unit => 
        ProductUnit.findByIdAndUpdate(
          unit._id,
          {
            status: 'sold',
            currentOwner: userId,
            order: orderId,
            soldDate: new Date()
          },
          { new: true }
        )
      )
    );

    const { totalStock, offlineStock } = await recalculateProductInventory(productId);

    res.json({
      message: 'Units assigned successfully',
      units: updatedUnits,
      serialNumbers: updatedUnits.map(u => u.serialNumber)
    });
  } catch (error) {
    console.error('Error assigning units:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get unit by serial number
exports.getUnitBySerial = async (req, res) => {
  try {
    const { serialNumber } = req.params;

    const unit = await ProductUnit.findOne({ serialNumber })
      .populate('product')
      .populate('currentOwner', 'name email phone')
      .populate('retailer', 'name email phone')
      .populate('order');

    if (!unit) {
      return res.status(404).json({ message: 'Product unit not found' });
    }

    res.json(unit);
  } catch (error) {
    console.error('Error fetching unit:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete product unit (Admin)
exports.deleteProductUnit = async (req, res) => {
  try {
    const { id } = req.params;

    const unit = await ProductUnit.findByIdAndDelete(id);

    if (!unit) {
      return res.status(404).json({ message: 'Product unit not found' });
    }

    await recalculateProductInventory(unit.product);

    res.json({ message: 'Product unit removed' });
  } catch (error) {
    console.error('Error deleting product unit:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = exports;
