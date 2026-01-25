const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const logger = require('../utils/logger');
const { formatSuccess, formatError } = require('../utils/responseFormatter');
const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  getUserPreferences,
  updateUserPreferences
} = require('../services/notificationService');

/**
 * @route   GET /api/notifications
 * @desc    Get user's notifications with pagination and filtering
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      page = 1,
      limit = 20,
      unreadOnly = false,
      type
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
      type
    };

    const result = await getUserNotifications(userId, options);

    logger.info('Notifications retrieved', {
      userId,
      page: options.page,
      count: result.notifications.length
    });

    res.json(formatSuccess(result, 'Notifications retrieved successfully'));
  } catch (error) {
    logger.error('Error retrieving notifications', {
      userId: req.user?.userId,
      error: error.message
    });
    res.status(500).json(formatError('Failed to retrieve notifications', error));
  }
});

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get count of unread notifications
 * @access  Private
 */
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await getUnreadCount(userId);

    res.json(formatSuccess({ count }, 'Unread count retrieved successfully'));
  } catch (error) {
    logger.error('Error retrieving unread count', {
      userId: req.user?.userId,
      error: error.message
    });
    res.status(500).json(formatError('Failed to retrieve unread count', error));
  }
});

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private
 */
router.put('/:id/read', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = req.params.id;

    const notification = await markAsRead(notificationId, userId);

    if (!notification) {
      return res.status(404).json(formatError('Notification not found'));
    }

    logger.info('Notification marked as read', {
      userId,
      notificationId
    });

    res.json(formatSuccess(notification, 'Notification marked as read'));
  } catch (error) {
    logger.error('Error marking notification as read', {
      userId: req.user?.userId,
      notificationId: req.params?.id,
      error: error.message
    });
    res.status(500).json(formatError('Failed to mark notification as read', error));
  }
});

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put('/read-all', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await markAllAsRead(userId);

    logger.info('All notifications marked as read', {
      userId,
      count: result.modifiedCount
    });

    res.json(formatSuccess(
      { count: result.modifiedCount },
      `${result.modifiedCount} notifications marked as read`
    ));
  } catch (error) {
    logger.error('Error marking all notifications as read', {
      userId: req.user?.userId,
      error: error.message
    });
    res.status(500).json(formatError('Failed to mark notifications as read', error));
  }
});

/**
 * @route   GET /api/notifications/preferences
 * @desc    Get user's notification preferences
 * @access  Private
 */
router.get('/preferences', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const preferences = await getUserPreferences(userId);

    res.json(formatSuccess(preferences, 'Preferences retrieved successfully'));
  } catch (error) {
    logger.error('Error retrieving preferences', {
      userId: req.user?.userId,
      error: error.message
    });
    res.status(500).json(formatError('Failed to retrieve preferences', error));
  }
});

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Update user's notification preferences
 * @access  Private
 */
router.put('/preferences', auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const updates = req.body;

    const preferences = await updateUserPreferences(userId, updates);

    logger.info('User preferences updated', {
      userId,
      updates: Object.keys(updates)
    });

    res.json(formatSuccess(preferences, 'Preferences updated successfully'));
  } catch (error) {
    logger.error('Error updating preferences', {
      userId: req.user?.userId,
      error: error.message
    });
    res.status(500).json(formatError('Failed to update preferences', error));
  }
});

/**
 * @route   GET /api/notifications/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json(formatSuccess({ status: 'healthy' }, 'Notification service is running'));
});

module.exports = router;
