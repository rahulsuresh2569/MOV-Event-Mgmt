const redis = require('redis');
const logger = require('../utils/logger');

let redisClient = null;
let subscriber = null;

const connectRedis = async () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    // Create main client for publishing
    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return retries * 1000; // Exponential backoff
        }
      }
    });

    // Create separate client for subscribing
    subscriber = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis subscriber max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          return retries * 1000;
        }
      }
    });

    // Event handlers for main client
    redisClient.on('error', (err) => {
      logger.error('Redis client error', { error: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis client reconnecting');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    // Event handlers for subscriber
    subscriber.on('error', (err) => {
      logger.error('Redis subscriber error', { error: err.message });
    });

    subscriber.on('connect', () => {
      logger.info('Redis subscriber connected');
    });

    subscriber.on('reconnecting', () => {
      logger.warn('Redis subscriber reconnecting');
    });

    subscriber.on('ready', () => {
      logger.info('Redis subscriber ready');
    });

    // Connect both clients
    await redisClient.connect();
    await subscriber.connect();

    logger.info('Redis clients connected successfully');

  } catch (error) {
    logger.error('Failed to connect to Redis', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

const disconnectRedis = async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('Redis client disconnected');
    }
    
    if (subscriber) {
      await subscriber.quit();
      logger.info('Redis subscriber disconnected');
    }
  } catch (error) {
    logger.error('Error disconnecting Redis', { error: error.message });
    throw error;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

const getSubscriber = () => {
  if (!subscriber) {
    throw new Error('Redis subscriber not initialized');
  }
  return subscriber;
};

module.exports = {
  connectRedis,
  disconnectRedis,
  getRedisClient,
  getSubscriber
};
