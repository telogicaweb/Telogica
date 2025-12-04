const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  products: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true }
  }],
  message: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'responded', 'accepted', 'rejected'], 
    default: 'pending' 
  },
  adminResponse: {
    price: { type: Number },
    message: { type: String }
  }
}, { timestamps: true });

module.exports = mongoose.model('Quote', quoteSchema);
