const ActivityLog = require('../models/ActivityLog');
const logger = require('./loggerService');

const logActivity = async ({
  userId,
  action,
  entity = 'Other',
  entityId = null,
  details = '',
  metadata = {},
  ipAddress = null,
  userAgent = null,
  status = 'SUCCESS',
  errorMessage = null,
}) => {
  try {
    const activityLog = await ActivityLog.create({
      user: userId,
      action,
      entity,
      entityId,
      details,
      metadata,
      ipAddress,
      userAgent,
      status,
      errorMessage,
    });

    logger.info('Activity logged', {
      userId,
      action,
      entity,
      status,
    });

    return activityLog;
  } catch (error) {
    logger.error('Error logging activity', { error: error.message });
  }
};

const getUserActivityLogs = async (userId, { page = 1, limit = 50 } = {}) => {
  try {
    const logs = await ActivityLog.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('user', 'name email role');

    const total = await ActivityLog.countDocuments({ user: userId });

    return {
      logs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    };
  } catch (error) {
    logger.error('Error getting user activity logs', { error: error.message });
    throw error;
  }
};

const getAllActivityLogs = async ({
  page = 1,
  limit = 50,
  action = null,
  entity = null,
  userId = null,
  startDate = null,
  endDate = null,
} = {}) => {
  try {
    const query = {};

    if (action) query.action = action;
    if (entity) query.entity = entity;
    if (userId) query.user = userId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('user', 'name email role');

    const total = await ActivityLog.countDocuments(query);

    return {
      logs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    };
  } catch (error) {
    logger.error('Error getting activity logs', { error: error.message });
    throw error;
  }
};

const getActivityStats = async (userId = null) => {
  try {
    const matchStage = userId ? { user: userId } : {};

    const stats = await ActivityLog.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          lastActivity: { $max: '$createdAt' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const totalActivities = await ActivityLog.countDocuments(matchStage);
    const successCount = await ActivityLog.countDocuments({
      ...matchStage,
      status: 'SUCCESS',
    });
    const failureCount = await ActivityLog.countDocuments({
      ...matchStage,
      status: 'FAILURE',
    });

    return {
      totalActivities,
      successCount,
      failureCount,
      successRate: totalActivities > 0 ? (successCount / totalActivities) * 100 : 0,
      actionBreakdown: stats,
    };
  } catch (error) {
    logger.error('Error getting activity stats', { error: error.message });
    throw error;
  }
};

module.exports = {
  logActivity,
  getUserActivityLogs,
  getAllActivityLogs,
  getActivityStats,
};
