const mongoose = require('mongoose');

const retailerInventorySchema = new mongoose.Schema({
  retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productUnit: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductUnit', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  purchaseDate: { type: Date, required: true },
  purchasePrice: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['in_stock', 'sold', 'returned', 'damaged'], 
    default: 'in_stock' 
  },
  // Customer sale details
  soldTo: {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String }
  },
  soldDate: { type: Date },
  sellingPrice: { type: Number },
  customerInvoice: { type: String }, // URL to uploaded customer invoice
  warrantyRegistration: { type: mongoose.Schema.Types.ObjectId, ref: 'Warranty' }
}, { timestamps: true });

// Index for retailer queries
retailerInventorySchema.index({ retailer: 1, status: 1 });

module.exports = mongoose.model('RetailerInventory', retailerInventorySchema);
