const RetailerInventory = require('../models/RetailerInventory');
const ProductUnit = require('../models/ProductUnit');
const Warranty = require('../models/Warranty');
const Product = require('../models/Product');
const { sendEmail } = require('../utils/mailer');

// Get retailer's inventory
exports.getRetailerInventory = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { retailer: req.user._id };
    if (status) filter.status = status;

    const inventory = await RetailerInventory.find(filter)
      .populate('product', 'name images')
      .populate('productUnit')
      .populate('purchaseOrder')
      .sort({ purchaseDate: -1 });

    res.json(inventory);
  } catch (error) {
    console.error('Error fetching retailer inventory:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add to retailer inventory (automatically called after retailer purchase)
exports.addToInventory = async (req, res) => {
  try {
    const { orderId, productUnits } = req.body;

    // Create inventory entries for each product unit
    const inventoryItems = await Promise.all(
      productUnits.map(async (unit) => {
        const productUnit = await ProductUnit.findById(unit.productUnitId);
        
        // Update product unit to mark retailer ownership
        await ProductUnit.findByIdAndUpdate(unit.productUnitId, {
          retailer: req.user._id,
          retailerPurchaseDate: new Date()
        });

        return RetailerInventory.create({
          retailer: req.user._id,
          productUnit: unit.productUnitId,
          product: productUnit.product,
          purchaseOrder: orderId,
          purchaseDate: new Date(),
          purchasePrice: unit.price,
          status: 'in_stock'
        });
      })
    );

    res.status(201).json({
      message: 'Items added to inventory successfully',
      inventory: inventoryItems
    });
  } catch (error) {
    console.error('Error adding to inventory:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Mark product as sold to customer
exports.markAsSold = async (req, res) => {
  try {
    const { inventoryId } = req.params;
    const { 
      customerName, 
      customerEmail, 
      customerPhone, 
      customerAddress,
      sellingPrice,
      customerInvoice,
      soldDate
    } = req.body;

    // Validate required fields
    if (!customerName || !customerEmail || !customerPhone || !customerInvoice) {
      return res.status(400).json({ 
        message: 'Customer details and invoice are required' 
      });
    }

    const inventoryItem = await RetailerInventory.findById(inventoryId)
      .populate('productUnit')
      .populate('product');

    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Verify retailer owns this inventory
    if (inventoryItem.retailer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (inventoryItem.status === 'sold') {
      return res.status(400).json({ message: 'Item already marked as sold' });
    }

    // Update inventory item
    inventoryItem.status = 'sold';
    inventoryItem.soldTo = {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      address: customerAddress
    };
    inventoryItem.soldDate = soldDate || new Date();
    inventoryItem.sellingPrice = sellingPrice;
    inventoryItem.customerInvoice = customerInvoice;

    await inventoryItem.save();

    // Update product unit
    await ProductUnit.findByIdAndUpdate(inventoryItem.productUnit._id, {
      finalCustomerSaleDate: inventoryItem.soldDate
    });

    // Create warranty registration for the customer
    const warranty = await Warranty.create({
      user: req.user._id, // Retailer initiates
      product: inventoryItem.product._id,
      productUnit: inventoryItem.productUnit._id,
      productName: inventoryItem.product.name,
      modelNumber: inventoryItem.productUnit.modelNumber,
      serialNumber: inventoryItem.productUnit.serialNumber,
      purchaseDate: inventoryItem.soldDate,
      purchaseType: 'retailer',
      invoice: customerInvoice,
      isRetailerSale: true,
      retailer: req.user._id,
      finalCustomer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        address: customerAddress
      },
      warrantyPeriodMonths: inventoryItem.productUnit.warrantyPeriodMonths,
      status: 'pending'
    });

    // Update inventory with warranty reference
    inventoryItem.warrantyRegistration = warranty._id;
    await inventoryItem.save();

    // Send email to customer
    await sendEmail(
      customerEmail,
      'Product Purchase & Warranty Registration',
      `Thank you for purchasing ${inventoryItem.product.name} from our authorized retailer. Your warranty has been registered and is pending approval. Serial Number: ${inventoryItem.productUnit.serialNumber}`,
      'retailer_sale_notification',
      { entityType: 'warranty', entityId: warranty._id }
    );

    // Send email to admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@telogica.com';
    await sendEmail(
      adminEmail,
      'Retailer Sale & Warranty Registration',
      `Retailer ${req.user.name} has sold ${inventoryItem.product.name} (S/N: ${inventoryItem.productUnit.serialNumber}) to ${customerName}. Warranty registration pending approval.`,
      'retailer_sale_notification',
      { entityType: 'warranty', entityId: warranty._id }
    );

    res.json({
      message: 'Product marked as sold and warranty registered successfully',
      inventory: inventoryItem,
      warranty
    });
  } catch (error) {
    console.error('Error marking as sold:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get inventory item details
exports.getInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await RetailerInventory.findById(id)
      .populate('product')
      .populate('productUnit')
      .populate('purchaseOrder')
      .populate('warrantyRegistration');

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Verify retailer owns this inventory
    if (req.user.role !== 'admin' && item.retailer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all retailer inventories (Admin)
exports.getAllInventories = async (req, res) => {
  try {
    const { retailerId, status } = req.query;
    
    const filter = {};
    if (retailerId) filter.retailer = retailerId;
    if (status) filter.status = status;

    const inventories = await RetailerInventory.find(filter)
      .populate('retailer', 'name email')
      .populate('product', 'name images')
      .populate('productUnit')
      .populate('purchaseOrder')
      .populate('warrantyRegistration')
      .sort({ createdAt: -1 });

    res.json(inventories);
  } catch (error) {
    console.error('Error fetching inventories:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update inventory item status (Admin or Retailer)
exports.updateInventoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const item = await RetailerInventory.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Verify access
    if (req.user.role !== 'admin' && item.retailer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    item.status = status;
    if (notes) item.notes = notes;
    await item.save();

    res.json({
      message: 'Inventory status updated successfully',
      inventory: item
    });
  } catch (error) {
    console.error('Error updating inventory status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = exports;
