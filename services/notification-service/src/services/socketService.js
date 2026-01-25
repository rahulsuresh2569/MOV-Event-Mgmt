const logger = require('../utils/logger');

let io = null;
const connectedUsers = new Map(); // userId -> Set of socketIds

/**
 * Initialize the socket service with Socket.IO instance
 */
const initializeSocketService = (socketIo) => {
  io = socketIo;
  logger.info('Socket service initialized');
};

/**
 * Track user connection
 */
const addUserConnection = (userId, socketId) => {
  if (!connectedUsers.has(userId)) {
    connectedUsers.set(userId, new Set());
  }
  connectedUsers.get(userId).add(socketId);
  
  logger.debug('User connection tracked', {
    userId,
    socketId,
    totalConnections: connectedUsers.get(userId).size
  });
};

/**
 * Remove user connection
 */
const removeUserConnection = (userId, socketId) => {
  if (connectedUsers.has(userId)) {
    connectedUsers.get(userId).delete(socketId);
    
    if (connectedUsers.get(userId).size === 0) {
      connectedUsers.delete(userId);
    }
    
    logger.debug('User connection removed', {
      userId,
      socketId,
      remainingConnections: connectedUsers.get(userId)?.size || 0
    });
  }
};

/**
 * Check if user is connected
 */
const isUserConnected = (userId) => {
  return connectedUsers.has(userId) && connectedUsers.get(userId).size > 0;
};

/**
 * Get all socket IDs for a user
 */
const getUserSockets = (userId) => {
  return Array.from(connectedUsers.get(userId) || []);
};

/**
 * Send notification to a specific user
 */
const sendToUser = async (userId, notification) => {
  if (!io) {
    logger.warn('Socket.IO not initialized');
    return false;
  }

  try {
    // Send to user's room
    io.to(`user:${userId}`).emit('notification', {
      id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      data: notification.data,
      read: notification.read,
      createdAt: notification.createdAt
    });

    // Update unread count
    await sendUnreadCount(userId);

    logger.info('Notification sent to user', {
      userId,
      notificationId: notification._id,
      type: notification.type,
      connected: isUserConnected(userId)
    });

    return true;
  } catch (error) {
    logger.error('Error sending notification to user', {
      userId,
      notificationId: notification._id,
      error: error.message
    });
    return false;
  }
};

/**
 * Send notification to multiple users
 */
const sendToUsers = async (userIds, notification) => {
  if (!io) {
    logger.warn('Socket.IO not initialized');
    return;
  }

  const promises = userIds.map(userId => sendToUser(userId, notification));
  await Promise.allSettled(promises);
};

/**
 * Send unread count update to user
 */
const sendUnreadCount = async (userId) => {
  if (!io) {
    return;
  }

  try {
    // Lazy load to avoid circular dependency
    const { getUnreadCount } = require('./notificationService');
    const count = await getUnreadCount(userId);
    
    io.to(`user:${userId}`).emit('unread-count', {
      count,
      timestamp: new Date()
    });

    logger.debug('Unread count sent', { userId, count });
  } catch (error) {
    logger.error('Error sending unread count', {
      userId,
      error: error.message
    });
  }
};

/**
 * Get statistics about connected users
 */
const getConnectionStats = () => {
  return {
    totalUsers: connectedUsers.size,
    totalConnections: Array.from(connectedUsers.values())
      .reduce((sum, sockets) => sum + sockets.size, 0)
  };
};

module.exports = {
  initializeSocketService,
  addUserConnection,
  removeUserConnection,
  isUserConnected,
  getUserSockets,
  sendToUser,
  sendToUsers,
  sendUnreadCount,
  getConnectionStats
};
