const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  section: { 
    type: String, 
    required: true,
    enum: [
      'hero_home',
      'stats_home',
      'about_hero',
      'about_story',
      'about_mission',
      'about_vision',
      'about_values',
      'about_leadership',
      'investors_hero',
      'investors_financial',
      'investors_stock',
      'contact_hero',
      'contact_office',
      'contact_info',
      'contact_hours'
    ]
  },
  title: { type: String },
  subtitle: { type: String },
  description: { type: String },
  content: { type: mongoose.Schema.Types.Mixed }, // Flexible content storage
  image: { type: String },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Content', contentSchema);
