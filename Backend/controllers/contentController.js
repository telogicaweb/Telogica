const Content = require('../models/Content');

// @desc    Get all content
// @route   GET /api/content
// @access  Public
const getAllContent = async (req, res) => {
  try {
    const { section } = req.query;
    const filter = section ? { section, isActive: true } : { isActive: true };
    const content = await Content.find(filter).sort({ order: 1 });
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get content by section
// @route   GET /api/content/:section
// @access  Public
const getContentBySection = async (req, res) => {
  try {
    const content = await Content.find({ 
      section: req.params.section, 
      isActive: true 
    }).sort({ order: 1 });
    res.json(content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create content
// @route   POST /api/content
// @access  Private/Admin
const createContent = async (req, res) => {
  try {
    const content = new Content(req.body);
    const createdContent = await content.save();
    res.status(201).json(createdContent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update content
// @route   PUT /api/content/:id
// @access  Private/Admin
const updateContent = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (content) {
      Object.assign(content, req.body);
      const updatedContent = await content.save();
      res.json(updatedContent);
    } else {
      res.status(404).json({ message: 'Content not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete content
// @route   DELETE /api/content/:id
// @access  Private/Admin
const deleteContent = async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    if (content) {
      await content.deleteOne();
      res.json({ message: 'Content removed' });
    } else {
      res.status(404).json({ message: 'Content not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  getAllContent, 
  getContentBySection, 
  createContent, 
  updateContent, 
  deleteContent 
};
