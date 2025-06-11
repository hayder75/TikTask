const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/tiktok-scraping.log', level: 'info' }),
    new winston.transports.Console({ format: winston.format.simple() }),
  ],
});

module.exports = logger;

//Logs scraping successes, failures, and errors to a file and console for debugging and monitoring