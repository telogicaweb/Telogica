const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  department: { 
    type: String, 
    enum: ['Leadership', 'Engineering', 'Sales', 'Operations', 'Finance']
  },
  image: { type: String, required: true },
  bio: { type: String },
  email: { type: String },
  linkedin: { type: String },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
