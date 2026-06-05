const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const writeLog = (filename, message) => {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(path.join(logDir, filename), formattedMessage);
};

const logger = {
  info: (message) => {
    console.log(`\x1b[36m[INFO]\x1b[0m ${message}`);
    writeLog('combined.log', `INFO: ${message}`);
  },
  warn: (message) => {
    console.warn(`\x1b[33m[WARN]\x1b[0m ${message}`);
    writeLog('combined.log', `WARN: ${message}`);
  },
  error: (message, stack = '') => {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${message} ${stack}`);
    writeLog('combined.log', `ERROR: ${message} - ${stack}`);
    writeLog('errors.log', `ERROR: ${message} - ${stack}`);
  }
};

module.exports = logger;
