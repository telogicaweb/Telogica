const Notification = require('../models/Notification');
const { emitToUser, emitToAdmins } = require('./socketService');
const logger = require('./loggerService');

const createNotification = async ({
  recipient,
  sender = null,
  type,
  title,
  message,
  link = null,
  relatedEntity = null,
  relatedEntityId = null,
  priority = 'MEDIUM',
  metadata = {},
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      link,
      relatedEntity,
      relatedEntityId,
      priority,
      metadata,
    });

    emitToUser(recipient.toString(), 'notification', {
      id: notification._id,
      type,
      title,
      message,
      link,
      priority,
      createdAt: notification.createdAt,
    });

    logger.info('Notification created', {
      notificationId: notification._id,
      recipient,
      type,
    });

    return notification;
  } catch (error) {
    logger.error('Error creating notification', { error: error.message });
    throw error;
  }
};

const createBulkNotifications = async (notifications) => {
  try {
    const createdNotifications = await Notification.insertMany(notifications);

    createdNotifications.forEach((notification) => {
      emitToUser(notification.recipient.toString(), 'notification', {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        priority: notification.priority,
        createdAt: notification.createdAt,
      });
    });

    logger.info('Bulk notifications created', {
      count: createdNotifications.length,
    });

    return createdNotifications;
  } catch (error) {
    logger.error('Error creating bulk notifications', { error: error.message });
    throw error;
  }
};

const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (notification) {
      emitToUser(userId.toString(), 'notification:read', {
        notificationId: notification._id,
      });
    }

    return notification;
  } catch (error) {
    logger.error('Error marking notification as read', { error: error.message });
    throw error;
  }
};

const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    emitToUser(userId.toString(), 'notifications:all-read', {
      count: result.modifiedCount,
    });

    return result;
  } catch (error) {
    logger.error('Error marking all notifications as read', { error: error.message });
    throw error;
  }
};

const getUserNotifications = async (userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
  try {
    const query = { recipient: userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('sender', 'name email');

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return {
      notifications,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      unreadCount,
    };
  } catch (error) {
    logger.error('Error getting user notifications', { error: error.message });
    throw error;
  }
};

const deleteNotification = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: userId,
    });

    if (notification) {
      emitToUser(userId.toString(), 'notification:deleted', {
        notificationId: notification._id,
      });
    }

    return notification;
  } catch (error) {
    logger.error('Error deleting notification', { error: error.message });
    throw error;
  }
};

const notifyAdmins = async ({
  type,
  title,
  message,
  link = null,
  relatedEntity = null,
  relatedEntityId = null,
  priority = 'MEDIUM',
  metadata = {},
}) => {
  try {
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin' }).select('_id');

    const notifications = admins.map(admin => ({
      recipient: admin._id,
      type,
      title,
      message,
      link,
      relatedEntity,
      relatedEntityId,
      priority,
      metadata,
    }));

    const created = await createBulkNotifications(notifications);

    emitToAdmins('admin-notification', {
      type,
      title,
      message,
      link,
      priority,
    });

    return created;
  } catch (error) {
    logger.error('Error notifying admins', { error: error.message });
    throw error;
  }
};

module.exports = {
  createNotification,
  createBulkNotifications,
  markAsRead,
  markAllAsRead,
  getUserNotifications,
  deleteNotification,
  notifyAdmins,
};
