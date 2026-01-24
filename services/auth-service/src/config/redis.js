const { createClient } = require('redis');
const logger = require('../utils/logger');

const REDIS_HOST = process.env.REDIS_HOST || 'mov-redis';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const redisClient = createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
});

redisClient.on('error', (err) => logger.error(`Redis error: ${err.message}`));
redisClient.on('connect', () => logger.info('Redis connected'));

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

module.exports = { redisClient, connectRedis };
