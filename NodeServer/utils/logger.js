const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = 'logs';
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };
    return JSON.stringify(logMessage);
  }

  writeToFile(level, content) {
    if (process.env.NODE_ENV === 'production') {
      const filename = `${level}-${new Date().toISOString().split('T')[0]}.log`;
      const filepath = path.join(this.logDir, filename);
      fs.appendFileSync(filepath, content + '\n');
    }
  }

  info(message, data = null) {
    const formatted = this.formatMessage('INFO', message, data);
    console.log('\x1b[32m%s\x1b[0m', formatted); // Green
    this.writeToFile('info', formatted);
  }

  warn(message, data = null) {
    const formatted = this.formatMessage('WARN', message, data);
    console.warn('\x1b[33m%s\x1b[0m', formatted); // Yellow
    this.writeToFile('warn', formatted);
  }

  error(message, data = null) {
    const formatted = this.formatMessage('ERROR', message, data);
    console.error('\x1b[31m%s\x1b[0m', formatted); // Red
    this.writeToFile('error', formatted);
  }

  debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      const formatted = this.formatMessage('DEBUG', message, data);
      console.log('\x1b[36m%s\x1b[0m', formatted); // Cyan
    }
  }
}

module.exports = new Logger();
