const winston = require('winston');
const fs = require('fs');
const path = require('path');

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

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

  // normal errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),

  // everything
  new winston.transports.File({
    filename: 'logs/all.log',
  }),

  // alerts for critical failures (we will write to this explicitly)
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

// helper for alerting (critical failures)
logger.alertCritical = (payload) => {
  logger.error(
    JSON.stringify({
      alert: true,
      severity: 'CRITICAL',
      ...payload,
    })
  );
};

module.exports = logger;
