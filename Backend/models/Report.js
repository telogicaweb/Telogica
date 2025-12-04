const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  reportType: { 
    type: String, 
    enum: ['Annual Report', 'Quarterly Results', 'Investor Presentation', 'Corporate Governance', 'Other'],
    required: true
  },
  fileUrl: { type: String, required: true },
  fileSize: { type: String, required: true },
  fileType: { type: String, default: 'PDF' },
  reportDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
