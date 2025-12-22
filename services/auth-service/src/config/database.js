const { Sequelize } = require('sequelize');
const logger = require('../../../shared/utils/logger');

const sequelize = new Sequelize(
  process.env.POSTGRES_DB || 'mov_auth',
  process.env.POSTGRES_USER || 'admin',
  process.env.POSTGRES_PASSWORD || 'dev123',
  {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('PostgreSQL connection established successfully');
  } catch (error) {
    logger.error('Unable to connect to PostgreSQL:', error);
    throw error;
  }
};

module.exports = { sequelize, testConnection };
