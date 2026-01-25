const Notification = require('../models/Notification');
const UserPreference = require('../models/UserPreference');
const logger = require('../utils/logger');
const { sendToUser } = require('./socketService');

/**
 * Create a new notification
 */
const createNotification = async (userId, notificationData) => {
  try {
    // Get user preferences
    const preferences = await UserPreference.getOrCreate(userId);

    // Check if user wants this type of notification
    if (!preferences.shouldNotify(notificationData.type, 'push')) {
      logger.info('Notification skipped due to user preferences', {
        userId,
        type: notificationData.type
      });
      return null;
    }

    // Check quiet hours (skip for critical notifications)
    if (notificationData.priority !== 'critical' && preferences.isQuietHours()) {
      logger.info('Notification skipped due to quiet hours', {
        userId,
        type: notificationData.type
      });
      return null;
    }

    // Create notification
    const notification = new Notification({
      userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      priority: notificationData.priority || 'medium',
      data: notificationData.data || {},
      channel: 'push'
    });

    await notification.save();

    logger.info('Notification created', {
      userId,
      notificationId: notification._id,
      type: notification.type
    });

    // Send real-time notification via WebSocket
    await sendToUser(userId, notification);

    return notification;
  } catch (error) {
    logger.error('Error creating notification', {
      userId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Get notifications for a user with pagination
 */
const getUserNotifications = async (userId, options = {}) => {
  try {
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type
    } = options;

    const query = { userId };

    if (unreadOnly) {
      query.read = false;
    }

    if (type) {
      query.type = type;
    }

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.getUnreadCount(userId)
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      unreadCount,
      hasMore: skip + notifications.length < total
    };
  } catch (error) {
    logger.error('Error getting user notifications', {
      userId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Mark a notification as read
 */
const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      userId
    });

    if (!notification) {
      return null;
    }

    if (!notification.read) {
      await notification.markAsRead();
      logger.info('Notification marked as read', {
        userId,
        notificationId
      });
    }

    return notification;
  } catch (error) {
    logger.error('Error marking notification as read', {
      userId,
      notificationId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
  try {
    const result = await Notification.markAllAsRead(userId);
    
    logger.info('All notifications marked as read', {
      userId,
      count: result.modifiedCount
    });

    return result;
  } catch (error) {
    logger.error('Error marking all notifications as read', {
      userId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (userId) => {
  try {
    return await Notification.getUnreadCount(userId);
  } catch (error) {
    logger.error('Error getting unread count', {
      userId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Get user preferences
 */
const getUserPreferences = async (userId) => {
  try {
    return await UserPreference.getOrCreate(userId);
  } catch (error) {
    logger.error('Error getting user preferences', {
      userId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Update user preferences
 */
const updateUserPreferences = async (userId, updates) => {
  try {
    const preferences = await UserPreference.getOrCreate(userId);
    
    // Update fields
    Object.keys(updates).forEach(key => {
      if (key === 'preferences' && typeof updates[key] === 'object') {
        preferences.preferences = {
          ...preferences.preferences,
          ...updates[key]
        };
      } else if (key === 'quietHours' && typeof updates[key] === 'object') {
        preferences.quietHours = {
          ...preferences.quietHours,
          ...updates[key]
        };
      } else {
        preferences[key] = updates[key];
      }
    });

    await preferences.save();

    logger.info('User preferences updated', {
      userId,
      updates: Object.keys(updates)
    });

    return preferences;
  } catch (error) {
    logger.error('Error updating user preferences', {
      userId,
      error: error.message
    });
    throw error;
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getUserPreferences,
  updateUserPreferences
};
