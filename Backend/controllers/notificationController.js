const notificationService = require('../services/notificationService');
const logger = require('../services/loggerService');

exports.getNotifications = async (req, res) => {
  try {
    const { page, limit, unreadOnly } = req.query;
    const result = await notificationService.getUserNotifications(req.user._id, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      unreadOnly: unreadOnly === 'true',
    });

    res.json(result);
  } catch (error) {
    logger.error('Error getting notifications', { error: error.message });
    res.status(500).json({ message: 'Error fetching notifications' });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(
      req.params.id,
      req.user._id
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read', notification });
  } catch (error) {
    logger.error('Error marking notification as read', { error: error.message });
    res.status(500).json({ message: 'Error updating notification' });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user._id);

    res.json({
      message: 'All notifications marked as read',
      count: result.modifiedCount,
    });
  } catch (error) {
    logger.error('Error marking all notifications as read', { error: error.message });
    res.status(500).json({ message: 'Error updating notifications' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notification = await notificationService.deleteNotification(
      req.params.id,
      req.user._id
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    logger.error('Error deleting notification', { error: error.message });
    res.status(500).json({ message: 'Error deleting notification' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const Notification = require('../models/Notification');
    const count = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.json({ count });
  } catch (error) {
    logger.error('Error getting unread count', { error: error.message });
    res.status(500).json({ message: 'Error fetching unread count' });
  }
};
