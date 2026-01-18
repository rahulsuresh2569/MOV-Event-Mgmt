const winston = require("winston");
const path = require("path");

// Where logs will be stored
const logDir = path.join(__dirname, "../../logs");

// Create logger
const logger = winston.createLogger({
  level: "info",

  // Log format
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),

  // Where logs go
  transports: [
    // Errors only
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
    }),

    // All logs
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
    }),
  ],
});

// Show logs in terminal during development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

module.exports = logger;
