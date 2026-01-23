const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.POSTGRES_DB,
  process.env.POSTGRES_USER,
  process.env.POSTGRES_PASSWORD,
  {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
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
  logger.error('CRITICAL: Unable to connect to PostgreSQL', {
    service: 'auth-service',
    component: 'database',
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    db: process.env.POSTGRES_DB,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
  });
  throw error;
}

};

module.exports = { sequelize, testConnection };
