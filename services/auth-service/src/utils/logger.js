const winston = require('winston');

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(logColors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

const transports = [
  new winston.transports.Console(),

  // ONLY errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),

  // ALL logs (info + warn + error etc.)
  new winston.transports.File({ filename: 'logs/all.log' }),

  // ALERTS for critical failures (we will write here for 5xx)
  new winston.transports.File({
    filename: 'logs/alerts.log',
    level: 'error',
  }),
];


const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format,
  transports,
});
// Alert helper for critical failures
const alertCritical = (payload) => {
  console.error('🚨 CRITICAL ALERT 🚨', payload);

  logger.error(
    JSON.stringify({
      alert: true,
      severity: 'CRITICAL',
      ...payload,
    })
  );
};

module.exports = {
  ...logger,
  alertCritical,
};

