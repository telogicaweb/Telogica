const mongoose = require('mongoose');

const retailerQuotedProductSchema = new mongoose.Schema({
  retailer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  quotedPrice: { 
    type: Number, 
    required: true 
  },
  originalPrice: { 
    type: Number 
  },
  quoteId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Quote' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastUpdatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  notes: { 
    type: String 
  }
}, { timestamps: true });

// Compound index to ensure unique product per retailer
retailerQuotedProductSchema.index({ retailer: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('RetailerQuotedProduct', retailerQuotedProductSchema);
