const mongoose = require('mongoose');

const retailerSaleSchema = new mongoose.Schema({
  retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'RetailerInventory', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productUnit: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductUnit', required: true },
  // Customer details for warranty
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true }
  },
  // Sale details
  saleDate: { type: Date, required: true },
  purchasePrice: { type: Number, required: true }, // Retailer's purchase price
  sellingPrice: { type: Number, required: true }, // Price sold to customer
  profit: { type: Number }, // Calculated profit
  invoiceUrl: { type: String, required: true }, // Customer invoice URL
  invoiceNumber: { type: String }, // Customer invoice number
  // Warranty tracking
  warrantyRegistration: { type: mongoose.Schema.Types.ObjectId, ref: 'Warranty' },
  warrantyStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  // Additional notes
  notes: { type: String },
  // Product details for reference
  productDetails: {
    name: { type: String },
    serialNumber: { type: String },
    modelNumber: { type: String }
  }
}, { timestamps: true });

// Calculate profit before saving
retailerSaleSchema.pre('save', function() {
  if (this.sellingPrice && this.purchasePrice) {
    this.profit = this.sellingPrice - this.purchasePrice;
  }
});

// Index for efficient queries
retailerSaleSchema.index({ retailer: 1, saleDate: -1 });
retailerSaleSchema.index({ retailer: 1, createdAt: -1 });

module.exports = mongoose.model('RetailerSale', retailerSaleSchema);
