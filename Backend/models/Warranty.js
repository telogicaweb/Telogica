const mongoose = require('mongoose');

const warrantySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productUnit: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductUnit' },
  productName: { type: String, required: true },
  modelNumber: { type: String, required: true },
  serialNumber: { type: String, required: true },
  purchaseDate: { type: Date, required: true },
  purchaseType: { 
    type: String, 
    enum: ['telogica_online', 'telogica_offline', 'retailer'], 
    required: true 
  },
  invoice: { type: String }, // URL to uploaded invoice (required for offline/retailer purchases)
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  warrantyStartDate: { type: Date },
  warrantyEndDate: { type: Date },
  warrantyPeriodMonths: { type: Number }, // Warranty period in months
  adminNotes: { type: String },
  rejectionReason: { type: String },
  // For retailer sales - final customer details
  isRetailerSale: { type: Boolean, default: false },
  retailer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  finalCustomer: {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('Warranty', warrantySchema);
