const activityLogService = require('../services/activityLogService');
const logger = require('../services/loggerService');

exports.getMyActivityLogs = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await activityLogService.getUserActivityLogs(req.user._id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
    });

    res.json(result);
  } catch (error) {
    logger.error('Error getting user activity logs', { error: error.message });
    res.status(500).json({ message: 'Error fetching activity logs' });
  }
};

exports.getAllActivityLogs = async (req, res) => {
  try {
    const { page, limit, action, entity, userId, startDate, endDate } = req.query;

    const result = await activityLogService.getAllActivityLogs({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      action,
      entity,
      userId,
      startDate,
      endDate,
    });

    res.json(result);
  } catch (error) {
    logger.error('Error getting all activity logs', { error: error.message });
    res.status(500).json({ message: 'Error fetching activity logs' });
  }
};

exports.getActivityStats = async (req, res) => {
  try {
    const { userId } = req.query;
    const result = await activityLogService.getActivityStats(userId);

    res.json(result);
  } catch (error) {
    logger.error('Error getting activity stats', { error: error.message });
    res.status(500).json({ message: 'Error fetching activity statistics' });
  }
};

exports.getMyActivityStats = async (req, res) => {
  try {
    const result = await activityLogService.getActivityStats(req.user._id);

    res.json(result);
  } catch (error) {
    logger.error('Error getting user activity stats', { error: error.message });
    res.status(500).json({ message: 'Error fetching activity statistics' });
  }
};
