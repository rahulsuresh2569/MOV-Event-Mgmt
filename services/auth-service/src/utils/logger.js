const winston = require('winston');
const fs = require('fs');
const path = require('path');

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

// ✅ Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`)
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format,
  transports: [
    new winston.transports.Console(),

    // ONLY errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),

    // ALL logs (info + warn + error etc.)
    new winston.transports.File({
      filename: 'logs/all.log',
    }),

    // ALERTS only (critical failures)
    new winston.transports.File({
      filename: 'logs/alerts.log',
      level: 'error',
    }),
  ],
});

// ✅ Alert helper: write ONLY to alerts.log (not to error.log)
logger.alertCritical = (payload) => {
  // Show clearly in container console
  console.error('🚨 CRITICAL ALERT 🚨', payload);

  // Write only into alerts.log
  logger.log({
    level: 'error',
    message: JSON.stringify({
      alert: true,
      severity: 'CRITICAL',
      ...payload,
    }),
    // ✅ route ONLY to alerts.log transport
    transports: [logger.transports.find((t) => t.filename && t.filename.includes('alerts.log'))],
  });
};

module.exports = logger;
