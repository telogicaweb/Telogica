const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  eventDate: { type: Date, required: true },
  eventTime: { type: String, required: true },
  location: { type: String },
  type: { 
    type: String, 
    enum: ['AGM', 'Earnings Call', 'Conference', 'Webinar', 'Other'],
    default: 'Other'
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
