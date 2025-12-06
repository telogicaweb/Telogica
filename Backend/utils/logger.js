const AdminLog = require('../models/AdminLog');

/**
 * Log admin action
 * @param {Object} req - Express request object
 * @param {String} action - Action performed (e.g., 'CREATE', 'UPDATE', 'DELETE')
 * @param {String} entity - Entity affected (e.g., 'Product', 'Order')
 * @param {String} entityId - ID of the entity
 * @param {Object} details - Additional details about the action
 */
const logAdminAction = async (req, action, entity, entityId = null, details = null) => {
  try {
    // Ensure user is authenticated and is an admin (or authorized user)
    if (!req.user) {
      console.warn('Attempted to log admin action without user context');
      return;
    }

    const logEntry = new AdminLog({
      adminId: req.user._id,
      adminName: req.user.name,
      action,
      entity,
      entityId: entityId ? entityId.toString() : null,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent')
    });

    await logEntry.save();
  } catch (error) {
    console.error('Error logging admin action:', error);
    // Don't throw error to prevent blocking the main request
  }
};

module.exports = { logAdminAction };
