const AdminLog = require('../models/AdminLog');

/**
 * Log admin CRUD action for Product, Order, Warranty, or Payment
 * @param {Object} req - Express request object
 * @param {String} action - Action performed ('CREATE', 'UPDATE', 'DELETE')
 * @param {String} entity - Entity affected ('Product', 'Order', 'Warranty', 'Payment')
 * @param {String} entityId - ID of the entity
 * @param {Object} details - Additional details about the action
 */
const logAdminAction = async (req, action, entity, entityId = null, details = null) => {
  try {
    // Only log if user is authenticated and is admin
    if (!req.user || req.user.role !== 'admin') {
      return;
    }

    // Only log CRUD operations for core entities
    const validActions = ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT'];
    const validEntities = ['Product', 'Order', 'Warranty', 'Payment'];
    
    if (!validActions.includes(action) || !validEntities.includes(entity)) {
      return;
    }

    const logEntry = new AdminLog({
      adminId: req.user._id,
      adminName: req.user.name,
      adminEmail: req.user.email,
      action,
      entity,
      entityId: entityId ? entityId.toString() : null,
      details,
      ipAddress: req.ip || req.connection.remoteAddress
    });

    await logEntry.save();

  } catch (error) {
    console.error('Error logging admin action:', error);
    // Don't throw error to prevent blocking the main request
  }
};

module.exports = { logAdminAction };
