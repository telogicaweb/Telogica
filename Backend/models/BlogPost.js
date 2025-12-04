const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['Telecom', 'Defence', 'Railway', 'Technology', 'Innovation']
  },
  image: { type: String, required: true },
  readTime: { type: String, default: '5 min read' },
  tags: [{ type: String }],
  isPublished: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  publishDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('BlogPost', blogPostSchema);
