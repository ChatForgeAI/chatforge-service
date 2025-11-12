const winston = require('winston');

// Create the logger with colorized console output
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),  // Add colorize to make logs colorful
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console(),  // Log to console with color
        new winston.transports.File({ filename: '../../storage/logger.log' })  // Log to a file without color
    ],
});

// Log functions
exports.logIInfo = (message) => {
    logger.info(message);
};

exports.logError = (message) => {
    logger.error(message);
};
