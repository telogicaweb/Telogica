const mongoose = require('mongoose');

const productUnitSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  serialNumber: { type: String, required: true, unique: true },
  modelNumber: { type: String, required: true },
  warrantyPeriodMonths: { type: Number, default: 12 }, // Default 12 months warranty
  manufacturingDate: { type: Date },
  status: { 
    type: String, 
    enum: ['available', 'sold', 'reserved', 'defective', 'returned'], 
    default: 'available' 
  },
  stockType: { 
    type: String, 
    enum: ['online', 'offline', 'both'], 
    default: 'both' 
  },
  // Ownership tracking
  currentOwner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  soldDate: { type: Date },
  // Retailer tracking
  retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  retailerPurchaseDate: { type: Date },
  finalCustomerSaleDate: { type: Date }
}, { timestamps: true });

// Index for quick lookup
productUnitSchema.index({ serialNumber: 1 });
productUnitSchema.index({ product: 1, status: 1 });

module.exports = mongoose.model('ProductUnit', productUnitSchema);
