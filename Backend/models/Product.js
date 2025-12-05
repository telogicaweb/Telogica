const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  images: [{ type: String }], // Array of image URLs
  price: { type: Number }, // Optional - if not set, product requires quote
  retailerPrice: { type: Number }, // Special pricing for retailers
  category: { type: String },
  isTelecom: { type: Boolean, default: false }, // Explicitly mark Telecom products
  stock: { type: Number, default: 0 }, // Total stock (calculated from ProductUnits)
  offlineStock: { type: Number, default: 0 }, // Stock available for offline/retailer sales
  isRecommended: { type: Boolean, default: false },
  requiresQuote: { type: Boolean, default: false }, // Auto-set if price is missing
  specifications: { type: Map, of: String }, // Key-value pairs for product specs
  warrantyPeriodMonths: { type: Number, default: 12 }, // Default warranty period
  modelNumberPrefix: { type: String }, // Default model number prefix/template (e.g., "TEL-2024-")
  features: [{ type: String }], // Key features of the product
  technicalSpecs: { type: Map, of: String } // Additional technical specifications
}, { timestamps: true });

// Auto-set requiresQuote if price is not provided
productSchema.pre('save', function() {
  if (!this.price) {
    this.requiresQuote = true;
  }
});

module.exports = mongoose.model('Product', productSchema);
