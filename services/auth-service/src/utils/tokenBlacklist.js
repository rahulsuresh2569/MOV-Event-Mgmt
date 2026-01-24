const { redisClient, connectRedis } = require('../config/redis');

const BLACKLIST_PREFIX = 'bl:jwt:'; // key prefix

const blacklistToken = async (jti, ttlSeconds) => {
  if (!jti) throw new Error('Missing token jti');
  await connectRedis();

  const key = `${BLACKLIST_PREFIX}${jti}`;

  // store "1" as value with expiry
  await redisClient.set(key, '1', { EX: ttlSeconds });
};

module.exports = { blacklistToken, BLACKLIST_PREFIX };
