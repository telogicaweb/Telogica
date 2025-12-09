const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  images: [{ type: String }], // Array of image URLs
  price: { type: Number }, // Optional - if not set, product requires quote
  retailerPrice: { type: Number }, // Special pricing for retailers
  category: { type: String },
  isTelecom: { type: Boolean, default: false }, // Explicitly mark Telecom products
  maxDirectPurchaseQty: { type: Number, default: null }, // Max quantity for direct purchase (null = unlimited, for Telecom = 2)
  stock: { type: Number, default: 0 }, // Total stock (calculated from ProductUnits)
  offlineStock: { type: Number, default: 0 }, // Stock available for offline/retailer sales
  isRecommended: { type: Boolean, default: true },
  // List of related products selected by admin to recommend alongside this product
  recommendedProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  requiresQuote: { type: Boolean, default: false }, // Auto-set if price is missing
  specifications: { type: Map, of: String }, // Key-value pairs for product specs
  warrantyPeriodMonths: { type: Number, default: 12 }, // Default warranty period (1 year)
  extendedWarrantyAvailable: { type: Boolean, default: true }, // Whether extended warranty is available
  extendedWarrantyMonths: { type: Number, default: 24 }, // Extended warranty period (2 years)
  extendedWarrantyPrice: { type: Number, default: 0 }, // Additional price for extended warranty
  modelNumberPrefix: { type: String }, // Default model number prefix/template (e.g., "TEL-2024-")
  features: [{ type: String }], // Key features of the product
  technicalSpecs: { type: Map, of: String }, // Additional technical specifications
  taxPercentage: { type: Number, default: 18 } // Tax percentage for the product (default 18% GST)
}, { timestamps: true });

// Auto-set requiresQuote if price is not provided
productSchema.pre('save', function() {
  if (!this.price) {
    this.requiresQuote = true;
  }
});

module.exports = mongoose.model('Product', productSchema);
