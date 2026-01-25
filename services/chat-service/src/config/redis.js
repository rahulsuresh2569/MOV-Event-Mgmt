const redis = require('redis');
const logger = require('../utils/logger');

// Redis client for publishing events
let redisPublisher = null;

/**
 * Initialize Redis publisher
 */
const initializeRedis = async () => {
  try {
    redisPublisher = redis.createClient({
      url: process.env.REDIS_URL || 'redis://redis:6379',
    });

    redisPublisher.on('error', (err) => {
      logger.error('Redis Publisher Error:', err);
    });

    redisPublisher.on('connect', () => {
      logger.info('Redis Publisher connected');
    });

    await redisPublisher.connect();
    logger.info('Redis Publisher initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Redis Publisher:', error);
    throw error;
  }
};

/**
 * Publish event to Redis channel
 * @param {string} channel - The channel name
 * @param {object} data - The event data
 */
const publishEvent = async (channel, data) => {
  try {
    if (!redisPublisher || !redisPublisher.isOpen) {
      logger.warn('Redis Publisher not available, skipping event publish');
      return;
    }

    await redisPublisher.publish(channel, JSON.stringify(data));
    logger.debug(`Event published to ${channel}:`, data);
  } catch (error) {
    logger.error(`Failed to publish event to ${channel}:`, error);
  }
};

/**
 * Close Redis connection
 */
const closeRedis = async () => {
  if (redisPublisher && redisPublisher.isOpen) {
    await redisPublisher.quit();
    logger.info('Redis Publisher disconnected');
  }
};

module.exports = {
  initializeRedis,
  publishEvent,
  closeRedis,
  getPublisher: () => redisPublisher,
};
