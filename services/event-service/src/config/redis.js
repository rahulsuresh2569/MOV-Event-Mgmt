const redis = require('redis');
const logger = require('../utils/logger');

let redisClient = null;

const connectRedis = async () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return retries * 1000;
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    await redisClient.connect();
    logger.info('Redis initialized successfully');

  } catch (error) {
    logger.error('Failed to connect to Redis', {
      error: error.message,
      stack: error.stack
    });
    // Don't throw - allow service to start without Redis
    logger.warn('Service starting without Redis event publishing');
  }
};

const disconnectRedis = async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis client disconnected');
    }
  } catch (error) {
    logger.error('Error disconnecting Redis', { error: error.message });
  }
};

const getRedisClient = () => {
  return redisClient;
};

const publishEvent = async (eventType, data) => {
  try {
    if (!redisClient || !redisClient.isReady) {
      logger.warn('Redis client not ready, skipping event publish', { eventType });
      return false;
    }

    const event = {
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    };

    await redisClient.publish('events', JSON.stringify(event));
    logger.info('Event published to Redis', { type: eventType });
    return true;

  } catch (error) {
    logger.error('Error publishing event to Redis', {
      eventType,
      error: error.message
    });
    return false;
  }
};

module.exports = {
  connectRedis,
  disconnectRedis,
  getRedisClient,
  publishEvent
};
