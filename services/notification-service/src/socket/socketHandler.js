const logger = require('../utils/logger');
const { sendUnreadCount } = require('../services/socketService');
const { getUserNotifications, markAsRead, markAllAsRead } = require('../services/notificationService');

/**
 * Socket.IO event handlers for real-time notifications
 */
module.exports = (io) => {
  io.on('connection', async (socket) => {
    const userId = socket.user?.userId;
    
    if (!userId) {
      logger.warn('Socket connection without userId', { socketId: socket.id });
      socket.disconnect();
      return;
    }

    logger.info('User connected to notification service', {
      userId,
      socketId: socket.id,
      userRole: socket.user?.role
    });

    // Join user's personal room
    socket.join(`user:${userId}`);

    try {
      // Send current unread count on connection
      await sendUnreadCount(userId);

      // Send recent notifications
      const notifications = await getUserNotifications(userId, {
        page: 1,
        limit: 20,
        unreadOnly: false
      });

      socket.emit('initial-notifications', {
        notifications: notifications.notifications,
        unreadCount: notifications.unreadCount,
        hasMore: notifications.hasMore
      });
    } catch (error) {
      logger.error('Error sending initial notifications', {
        userId,
        error: error.message
      });
    }

    // Handle request for more notifications (pagination)
    socket.on('get-notifications', async (data, callback) => {
      try {
        const { page = 1, limit = 20, unreadOnly = false } = data || {};
        
        const result = await getUserNotifications(userId, {
          page,
          limit,
          unreadOnly
        });

        if (callback && typeof callback === 'function') {
          callback({
            success: true,
            data: result
          });
        } else {
          socket.emit('notifications-list', result);
        }
      } catch (error) {
        logger.error('Error fetching notifications', {
          userId,
          error: error.message
        });
        
        if (callback && typeof callback === 'function') {
          callback({
            success: false,
            error: 'Failed to fetch notifications'
          });
        }
      }
    });

    // Handle mark as read
    socket.on('mark-read', async (data, callback) => {
      try {
        const { notificationId } = data || {};
        
        if (!notificationId) {
          throw new Error('Notification ID is required');
        }

        await markAsRead(notificationId, userId);
        await sendUnreadCount(userId);

        if (callback && typeof callback === 'function') {
          callback({
            success: true,
            message: 'Notification marked as read'
          });
        }

        logger.info('Notification marked as read', {
          userId,
          notificationId
        });
      } catch (error) {
        logger.error('Error marking notification as read', {
          userId,
          error: error.message
        });
        
        if (callback && typeof callback === 'function') {
          callback({
            success: false,
            error: error.message
          });
        }
      }
    });

    // Handle mark all as read
    socket.on('mark-all-read', async (callback) => {
      try {
        const result = await markAllAsRead(userId);
        await sendUnreadCount(userId);

        if (callback && typeof callback === 'function') {
          callback({
            success: true,
            message: `${result.modifiedCount} notifications marked as read`
          });
        }

        logger.info('All notifications marked as read', {
          userId,
          count: result.modifiedCount
        });
      } catch (error) {
        logger.error('Error marking all notifications as read', {
          userId,
          error: error.message
        });
        
        if (callback && typeof callback === 'function') {
          callback({
            success: false,
            error: error.message
          });
        }
      }
    });

    // Handle test notification (for development)
    if (process.env.NODE_ENV === 'development') {
      socket.on('test-notification', async (data, callback) => {
        try {
          const { type = 'SYSTEM_NOTIFICATION', title, message } = data || {};
          
          socket.emit('notification', {
            type,
            title: title || 'Test Notification',
            message: message || 'This is a test notification',
            timestamp: new Date(),
            priority: 'medium',
            read: false
          });

          if (callback && typeof callback === 'function') {
            callback({
              success: true,
              message: 'Test notification sent'
            });
          }
        } catch (error) {
          logger.error('Error sending test notification', {
            userId,
            error: error.message
          });
          
          if (callback && typeof callback === 'function') {
            callback({
              success: false,
              error: error.message
            });
          }
        }
      });
    }

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info('User disconnected from notification service', {
        userId,
        socketId: socket.id,
        reason
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error', {
        userId,
        socketId: socket.id,
        error: error.message
      });
    });
  });

  logger.info('Socket.IO notification handlers initialized');
};
