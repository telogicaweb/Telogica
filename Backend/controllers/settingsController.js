const Settings = require('../models/Settings');
const { logAdminAction } = require('../utils/logger');

// Get all settings
const getSettings = async (req, res) => {
  try {
    const settings = await Settings.find();
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get specific setting
const getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await Settings.findOne({ key });
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update setting (Admin only)
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;

    const setting = await Settings.findOneAndUpdate(
      { key },
      { 
        value, 
        description,
        updatedBy: req.user._id 
      },
      { new: true, upsert: true }
    );

    // Log admin action
    await logAdminAction(req, 'UPDATE', 'Settings', setting._id, {
      key,
      value,
      description
    });

    res.json(setting);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Initialize default settings
const initializeSettings = async (req, res) => {
  try {
    const defaults = [
      { key: 'taxPercentage', value: 18, description: 'GST/Tax percentage' },
      { key: 'shippingCharge', value: 0, description: 'Shipping charge' },
      { key: 'minOrderValue', value: 0, description: 'Minimum order value' }
    ];

    for (const def of defaults) {
      await Settings.findOneAndUpdate(
        { key: def.key },
        { ...def, updatedBy: req.user._id },
        { upsert: true }
      );
    }

    res.json({ message: 'Settings initialized successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSettings,
  getSetting,
  updateSetting,
  initializeSettings
};
