const mongoose = require('mongoose');

const investorDocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true }, // e.g., "Annual Reports", "Quarterly Results", "Investor Presentations"
  description: { type: String },
  documentUrl: { type: String, required: true }, // URL to the uploaded PDF/document
  fileSize: { type: String }, // e.g., "4.2 MB"
  fileType: { type: String, default: 'PDF' }, // PDF, Excel, etc.
  publishDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 }, // For sorting documents within a category
}, { timestamps: true });

// Index for performance
investorDocumentSchema.index({ category: 1, publishDate: -1 });
investorDocumentSchema.index({ isActive: 1 });

module.exports = mongoose.model('InvestorDocument', investorDocumentSchema);
